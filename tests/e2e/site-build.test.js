/**
 * Every site, built the way a release builds it and the way a laptop does,
 * then checked from the outside: the files, the HTML a search engine reads,
 * the sitemap, robots.txt, the content security policy and the SEO audit.
 *
 * In the template repository that is every example under examples/; in a
 * site, the one site. The checks every site must pass are here; each site's
 * own are in its checks.js (examples/<name>/checks.js, or
 * tests/e2e/site.checks.js once setup has installed an example).
 *
 * Production builds read waffle data from a stand-in waffle app on this
 * machine, serving the site's fixtures over HTTP, so the live path is the one
 * exercised. Each site leaves coverage/e2e/site-build-<name>.json (AGENTS.md §7).
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'node-html-parser';
import { listExamples } from '../../src/core/lib/clients/project.js';
import { siteLayout } from '../../src/core/lib/project.js';
import { E2EArtifact } from '../support/e2e-artifact.js';
import { ROOT } from '../support/shell.js';

const SITE = 'https://www.example.test';
const examples = listExamples(ROOT);
const targets = examples === null ? [null] : examples;

/** Runs a command to completion without blocking the stand-in app. */
function exec(args, env) {
    return new Promise((resolve) => {
        const child = spawn(args[0], args.slice(1), { cwd: ROOT, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', ...env } });
        let output = '';
        child.stdout.on('data', (chunk) => { output += chunk; });
        child.stderr.on('data', (chunk) => { output += chunk; });
        child.on('close', (status) => resolve({ status, output }));
    });
}

/** Every file of a build, by path relative to it. */
function filesOf(outDir) {
    const root = join(ROOT, outDir);

    return readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/'))
        .sort();
}

const meta = (root, key, value) => root.querySelector(`meta[${key}="${value}"]`)?.getAttribute('content');

for (const example of targets) {
    const name = example ?? 'site';
    const layout = siteLayout({ examples, requested: example });
    const base = example === null ? {} : { SITE_EXAMPLE: example };
    const out = { production: `coverage/e2e/${name}/production`, development: `coverage/e2e/${name}/development`, failing: `coverage/e2e/${name}/failing` };
    const info = example === null ? null : JSON.parse(readFileSync(join(ROOT, 'examples', example, 'example.json'), 'utf8'));
    const checksFile = example === null ? join(ROOT, 'tests/e2e/site.checks.js') : join(ROOT, 'examples', example, 'checks.js');

    describe(name, () => {
        const app = { requests: [], fail: false };
        const results = {};
        const artifact = new E2EArtifact(`site-build-${name}`);
        let server;

        before(async () => {
            server = createServer((request, response) => {
                app.requests.push(`${request.method} ${request.url}`);
                const file = join(ROOT, layout.fixturesDir, `${request.url}.json`);

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
            const appUrl = `http://127.0.0.1:${server.address().port}`;

            for (const dir of Object.values(out)) {
                rmSync(join(ROOT, dir), { recursive: true, force: true });
            }

            const production = { ...base, SITE_ENV: 'production', SITE_URL: SITE, WAFFLE_APP_URL: appUrl };

            results.check = await exec(['node', 'tools/check.mjs'], base);
            results.production = await exec(['npx', 'astro', 'build'], { ...production, SITE_OUT_DIR: out.production });
            results.productionAudit = await exec(['node', 'tools/audit.mjs', out.production], production);
            results.requestsAfterProduction = [...app.requests];
            results.development = await exec(['npx', 'astro', 'build'], { ...base, SITE_OUT_DIR: out.development });
            results.developmentAudit = await exec(['node', 'tools/audit.mjs', out.development], base);
            results.requestsAfterDevelopment = [...app.requests];

            app.fail = true;
            results.failing = await exec(['npx', 'astro', 'build'], { ...production, SITE_OUT_DIR: out.failing });
            app.fail = false;

            results.noSiteUrl = await exec(['npx', 'astro', 'build'], { ...base, SITE_ENV: 'production', WAFFLE_APP_URL: appUrl, SITE_OUT_DIR: out.failing });
        });

        after(() => {
            server?.close();
        });

        /** What a site's checks.js gets: its two builds, read from the outside. */
        const site = {
            name,
            url: SITE,
            artifact,
            requests: () => results.requestsAfterProduction,
            files: (build = 'production') => filesOf(out[build]),
            html: (file, build = 'production') => parse(readFileSync(join(ROOT, out[build], file), 'utf8')),
            text: (file, build = 'production') => readFileSync(join(ROOT, out[build], file), 'utf8'),
            exists: (file, build = 'production') => existsSync(join(ROOT, out[build], file)),
            graph: (file, build = 'production') => JSON.parse(site.html(file, build).querySelector('script[type="application/ld+json"]').text)['@graph'],
        };

        it('type-checks (astro check)', () => {
            assert.equal(results.check.status, 0, results.check.output);
            artifact.check('astro check passes', results.check.status === 0);
        });

        it('builds for production and passes the SEO audit with no errors', () => {
            assert.equal(results.production.status, 0, results.production.output);
            assert.equal(results.productionAudit.status, 0, results.productionAudit.output);
            assert.match(results.productionAudit.output, /production, https:\/\/www\.example\.test\): 0 errors/);

            artifact.check('production build succeeds', results.production.status === 0);
            artifact.check('production audit has no errors', results.productionAudit.status === 0);
            artifact.fact('production pages', site.files().filter((file) => file.endsWith('.html')));

            for (const file of site.files()) {
                artifact.file(file, createHash('sha256').update(readFileSync(join(ROOT, out.production, file))).digest('hex'));
            }
        });

        it('has a home page and a 404 page, and keeps the 404 out of search results', () => {
            assert.equal(site.html('index.html').querySelector('link[rel="canonical"]')?.getAttribute('href'), `${SITE}/`);
            assert.equal(meta(site.html('index.html'), 'name', 'robots'), 'index, follow');
            assert.equal(meta(site.html('404.html'), 'name', 'robots'), 'noindex, follow');
            artifact.fact('home title', site.html('index.html').querySelector('title')?.text);
        });

        it('invites robots in production and names the sitemap, which lists no 404', () => {
            const robots = site.text('robots.txt');
            const sitemap = site.text('sitemap-0.xml');

            assert.equal(robots, `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap-index.xml\n`);
            assert.equal(sitemap.includes('/404'), false);
            artifact.fact('robots.txt', robots);
            artifact.fact('sitemap', [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort());
        });

        it('names the business on every page, as the type its example.json declares', () => {
            const business = site.graph('index.html')[0];

            assert.equal(business['@id'], `${SITE}/#organization`);
            assert.equal('aggregateRating' in business, false);

            if (info !== null) {
                assert.equal(business['@type'], info.schemaType);
            }

            artifact.fact('business type', business['@type']);
        });

        it('carries Astro\'s content security policy on every page', () => {
            for (const file of site.files().filter((path) => path.endsWith('.html'))) {
                const policy = site.html(file).querySelectorAll('meta').find((element) => element.getAttribute('http-equiv') === 'content-security-policy');
                assert.ok(policy, `${file} has no content security policy`);
            }

            artifact.check('every page carries a content security policy', true);
        });

        it('reads the waffle app over HTTP in production, once per endpoint', () => {
            const requests = results.requestsAfterProduction;

            assert.deepEqual(requests, [...new Set(requests)]);
            assert.ok(requests.every((request) => request.startsWith('GET /api/site/')), requests.join(', '));

            if (info !== null) {
                const declared = info.waffleEndpoints.filter((endpoint) => endpoint.startsWith('GET ')).sort();
                assert.deepEqual([...requests].sort(), declared, 'example.json lists every GET endpoint the site reads, and only those');
            }

            artifact.fact('waffle requests', [...requests].sort());
        });

        it('keeps every robot out of a development build, which reads fixtures, not the network', () => {
            assert.equal(results.development.status, 0, results.development.output);
            assert.equal(results.developmentAudit.status, 0, results.developmentAudit.output);
            assert.equal(site.text('robots.txt', 'development'), 'User-agent: *\nDisallow: /\n');

            const robots = site.files('development')
                .filter((file) => file.endsWith('.html'))
                .map((file) => meta(site.html(file, 'development'), 'name', 'robots'));

            assert.deepEqual([...new Set(robots)], ['noindex, nofollow']);
            assert.deepEqual(results.requestsAfterDevelopment, results.requestsAfterProduction);
            artifact.check('development build keeps every robot out', true);
        });

        it('fails a production build, naming the endpoint, when the waffle app refuses', () => {
            if (results.requestsAfterProduction.length === 0) {
                return;
            }

            assert.notEqual(results.failing.status, 0);
            assert.match(results.failing.output, /\/api\/site\/[a-z0-9/-]+ answered HTTP 500: Database unavailable\./);
            artifact.check('a refusing app fails the build', results.failing.status !== 0);
        });

        it('refuses a production build without SITE_URL before it starts', () => {
            assert.notEqual(results.noSiteUrl.status, 0);
            assert.match(results.noSiteUrl.output, /SITE_URL is required for a production build/);
        });

        describe('its own checks', async () => {
            assert.ok(existsSync(checksFile), `no ${relative(ROOT, checksFile)}: every site has its own checks`);
            const { default: checks } = await import(pathToFileURL(checksFile).href);
            checks({ it, assert, site });
        });

        it('writes its artifact, and every check passed', () => {
            const path = artifact.write();
            const written = JSON.parse(readFileSync(path, 'utf8'));

            assert.equal(written.passed, true);
            assert.match(written.sha256, /^[0-9a-f]{64}$/);
        });
    });
}
