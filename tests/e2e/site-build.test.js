/**
 * The whole site, built the way a release builds it and the way a laptop
 * does, then checked from the outside: the files, the HTML a search engine
 * reads, the sitemap, robots.txt, the feed and the SEO audit.
 *
 * The production build reads its waffle data from a stand-in waffle app on
 * this machine (it serves api-fixtures/ over HTTP), so the live path is the
 * one exercised. Ends by writing coverage/e2e/site-build.json (AGENTS.md §7).
 */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, relative, sep } from 'node:path';
import { parse } from 'node-html-parser';
import { E2EArtifact } from '../support/e2e-artifact.js';
import { ROOT } from '../support/shell.js';

const SITE = 'https://www.example.test';
const OUT = { production: 'coverage/e2e/production', development: 'coverage/e2e/development', failing: 'coverage/e2e/failing' };
const artifact = new E2EArtifact('site-build');

/** Requests the stand-in waffle app received, and whether to fail them. */
const app = { requests: [], fail: false };
let server;
let appUrl;

/** Runs a command to completion without blocking the stand-in app. */
function exec(args, env) {
    return new Promise((resolve) => {
        const child = spawn(args[0], args.slice(1), {
            cwd: ROOT,
            env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', ...env },
        });
        let output = '';
        child.stdout.on('data', (chunk) => { output += chunk; });
        child.stderr.on('data', (chunk) => { output += chunk; });
        child.on('close', (status) => resolve({ status, output }));
    });
}

const build = (outDir, env) => exec(['npx', 'astro', 'build'], { SITE_OUT_DIR: outDir, ...env });
const audit = (outDir, env) => exec(['node', 'tools/audit.mjs', outDir], env);

const productionEnv = () => ({ SITE_ENV: 'production', SITE_URL: SITE, WAFFLE_APP_URL: appUrl });

const results = {};

before(async () => {
    server = createServer((request, response) => {
        app.requests.push(`${request.method} ${request.url}`);
        const file = join(ROOT, 'api-fixtures', `${request.url}.json`);

        if (app.fail) {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ success: false, error: 'Database unavailable.' }));
        } else if (request.method === 'GET' && request.url.startsWith('/api/site/') && existsSync(file)) {
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(readFileSync(file));
        } else {
            response.writeHead(404, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ success: false, error: 'Not found.' }));
        }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    appUrl = `http://127.0.0.1:${server.address().port}`;

    for (const dir of Object.values(OUT)) {
        rmSync(join(ROOT, dir), { recursive: true, force: true });
    }

    results.check = await exec(['npx', 'astro', 'check'], {});
    results.production = await build(OUT.production, productionEnv());
    results.productionAudit = await audit(OUT.production, productionEnv());
    results.appRequestsAfterProduction = [...app.requests];
    results.development = await build(OUT.development, {});
    results.developmentAudit = await audit(OUT.development, {});
    results.appRequestsAfterDevelopment = [...app.requests];
});

after(() => {
    server?.close();
});

/** Every file of a build, by served path, with its text. */
function files(outDir) {
    const root = join(ROOT, outDir);

    return readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/'))
        .sort();
}

const html = (outDir, file) => parse(readFileSync(join(ROOT, outDir, file), 'utf8'));
const text = (outDir, file) => readFileSync(join(ROOT, outDir, file), 'utf8');
const meta = (root, key, value) => root.querySelector(`meta[${key}="${value}"]`)?.getAttribute('content');

test('the site type-checks (astro check)', () => {
    assert.equal(results.check.status, 0, results.check.output);
    artifact.check('astro check passes', results.check.status === 0);
});

test('a production build succeeds and passes the SEO audit with no errors', () => {
    assert.equal(results.production.status, 0, results.production.output);
    assert.equal(results.productionAudit.status, 0, results.productionAudit.output);
    assert.match(results.productionAudit.output, /\(production, https:\/\/www\.example\.test\): 0 errors/);

    artifact.check('production build succeeds', results.production.status === 0);
    artifact.check('production audit has no errors', results.productionAudit.status === 0);
});

test('production builds every page, and no draft', () => {
    const built = files(OUT.production).filter((file) => file.endsWith('.html'));

    for (const page of ['index.html', 'services/index.html', 'services/panel-upgrades/index.html', 'services/ev-chargers/index.html',
        'areas/index.html', 'areas/riverside/index.html', 'prices/index.html', 'reviews/index.html', 'emergency/index.html',
        'faq/index.html', 'about/index.html', 'contact/index.html', 'contact/thanks/index.html', 'privacy/index.html', '404.html',
        'blog/index.html', 'blog/2/index.html', 'blog/3/index.html', 'blog/signs-you-need-a-panel-upgrade/index.html',
        'blog/tags/safety/index.html']) {
        assert.ok(built.includes(page), `${page} was not built`);
    }

    assert.equal(built.includes('blog/electrical-safety-checklist-winter/index.html'), false, 'a draft reached the production build');
    artifact.fact('production pages', built);
    artifact.check('no draft in production', !built.includes('blog/electrical-safety-checklist-winter/index.html'));

    for (const file of files(OUT.production)) {
        artifact.file(file, createHash('sha256').update(readFileSync(join(ROOT, OUT.production, file))).digest('hex'));
    }
});

