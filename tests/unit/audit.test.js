// src/lib/audit.js — docs/seo.md, the audit's numbered rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { auditSite, internalPath, servedPath, sitemapLocs } from '../../src/core/lib/audit.js';

const hash = (content) => `'sha256-${createHash('sha256').update(content).digest('base64')}'`;
const INLINE_SCRIPT = 'console.log(1)';
const INLINE_STYLE = ':root{--x:1}';
const policy = (extra = '') => `<meta http-equiv="content-security-policy" content="default-src 'self'; script-src 'self' ${hash(INLINE_SCRIPT)}; style-src 'self' ${hash(INLINE_STYLE)}${extra}">`;

const SITE = 'https://www.acme.com';

/**
 * A page that passes every rule. `head` and `body` replace the defaults;
 * `drop` removes a default head line by a substring it contains.
 */
function page(path, { title, description, head = '', body, drop = [], robots = 'index, follow', html = '<html lang="en">' } = {}) {
    const name = path === '/' ? 'Home' : path.replaceAll('/', ' ').trim();
    const canonical = SITE + path;
    const lines = [
        '<meta charset="utf-8">',
        policy(),
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        `<title>${title ?? `${name} — Acme`}</title>`,
        `<meta name="description" content="${description ?? `All about ${name}, written long enough to be a real description for it.`}">`,
        `<meta name="robots" content="${robots}">`,
        `<link rel="canonical" href="${canonical}">`,
        `<meta property="og:title" content="${name}">`,
        `<meta property="og:description" content="About ${name}.">`,
        '<meta property="og:type" content="website">',
        `<meta property="og:url" content="${canonical}">`,
        `<meta property="og:image" content="${SITE}/og-default.png">`,
        '<meta name="twitter:card" content="summary_large_image">',
        '<link rel="stylesheet" href="/_astro/site.css">',
        '<script type="module" src="/_astro/site.js"></script>',
        '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[]}</script>',
    ].filter((line) => !drop.some((part) => line.includes(part)));

    return {
        path,
        html: `<!doctype html>${html}<head>${lines.join('')}${head}</head><body>${body ?? `<h1>${name}</h1><a href="/">Home</a>`}</body></html>`,
    };
}

const PATHS = ['/', '/pricing/', '/404.html', '/robots.txt', '/og-default.png', '/_astro/site.css', '/_astro/site.js', '/logo.png'];

function input(pages, overrides = {}) {
    return {
        pages,
        paths: new Set(PATHS),
        siteUrl: SITE,
        indexable: true,
        noindexPaths: ['/404'],
        sitemap: pages.filter((p) => p.path !== '/404.html').map((p) => SITE + p.path),
        robots: `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap-index.xml\n`,
        ...overrides,
    };
}

const errorsFor = (pages, overrides) => auditSite(input(pages, overrides)).errors;
const notFound = () => page('/404.html', { robots: 'noindex, follow', drop: ['canonical', 'og:', 'twitter:'] });

test('a good site passes clean', () => {
    assert.deepEqual(auditSite(input([page('/'), page('/pricing/'), notFound()])), { errors: [], warnings: [] });
});

test('(1) an empty build fails', () => {
    assert.deepEqual(errorsFor([]), ['the build has no pages.']);
});

test('(2) the page needs a language and a viewport', () => {
    assert.deepEqual(errorsFor([page('/', { html: '<html>' })]), ['/: <html> has no lang attribute.']);
    assert.deepEqual(errorsFor([page('/', { html: '<html lang=" ">' })]), ['/: <html> has no lang attribute.']);
    assert.match(errorsFor([page('/', { drop: ['viewport'] })])[0], /no <meta name="viewport">/);
});

test('(3) one non-empty title; a long one is a warning', () => {
    assert.deepEqual(errorsFor([page('/', { drop: ['<title>'] })]), ['/: expected one <title>, found 0.']);
    assert.deepEqual(errorsFor([page('/', { head: '<title>Again</title>' })]), ['/: expected one <title>, found 2.']);
    assert.deepEqual(errorsFor([page('/', { title: '  ' })]), ['/: the <title> is empty.']);
    assert.deepEqual(auditSite(input([page('/', { title: 'x'.repeat(66) })])).warnings, [
        '/: the title is 66 characters; past 65 it is cut off in results.',
    ]);
});

test('(4) a description; too short or too long is a warning', () => {
    assert.deepEqual(errorsFor([page('/', { drop: ['name="description"'] })]), ['/: no <meta name="description">.']);
    assert.match(auditSite(input([page('/', { description: 'Short.' })])).warnings[0], /the description is 6 characters; aim for 50-160/);
    assert.match(auditSite(input([page('/', { description: 'x'.repeat(161) })])).warnings[0], /161 characters/);
});

test('(5) exactly one h1, with words', () => {
    assert.deepEqual(errorsFor([page('/', { body: '<h2>x</h2>' })]), ['/: expected one <h1>, found 0.']);
    assert.deepEqual(errorsFor([page('/', { body: '<h1>a</h1><h1>b</h1>' })]), ['/: expected one <h1>, found 2.']);
    assert.deepEqual(errorsFor([page('/', { body: '<h1> </h1>' })]), ['/: the <h1> is empty.']);
});

