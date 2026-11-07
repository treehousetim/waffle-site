/**
 * docker/caddy/Caddyfile and the Compose files, asserted by shape
 * (docs/https.md, failure list). tools/test.sh also has Caddy itself validate
 * the file; this says the rules are there and in the right order.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from '../support/shell.js';

// Whole-line comments stripped, as the file's header promises.
const caddyfile = read('docker/caddy/Caddyfile').split('\n').filter((line) => !/^\s*#/.test(line)).join('\n');
const compose = read('docker-compose.yml');
const prod = read('docker-compose.prod.yml').split('\n').filter((line) => !/^\s*#/.test(line)).join('\n');

const block = (start) => {
    const at = caddyfile.indexOf(start);
    assert.notEqual(at, -1, `no ${start} in the Caddyfile`);
    let depth = 0;

    // The block's own brace: the first one after the opening words, which may
    // themselves hold a {placeholder}.
    for (let i = caddyfile.indexOf('{', at + start.length - 1); i < caddyfile.length; i += 1) {
        if (caddyfile[i] === '{') depth += 1;
        if (caddyfile[i] === '}') depth -= 1;
        if (depth === 0) return caddyfile.slice(at, i + 1);
    }

    return assert.fail(`unclosed ${start}`);
};

test('(1) the security headers are deferred, so nothing upstream can drop one', () => {
    const headers = block('(security_headers)');

    assert.match(headers, /^\s*defer$/m);
    for (const name of ['Strict-Transport-Security', 'X-Content-Type-Options "nosniff"', 'Content-Security-Policy', 'Referrer-Policy', 'Permissions-Policy', '-Server']) {
        assert.ok(headers.includes(name), name);
    }
});

test('(1) the headers are on the site and on every error page', () => {
    const imports = caddyfile.match(/import security_headers/g) ?? [];

    assert.equal(imports.length, 3);
});

test('(2) the header carries the policy a page cannot: framing, form targets, plugins, base', () => {
    const policy = caddyfile.match(/Content-Security-Policy "([^"]+)"/)[1];

    // Scripts, styles and the rest are in each page's own policy, which Astro
    // hashes at build time (astro.config.mjs, security.csp); a header with a
    // script-src would override those hashes and break every page.
    assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval|\*|script-src|style-src|default-src/);
    for (const rule of ["frame-ancestors 'none'", "form-action 'self'", "object-src 'none'", "base-uri 'self'"]) {
        assert.ok(policy.includes(rule), rule);
    }
});

test('(3) one route, in the order the security depends on', () => {
    const route = block('route {');
    const order = ['respond @dotfiles 404', 'respond @crossSite', 'handle /api/site/*', 'handle /_astro/*', 'header Cache-Control "public, max-age=0, must-revalidate"', 'file_server'];
    let from = 0;

    // Each rule must come after the one before it.
    for (const part of order) {
        const at = route.indexOf(part, from);
        assert.notEqual(at, -1, `${part} is missing, or comes before the rule it must follow`);
        from = at + part.length;
    }
});

test('the release\'s own redirects and 410s, after the proxy and before any file (docs/scoped-builds.md)', () => {
    const route = block('route {');
    const at = route.indexOf('import {$SITE_ROOT}/redirects*.caddy');

    assert.notEqual(at, -1, 'the redirects snippet is not imported');
    assert.ok(at > route.indexOf('handle /api/site/*') && at < route.indexOf('handle /_astro/*'));
});

test('(4) dotfiles are refused, except .well-known', () => {
    const dotfiles = block('@dotfiles {');

    assert.match(dotfiles, /path_regexp \/\\\./);
    assert.match(dotfiles, /not path \/\.well-known\/\*/);
});

test('(5) a cross-site form post is refused before it reaches the app', () => {
    const crossSite = block('@crossSite {');

    assert.match(crossSite, /path \/api\/site\/\*/);
    assert.match(crossSite, /header_regexp Sec-Fetch-Site \^\(cross-site\|same-site\)\$/);
});