test('production pages carry what search engines read', () => {
    const pages = {};

    for (const file of files(OUT.production).filter((name) => name.endsWith('.html'))) {
        const root = html(OUT.production, file);
        pages[file] = {
            title: root.querySelector('title')?.text,
            robots: meta(root, 'name', 'robots'),
            canonical: root.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
            h1: root.querySelector('h1')?.text.trim(),
        };
    }

    assert.deepEqual(pages['index.html'].canonical, `${SITE}/`);
    assert.equal(pages['index.html'].robots, 'index, follow');
    assert.equal(pages['prices/index.html'].canonical, `${SITE}/prices/`);
    assert.equal(pages['404.html'].robots, 'noindex, follow');
    assert.equal(pages['404.html'].canonical, null);
    assert.equal(pages['contact/thanks/index.html'].robots, 'noindex, follow');

    artifact.fact('production page heads', pages);
    artifact.check('home is indexable and canonical', pages['index.html'].canonical === `${SITE}/`);
    artifact.check('404 and thanks are noindex', pages['404.html'].robots === 'noindex, follow' && pages['contact/thanks/index.html'].robots === 'noindex, follow');
});

test('production robots.txt invites robots and names the sitemap; the sitemap lists exactly the listed pages', () => {
    const robots = text(OUT.production, 'robots.txt');
    const sitemap = text(OUT.production, 'sitemap-0.xml');
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();

    assert.equal(robots, `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap-index.xml\n`);
    assert.ok(urls.includes(`${SITE}/prices/`));
    assert.ok(urls.includes(`${SITE}/areas/lakewood/`));
    assert.ok(urls.includes(`${SITE}/blog/signs-you-need-a-panel-upgrade/`));
    assert.equal(urls.some((url) => url.includes('/contact/thanks/') || url.includes('404') || url.includes('winter')), false);

    artifact.fact('robots.txt', robots);
    artifact.fact('sitemap', urls);
    artifact.check('sitemap leaves out noindex pages and drafts', !urls.some((url) => url.includes('/contact/thanks/') || url.includes('404') || url.includes('winter')));
});

test('the price guide shows the waffle app\'s prices, fetched once over HTTP', () => {
    const root = html(OUT.production, 'prices/index.html');
    const rows = root.querySelectorAll('.guide .item').map((item) => [
        item.querySelector('dt').childNodes[0].text.trim(),
        item.querySelector('dd strong').text.trim(),
    ]);

    assert.equal(rows.length, 12);
    assert.deepEqual(rows[0], ['Written estimate', 'Free']);
    assert.ok(rows.some(([name, price]) => name === '200-amp panel upgrade' && price === '$2,400'));
    assert.deepEqual(results.appRequestsAfterProduction, ['GET /api/site/prices']);

    artifact.fact('price guide', rows);
    artifact.check('prices came from the app in one request', results.appRequestsAfterProduction.length === 1);
});

test('a service page shows only its own prices, and links back to the guide', () => {
    const root = html(OUT.production, 'services/panel-upgrades/index.html');
    const names = root.querySelectorAll('.guide .item dt a').map((link) => link.text.trim());

    assert.deepEqual(names, ['200-amp panel upgrade', 'Subpanel installation']);
    assert.ok(root.querySelector('a[href="/prices/"]'));
    artifact.fact('panel upgrade page prices', names);
});

test('every page names the business; services, FAQs and posts carry their own structured data', () => {
    const graph = (file) => JSON.parse(html(OUT.production, file).querySelector('script[type="application/ld+json"]').text)['@graph'];
    const business = graph('index.html')[0];

    assert.equal(business['@type'], 'Electrician');
    assert.equal(business.telephone, '+12175550142');
    assert.equal(business.address.addressLocality, 'Springfield');
    assert.equal(business.areaServed.length, 6);
    assert.equal('aggregateRating' in business, false);
    assert.deepEqual(graph('services/ev-chargers/index.html').map((node) => node['@type']), ['Electrician', 'WebSite', 'WebPage', 'BreadcrumbList', 'Service', 'FAQPage']);
    assert.ok(graph('prices/index.html').some((node) => node['@type'] === 'FAQPage'));
    assert.deepEqual(graph('blog/signs-you-need-a-panel-upgrade/index.html').map((node) => node['@type']), ['Electrician', 'WebSite', 'WebPage', 'BreadcrumbList', 'BlogPosting']);
    assert.equal(meta(html(OUT.production, 'blog/signs-you-need-a-panel-upgrade/index.html'), 'property', 'og:type'), 'article');

    artifact.fact('business', { type: business['@type'], telephone: business.telephone, towns: business.areaServed.map((town) => town.name) });
    artifact.fact('service structured data', graph('services/ev-chargers/index.html').map((node) => node['@type']));
});