test('(6) robots: present, and never indexing what should not be indexed', () => {
    assert.deepEqual(errorsFor([page('/', { drop: ['name="robots"'] })]), ['/: no <meta name="robots">.']);
    assert.deepEqual(errorsFor([page('/', { robots: 'noindex, follow' })]), [
        '/: robots are told not to index this page ("noindex, follow"); add it to noindex in site.ts if that is meant.',
    ]);
    assert.deepEqual(errorsFor([page('/'), page('/404.html', { robots: 'index, follow', drop: ['canonical'] })], { sitemap: [`${SITE}/`] }), [
        '/404.html: this page is listed as noindex in site.ts, but robots may index it.',
    ]);
});

test('(6) a build that is not for production must keep robots out of every page', () => {
    const dev = { indexable: false, robots: 'User-agent: *\nDisallow: /\n', sitemap: null };

    assert.deepEqual(errorsFor([page('/')], dev), ['/: this build is not for production, but robots may index it ("index, follow").']);
    assert.deepEqual(errorsFor([page('/', { robots: 'noindex, nofollow' })], dev), []);
});

test('(7) a listed page names itself as canonical, once', () => {
    assert.deepEqual(errorsFor([page('/', { drop: ['canonical'] })]), ['/: expected one <link rel="canonical">, found 0.']);
    assert.deepEqual(errorsFor([page('/', { head: `<link rel="canonical" href="${SITE}/">` })]), ['/: expected one <link rel="canonical">, found 2.']);
    assert.deepEqual(errorsFor([page('/pricing/', { drop: ['canonical'], head: `<link rel="canonical" href="${SITE}/pricing">` })], { sitemap: [`${SITE}/pricing/`] }), [
        '/pricing/: the canonical URL is https://www.acme.com/pricing, expected https://www.acme.com/pricing/.',
    ]);
    assert.deepEqual(errorsFor([page('/', { drop: ['canonical'], head: '<link rel="canonical">' })]), [
        '/: the canonical URL is (empty), expected https://www.acme.com/.',
    ]);
});

test('(8) a listed page has Open Graph tags and a card type, with an absolute image', () => {
    assert.deepEqual(errorsFor([page('/', { drop: ['og:image'] })]), ['/: no <meta property="og:image">.']);
    assert.deepEqual(errorsFor([page('/', { drop: ['og:title'] })]), ['/: no <meta property="og:title">.']);
    assert.deepEqual(errorsFor([page('/', { drop: ['og:image'], head: '<meta property="og:image" content="/og.png">' })]), [
        '/: og:image must be an absolute URL; got /og.png.',
    ]);
    assert.deepEqual(errorsFor([page('/', { drop: ['twitter:card'] })]), ['/: no <meta name="twitter:card">.']);
});

test('(9) images need alt text; a missing size is a warning', () => {
    assert.deepEqual(errorsFor([page('/', { body: '<h1>x</h1><img src="/logo.png" width="1" height="1">' })]), [
        '/: <img src="/logo.png"> has no alt attribute.',
    ]);
    assert.deepEqual(errorsFor([page('/', { body: '<h1>x</h1><img src="/logo.png" alt="" width="1" height="1">' })]), []);
    assert.deepEqual(auditSite(input([page('/', { body: '<h1>x</h1><img alt="Logo">' })])).warnings, [
        '/: <img src="(no src)"> has no width and height; the page will shift as it loads.',
    ]);
});

test('(10) links and assets on the site must be in the build; others are not checked', () => {
    const body = [
        '<h1>x</h1>',
        '<a href="/missing/">a</a>',
        '<a href="pricing/">relative, fine</a>',
        `<a href="${SITE}/pricing/?ref=nav#plans">absolute, fine</a>`,
        '<a href="https://elsewhere.example/">external</a>',
        '<a href="mailto:hi@acme.com">mail</a>',
        '<a href="#top">fragment</a>',
        '<a href="">empty</a>',
        '<a href="/api/site/forms/contact">proxied</a>',
        '<img src="/nope.png" alt="" width="1" height="1">',
        '<script type="module" src="/_astro/gone.js"></script>',
    ].join('');

    assert.deepEqual(errorsFor([page('/', { body })]), [
        '/: links to /missing/, which is not in the build.',
        '/: links to /nope.png, which is not in the build.',
        '/: links to /_astro/gone.js, which is not in the build.',
    ]);
});

test('(11) inline scripts and styles run only when the policy hashes them', () => {
    assert.deepEqual(errorsFor([page('/', { head: `<script>${INLINE_SCRIPT}</script><style>${INLINE_STYLE}</style>` })]), []);
    assert.deepEqual(errorsFor([page('/', { body: '<h1>x</h1><script>alert(1)</script><style>h1{}</style>' })]), [
        '/: has an inline <script> the content security policy does not hash, so browsers will not run it.',
        '/: has an inline <style> the content security policy does not hash, so browsers will ignore it.',
    ]);
});

