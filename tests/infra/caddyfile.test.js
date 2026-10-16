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

test('(2) the content security policy runs nothing inline and loads nothing from elsewhere', () => {
    const policy = caddyfile.match(/Content-Security-Policy "([^"]+)"/)[1];

    assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval|\*/);
    for (const rule of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "connect-src 'self'", "frame-ancestors 'none'", "form-action 'self'", "object-src 'none'"]) {
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

    for (const line of ['header_up Host {upstream_hostport}', 'header_up X-Site-Key {$WAFFLE_SITE_KEY}', 'header_up -Cookie',
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
    assert.match(prod, /^ {6}SITE_ADDRESS: waffle-site\.example\.com$/m);
    assert.match(prod, /SITE_ROOT: \/srv\/site\/current/);
    assert.match(prod, /^ {6}WAFFLE_APP_URL: https:\/\/app\.waffle-site\.example\.com$/m);
    assert.match(prod, /WAFFLE_SITE_KEY: \$\{WAFFLE_SITE_KEY:\?/);
    assert.match(prod, /ports: !override\n\s+- "80:80"\n\s+- "443:443"\n\s+- "443:443\/udp"/);
    assert.match(prod, /extra_hosts: !reset \[\]/);
});

test('(11) the certificate store is a named volume, never a path the rsync could delete', () => {
    assert.match(prod, /- caddy_data:\/data/);
    assert.match(prod, /^volumes:\n {2}caddy_data:/m);
    assert.match(prod, /restart: unless-stopped/);
});