test('the phone number is tappable everywhere', () => {
    for (const file of ['index.html', 'emergency/index.html', 'areas/oakdale/index.html', 'blog/afci-breakers/index.html']) {
        assert.ok(html(OUT.production, file).querySelector('a[href="tel:+12175550142"]'), file);
    }
    artifact.check('tel: links on every kind of page', true);
});

test('the cover image is optimised, sized and described', () => {
    const img = html(OUT.production, 'blog/signs-you-need-a-panel-upgrade/index.html').querySelector('img.cover');

    assert.ok(img, 'no cover image');
    assert.match(img.getAttribute('src'), /^\/_astro\/.+\.webp$/);
    assert.ok(img.getAttribute('width') && img.getAttribute('height'));
    assert.match(img.getAttribute('alt'), /labelled breakers/);
    artifact.check('cover image is webp with a size and alt text', true);
});

test('the feed lists every published post, newest first, and no draft', () => {
    const titles = [...text(OUT.production, 'blog/rss.xml').matchAll(/<item><title>([^<]+)<\/title>/g)].map((match) => match[1]);

    assert.equal(titles.length, 24);
    assert.equal(titles[0], 'Why your breaker keeps tripping, and when to worry');
    assert.equal(titles.some((title) => title.includes('winter')), false);
    artifact.fact('feed', titles);
});

test('the blog paginates, with a distinct title on each page', () => {
    const title = (file) => html(OUT.production, file).querySelector('title').text;

    assert.equal(title('blog/index.html'), 'Electrical advice — Waffle Site');
    assert.equal(title('blog/2/index.html'), 'Electrical advice, page 2 — Waffle Site');
    assert.equal(existsSync(join(ROOT, OUT.production, 'blog/4/index.html')), false);
    artifact.fact('blog pages', [title('blog/index.html'), title('blog/2/index.html'), title('blog/3/index.html')]);
});

test('the quote form posts to the proxied waffle app, works without script, and carries the honeypot', () => {
    const form = html(OUT.production, 'contact/index.html').querySelector('form[data-site-form]');

    assert.equal(form.getAttribute('action'), '/api/site/forms/quote');
    assert.equal(form.getAttribute('method'), 'post');
    assert.equal(form.querySelector('input[name="redirect"]').getAttribute('value'), '/contact/thanks/');
    assert.ok(form.querySelector('input[name="company_website"]'));
    assert.ok(form.querySelector('input[name="phone"][required]'));
    assert.equal(form.querySelectorAll('select[name="service"] option').length, 10);

    artifact.fact('quote form', { action: form.getAttribute('action'), redirect: '/contact/thanks/' });
});

test('a development build is never indexable and shows drafts', () => {
    assert.equal(results.development.status, 0, results.development.output);
    assert.equal(results.developmentAudit.status, 0, results.developmentAudit.output);
    assert.equal(text(OUT.development, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

    const robots = files(OUT.development)
        .filter((file) => file.endsWith('.html'))
        .map((file) => meta(html(OUT.development, file), 'name', 'robots'));

    assert.deepEqual([...new Set(robots)], ['noindex, nofollow']);
    assert.ok(existsSync(join(ROOT, OUT.development, 'blog/electrical-safety-checklist-winter/index.html')));

    artifact.check('development build keeps every robot out', robots.every((value) => value === 'noindex, nofollow'));
    artifact.check('development build shows drafts', existsSync(join(ROOT, OUT.development, 'blog/electrical-safety-checklist-winter/index.html')));
});

test('a development build reads fixtures, not the network', () => {
    assert.deepEqual(results.appRequestsAfterDevelopment, results.appRequestsAfterProduction);
    assert.match(text(OUT.development, 'prices/index.html'), /200-amp panel upgrade/);
    artifact.check('development build made no request to the app', results.appRequestsAfterDevelopment.length === results.appRequestsAfterProduction.length);
});

test('a production build fails, naming the URL, when the waffle app refuses', async () => {
    app.fail = true;
    const failed = await build(OUT.failing, productionEnv());
    app.fail = false;

    assert.notEqual(failed.status, 0);
    assert.match(failed.output, /\/api\/site\/prices answered HTTP 500: Database unavailable\./);
    artifact.check('a refusing app fails the build', failed.status !== 0);
});

test('a production build without SITE_URL is refused before it starts', async () => {
    const failed = await build(OUT.failing, { SITE_ENV: 'production', WAFFLE_APP_URL: appUrl });

    assert.notEqual(failed.status, 0);
    assert.match(failed.output, /SITE_URL is required for a production build/);
    artifact.check('production without SITE_URL is refused', failed.status !== 0);
});

test('the artifact is written and every check passed', () => {
    const path = artifact.write();
    const written = JSON.parse(readFileSync(path, 'utf8'));

    assert.equal(written.passed, true);
    assert.match(written.sha256, /^[0-9a-f]{64}$/);
});