test('(11) every page has a policy with a default, and nothing unsafe in it', () => {
    assert.deepEqual(errorsFor([page('/', { drop: ['content-security-policy'] })]), [
        '/: has no content security policy <meta>; is security.csp on in astro.config.mjs?',
    ]);
    assert.deepEqual(errorsFor([page('/', { drop: ['content-security-policy'], head: `<meta http-equiv="Content-Security-Policy" content="img-src 'self'; ;script-src 'self' 'unsafe-inline'; style-src 'unsafe-eval'">` })]), [
        '/: the content security policy has no default-src.',
        "/: the content security policy's script-src allows 'unsafe-inline'.",
        "/: the content security policy's style-src allows 'unsafe-eval'.",
    ]);
    assert.deepEqual(errorsFor([page('/', { drop: ['content-security-policy'], head: '<meta http-equiv="content-security-policy">', body: '<h1>x</h1><script>1</script>' })]), [
        '/: the content security policy has no default-src.',
        '/: has an inline <script> the content security policy does not hash, so browsers will not run it.',
    ]);
});

test('(11) attributes a hash cannot cover are refused', () => {
    assert.deepEqual(errorsFor([page('/', { body: '<h1 style="color:red" onclick="go()">x</h1>' })]), [
        '/: <h1 style="..."> is blocked by the content security policy; use a class.',
        '/: <h1 onclick="..."> is blocked by the content security policy; use a script.',
    ]);
});

test('(11) JSON-LD must parse and name schema.org', () => {
    assert.deepEqual(errorsFor([page('/', { head: '<script type="application/ld+json">{nope</script>' })]), ['/: has JSON-LD that is not valid JSON.']);
    assert.deepEqual(errorsFor([page('/', { head: '<script type="application/ld+json">{"@type":"Thing"}</script>' })]), [
        '/: has JSON-LD without "@context": "https://schema.org".',
    ]);
    assert.deepEqual(errorsFor([page('/', { head: '<script type="application/ld+json">null</script>' })]), [
        '/: has JSON-LD without "@context": "https://schema.org".',
    ]);
});

test('(12) titles and descriptions are unique across the site', () => {
    const errors = errorsFor([page('/', { title: 'Same', description: 'd'.repeat(60) }), page('/pricing/', { title: 'Same', description: 'd'.repeat(60) })]);

    assert.deepEqual(errors, [
        'these pages share the title "Same": /, /pricing/',
        `these pages share the description "${'d'.repeat(60)}": /, /pricing/`,
    ]);
});

test('(13) robots.txt must exist and agree with the build', () => {
    assert.deepEqual(errorsFor([page('/')], { robots: null }), ['there is no /robots.txt.']);
    assert.deepEqual(errorsFor([page('/')], { robots: 'User-agent: *\nDisallow: /\n' }), [
        'robots.txt disallows the whole production site.',
        'robots.txt does not name a sitemap on https://www.acme.com.',
    ]);
    assert.deepEqual(
        errorsFor([page('/', { robots: 'noindex, nofollow' })], { indexable: false, robots: 'User-agent: *\nAllow: /\n' }),
        ['robots.txt must disallow everything in a build that is not for production.'],
    );
});

test('(14) the production sitemap lists every listed page and nothing else', () => {
    assert.deepEqual(errorsFor([page('/')], { sitemap: null }), ['there is no sitemap.']);
    assert.deepEqual(errorsFor([page('/'), page('/pricing/'), notFound()], {
        sitemap: [`${SITE}/`, 'https://elsewhere.example/x/', `${SITE}/gone/`, `${SITE}/404.html`],
    }), [
        'the sitemap lists https://elsewhere.example/x/, which is not on https://www.acme.com.',
        'the sitemap lists /gone/, which is not in the build.',
        'the sitemap lists /404.html, which is noindex.',
        '/pricing/ is missing from the sitemap.',
    ]);
});

test('internal paths resolve relative links and ignore everything off the site', () => {
    assert.equal(internalPath('../about/', '/blog/post/', SITE), '/blog/about/');
    assert.equal(internalPath(' /a%20b/ ', '/', SITE), '/a b/');
    assert.equal(internalPath('/a%zz', '/', SITE), '/a%zz');
    assert.equal(internalPath('//cdn.example/x', '/', SITE), null);
    assert.equal(internalPath('tel:+1555', '/', SITE), null);
});

test('a built file is served at its path, index.html at its directory', () => {
    assert.equal(servedPath('index.html'), '/');
    assert.equal(servedPath('blog/post/index.html'), '/blog/post/');
    assert.equal(servedPath('404.html'), '/404.html');
    assert.equal(servedPath('_astro/site.css'), '/_astro/site.css');
});

test('sitemap locations are read from a sitemap or an index', () => {
    const xml = '<urlset><url><loc>https://www.acme.com/</loc></url><url><loc>\n https://www.acme.com/a?x=1&amp;y=2 \n</loc></url></urlset>';

    assert.deepEqual(sitemapLocs(xml), ['https://www.acme.com/', 'https://www.acme.com/a?x=1&y=2']);
    assert.deepEqual(sitemapLocs('<sitemapindex></sitemapindex>'), []);
});