test('(6) the proxy adds the site key and leaves the visitor\'s cookies and origin behind', () => {
    const proxy = block('reverse_proxy {$WAFFLE_APP_URL}');

    for (const line of ['header_up Host {upstream_hostport}', 'header_up X-Site-Key {$WAFFLE_SITE_KEY}', 'header_up X-Visitor-Address {client_ip}', 'header_up -Cookie',
        'header_up -Authorization', 'header_up -Origin', 'header_up -Referer', 'header_up -Sec-Fetch-Site', 'header_down -Set-Cookie']) {
        assert.ok(proxy.includes(line), line);
    }

    assert.match(block('handle /api/site/*'), /header Cache-Control "no-store"/);
});

test('(7) hashed assets are cached for a year; pages are revalidated every time', () => {
    assert.match(block('handle /_astro/*'), /Cache-Control "public, max-age=31536000, immutable"/);
    assert.match(block('route {'), /header Cache-Control "public, max-age=0, must-revalidate"/);
});

test('(8) a missing page gets the site\'s 404 page with a 404 status', () => {
    const notFound = block('handle_errors 404 {');

    assert.match(notFound, /rewrite \* \/404\.html/);
    assert.match(notFound, /status 404/);
});

test('(9) request bodies are small: forms are all this site accepts', () => {
    assert.match(block('request_body {'), /max_size 64KB/);
});

test('(10) locally: plain HTTP on loopback, dist/ served, a waffle app on this machine', () => {
    assert.match(compose, /SITE_ADDRESS: ":80"/);
    assert.match(compose, /SITE_ROOT: \/srv\/site\/dist/);
    assert.match(compose, /- "127\.0\.0\.1:\$\{HTTP_PORT:-8090\}:80"/);
    assert.match(compose, /WAFFLE_APP_URL: \$\{WAFFLE_APP_URL:-http:\/\/host\.docker\.internal:8080\}/);
    assert.match(compose, /\.:\/srv\/site:ro/);
});

test('(10) in production: the hostname, the current release, the key from Doppler or nothing', () => {
    assert.ok(prod.split('\n').includes('      SITE_ADDRESS: waffle-site.example.com'), 'SITE_ADDRESS is the site\'s hostname');
    assert.match(prod, /SITE_ROOT: \/srv\/site\/current/);
    assert.ok(prod.split('\n').includes('      WAFFLE_APP_URL: https://app.waffle-site.example.com'), 'WAFFLE_APP_URL is the app\'s origin');
    assert.match(prod, /WAFFLE_SITE_KEY: \$\{WAFFLE_SITE_KEY:\?/);
    assert.match(prod, /extra_hosts: !reset \[\]/);
    assert.match(prod, /restart: unless-stopped/);
});

test('(11; the app\'s docs/edge.md, 1) plain HTTP for the hostname only, no public port, no certificate: the server\'s front Caddy has them', () => {
    assert.match(caddyfile, /^http:\/\/\{\$SITE_ADDRESS\} \{$/m);
    assert.match(prod, /ports: !reset \[\]/);
    assert.doesNotMatch(prod + compose, /caddy_data|caddy_config/);
});

test('(the app\'s docs/edge.md, 2) forwarded addresses are trusted only from private networks, so the app gets the visitor\'s', () => {
    assert.match(caddyfile, /^\{\n\tservers \{\n\t\ttrusted_proxies static private_ranges\n\t\}\n\}$/m);
    assert.match(block('handle /api/site/*'), /header_up X-Visitor-Address \{client_ip\}/);
});

test('(the app\'s docs/edge.md, 3) on the front Caddy\'s network under the name its Caddyfile uses', () => {
    assert.match(prod, /networks:\n {6}default:\n {6}edge:\n {8}aliases: \[waffle-site\]/);
    assert.match(prod, /^networks:\n {2}edge:\n {4}external: true$/m);
});

test('Caddy is an exact patch, and the suite validates with the image the site runs', () => {
    const image = compose.match(/image: (caddy:\S+)/)?.[1];
    assert.equal(image, 'caddy:2.11.9');
    assert.ok(read('tools/test.sh').includes(` ${image} caddy validate`), 'tools/test.sh validates with another image');
});

test('names the Compose project for the slug, whatever folder the site is in', () => {
    // Containers and volumes then belong to the site wherever it is cloned;
    // on the server the folder is /opt/<slug>, so the names agree.
    assert.ok(read('docker-compose.yml').split('\n').includes('name: waffle_site'));
});
