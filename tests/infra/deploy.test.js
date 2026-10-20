/**
 * The server side of a release: deploy/deploy.sh, the DNS check and the
 * crontab (docs/releasing.md and docs/https.md, failure lists). Every command
 * that would reach Docker, Doppler, DNS or the network is a stand-in first on
 * PATH; the scripts themselves are the real ones.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readlinkSync, readdirSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { copyRepo, fakeBin, ROOT, run } from '../support/shell.js';

const SCRIPTS = ['deploy/deploy.sh', 'deploy/assemble.sh', 'deploy/check-dns.sh', 'deploy/render-crontab.sh',
    'tools/npm.sh', 'tools/test.sh', 'tools/release.sh', 'tools/setup.sh', 'tools/rename-project.sh',
    'tools/setup-github.sh', 'tools/changed-groups.sh'];

test('every shell script parses', () => {
    for (const script of SCRIPTS) {
        const result = run('bash', ['-n', script]);
        assert.equal(result.status, 0, `${script}: ${result.stderr}`);
    }
});

// ---------------------------------------------------------------- crontab

const render = (...args) => run('bash', ['deploy/render-crontab.sh', 'deploy/crontab', ...args]);

test('the crontab checks the site and pings no one without a heartbeat URL', () => {
    const result = render('https://www.acme.com');

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^\*\/5 \* \* \* \* curl -fsS -m 20 -o \/dev\/null https:\/\/www\.acme\.com\/ >\/dev\/null 2>&1$/m);
    assert.doesNotMatch(result.stdout, /__[A-Z_]+__/);
});

test('the heartbeat is pinged only after the site answers', () => {
    const result = render('https://www.acme.com', 'https://hc-ping.com/abc-123');

    assert.match(result.stdout, /https:\/\/www\.acme\.com\/ >\/dev\/null 2>&1 && curl -fsS -m 10 -o \/dev\/null https:\/\/hc-ping\.com\/abc-123$/m);
});

test('a URL that could be shell, or a % in a crontab, is refused', () => {
    for (const url of ['https://x.example/$(id)', 'https://x.example/a b', 'http://x.example/', 'https://x.example/%2F', "https://x.example/'"]) {
        assert.equal(render('https://www.acme.com', url).status, 1, url);
        assert.equal(render(url).status, 1, url);
    }
});

test('a template without its placeholder is refused', () => {
    const dir = copyRepo(['deploy/render-crontab.sh']);
    writeFileSync(join(dir, 'crontab'), '* * * * * true\n');

    assert.match(run('bash', ['deploy/render-crontab.sh', 'crontab', 'https://a.example'], { cwd: dir }).stderr, /no __SITE_URL__ placeholder/);
    assert.match(run('bash', ['deploy/render-crontab.sh', 'missing', 'https://a.example'], { cwd: dir }).stderr, /no crontab template/);
});

// -------------------------------------------------------------- DNS check

function checkDns(host, env = {}) {
    const bin = fakeBin({
        dig: 'case "$*" in *AAAA*) printf \'%b\' "${FAKE_AAAA:-}" ;; *) printf \'%b\' "${FAKE_A:-}" ;; esac',
        hostname: 'echo "${FAKE_LOCAL:-}"',
        curl: '[ -n "${FAKE_RESERVED:-}" ] || exit 22; printf \'%s\' "$FAKE_RESERVED"',
    });
    const result = run('bash', ['deploy/check-dns.sh', ...(host === '' ? [] : [host])], { bin: bin.dir, env });

    return { ...result, digCalls: bin.calls().filter((call) => call.startsWith('dig ')) };
}

test('DNS: passes when the A record points here', () => {
    const result = checkDns('www.acme.com', { FAKE_A: '203.0.113.10\n', FAKE_LOCAL: '203.0.113.10 10.0.0.5' });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /www\.acme\.com points at this server/);
});

test('DNS (1): no A record', () => {
    const result = checkDns('www.acme.com', { FAKE_LOCAL: '203.0.113.10' });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /no A record/);
    assert.match(result.stderr, /203\.0\.113\.10/);
});

test('DNS (2): an A record pointing elsewhere names both addresses', () => {
    const result = checkDns('www.acme.com', { FAKE_A: '198.51.100.7\n', FAKE_LOCAL: '203.0.113.10' });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /198\.51\.100\.7/);
    assert.match(result.stderr, /203\.0\.113\.10/);
});

test('DNS (3): an AAAA record for an address this server does not have', () => {
    const result = checkDns('www.acme.com', { FAKE_A: '203.0.113.10\n', FAKE_AAAA: '2001:db8::1\n', FAKE_LOCAL: '203.0.113.10' });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /AAAA/);
    assert.equal(checkDns('www.acme.com', { FAKE_A: '203.0.113.10\n', FAKE_AAAA: '2001:db8::1\n', FAKE_LOCAL: '203.0.113.10 2001:db8::1' }).status, 0);
});

test('DNS (4): a reserved IP, on no interface, counts as here; a CNAME is followed', () => {
    assert.equal(checkDns('www.acme.com', { FAKE_A: '192.0.2.50\n', FAKE_LOCAL: '203.0.113.10', FAKE_RESERVED: '192.0.2.50' }).status, 0);
    assert.equal(checkDns('www.acme.com', { FAKE_A: 'lb.acme.net.\n203.0.113.10\n', FAKE_LOCAL: '203.0.113.10' }).status, 0);
});

test('DNS (5): asks a public resolver', () => {
    const { digCalls } = checkDns('www.acme.com', { FAKE_A: '203.0.113.10\n', FAKE_LOCAL: '203.0.113.10' });

    assert.ok(digCalls.some((call) => call.includes('A www.acme.com @1.1.1.1')), digCalls.join('\n'));
    assert.ok(digCalls.some((call) => call.includes('AAAA www.acme.com @1.1.1.1')));
});

test('DNS (6): no dig is a failure, not a pass; no hostname is a usage error', () => {
    const missing = checkDns('www.acme.com', { DIG: '/nonexistent/dig', FAKE_LOCAL: '203.0.113.10' });

    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /dig/);
    assert.equal(checkDns('').status, 2);
});

// --------------------------------------------------------------- deploy.sh

/**
 * A server: the tree as the workflow rsyncs it, a release per tag, and
 * stand-ins for doppler, docker, curl, crontab and sleep. The fake curl
 * serves whatever `current` points at, the way Caddy would, unless told to
 * serve something else.
 */
function server(tags = ['v1']) {
    const dir = copyRepo(['deploy', 'docker-compose.yml', 'docker-compose.prod.yml', 'docker/caddy/Caddyfile']);

    tags.forEach((tag, index) => release(dir, tag, index));

    const bin = fakeBin({
        doppler: `
            if [ "$1" = "run" ]; then shift 2; exec "$@"; fi
            if [ "$1 $2" = "secrets --only-names" ]; then [ -z "\${FAKE_DOPPLER_DOWN:-}" ]; exit; fi
            if [ "$1 $2 $3" = "secrets get WAFFLE_SITE_KEY" ]; then printf '%s' "\${FAKE_KEY-site-key}"; exit 0; fi
            if [ "$1 $2 $3" = "secrets get HEARTBEAT_URL" ]; then printf '%s' "\${FAKE_HEARTBEAT:-}"; exit 0; fi
            exit 1`,
        docker: `
            case "$*" in *"caddy validate"*) [ -z "\${FAKE_CADDY_INVALID:-}" ] || { echo "bad Caddyfile" >&2; exit 1; } ;; esac
            exit 0`,
        curl: `
            [ -z "\${FAKE_HTTPS_DOWN:-}" ] || exit 7
            cat "\${FAKE_SERVE:-${dir}/current/index.html}"`,
        crontab: `
            if [ "$1" = "-" ]; then cat > "$(dirname "$0")/crontab.installed"; else cat "$(dirname "$0")/crontab.installed"; fi`,
        sleep: 'exit 0',
    });

    const deploy = (tag, env = {}) => run('bash', ['deploy/deploy.sh', tag], { cwd: dir, bin: bin.dir, env: { SKIP_DNS_CHECK: '1', ...env } });

    return {
        dir,
        bin,
        deploy,
        current: () => (existsSync(join(dir, 'current')) ? readlinkSync(join(dir, 'current')) : null),
        state: (name) => (existsSync(join(dir, '.deploy', name)) ? readFileSync(join(dir, '.deploy', name), 'utf8').trim() : null),
        crontab: () => readFileSync(join(bin.dir, 'crontab.installed'), 'utf8'),
    };
}

function release(dir, tag, age = 0) {
    const path = join(dir, 'releases', tag);
    mkdirSync(path, { recursive: true });

    for (const file of ['index.html', '404.html', 'robots.txt', 'sitemap-index.xml']) {
        writeFileSync(join(path, file), `${tag} ${file}\n`);
    }

    // Older tags first in age order, the way they would have arrived.
    const when = new Date(Date.UTC(2026, 0, 1 + age));
    utimesSync(path, when, when);
}

test('deploy (1): refuses a tag that is not vN, before anything', () => {
    const site = server();

    for (const tag of ['', '1', 'v0', 'v1.0', 'v1.d0', 'v1.d', 'v1.d2;id', 'v1;rm -rf /', 'main']) {
        assert.equal(site.deploy(tag).status, 2, tag);
    }

    // A scoped data rebuild of a release (deploy/assemble.sh) is a tag too.
    assert.match(site.deploy('v1.d2').stderr, /missing releases\/v1\.d2\/index\.html/);

    assert.equal(site.current(), null);
});

test('deploy (1): refuses a release that is not on disk, or is incomplete', () => {
    const site = server(['v1']);
    const missing = site.deploy('v2');

    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /missing releases\/v2\/index\.html/);
    assert.match(missing.stderr, /not a complete release/);

    writeFileSync(join(site.dir, 'releases/v1/robots.txt'), '');
    assert.equal(site.deploy('v1').status, 0);
    assert.equal(site.current(), 'releases/v1');
});

test('deploy (2): refuses without Doppler, or without the site key', () => {
    const site = server();

    assert.match(site.deploy('v1', { FAKE_DOPPLER_DOWN: '1' }).stderr, /cannot read secrets/);
    assert.match(site.deploy('v1', { FAKE_KEY: '' }).stderr, /WAFFLE_SITE_KEY is not set/);
    assert.equal(site.current(), null);
});

test('deploy (4): a Caddyfile Caddy cannot load changes nothing', () => {
    const site = server();
    const result = site.deploy('v1', { FAKE_CADDY_INVALID: '1' });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /bad Caddyfile/);
    assert.equal(site.current(), null);
});

test('deploy (5): the first deploy points current at the release, verifies it, and records it', () => {
    const site = server(['v1']);
    const result = site.deploy('v1');

    assert.equal(result.status, 0, result.output);
    assert.equal(site.current(), 'releases/v1');
    assert.equal(site.state('tag'), 'v1');
    assert.equal(site.state('previous-tag'), null);
    assert.match(result.stdout, /serving v1/);
    assert.ok(site.crontab().includes('https://waffle-site.example.com/'), site.crontab());

    const compose = site.bin.calls().filter((call) => call.startsWith('docker compose'));
    assert.ok(compose.every((call) => call.includes('-f docker-compose.yml -f docker-compose.prod.yml')), compose.join('\n'));
    assert.ok(compose.some((call) => call.includes('up -d --remove-orphans')));
    assert.ok(compose.some((call) => call.includes('caddy reload')));
});

test('deploy: the heartbeat goes into the crontab when Doppler has one, and a bad one is only a warning', () => {
    const site = server(['v1']);

    assert.equal(site.deploy('v1', { FAKE_HEARTBEAT: 'https://hc-ping.com/abc' }).status, 0);
    assert.match(site.crontab(), /&& curl -fsS -m 10 -o \/dev\/null https:\/\/hc-ping\.com\/abc/);

    const bad = site.deploy('v1', { FAKE_HEARTBEAT: 'https://hc-ping.com/$(id)' });
    assert.equal(bad.status, 0);
    assert.match(bad.stderr, /without the heartbeat/);
    assert.doesNotMatch(site.crontab(), /hc-ping/);
});

test('deploy: the next release switches current and remembers the one before', () => {
    const site = server(['v1', 'v2']);

    site.deploy('v1');
    const result = site.deploy('v2');

    assert.equal(result.status, 0, result.output);
    assert.equal(site.current(), 'releases/v2');
    assert.equal(site.state('tag'), 'v2');
    assert.equal(site.state('previous-tag'), 'v1');
});

test('deploy (6): a release that is not what the site serves is rolled back to the one before', () => {
    const site = server(['v1', 'v2']);

    site.deploy('v1');
    const result = site.deploy('v2', { FAKE_SERVE: join(site.dir, 'releases/v1/index.html') });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /not serving v2/);
    assert.match(result.stderr, /current is back on v1/);
    assert.equal(site.current(), 'releases/v1');
    assert.equal(site.state('tag'), 'v1');
});

test('deploy (6): HTTPS that never comes up fails the first deploy and says where to look', () => {
    const site = server(['v1']);
    const result = site.deploy('v1', { FAKE_HTTPS_DOWN: '1' });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /DNS: bash deploy\/check-dns\.sh/);
    assert.equal(site.state('tag'), null);
});

test('deploy: rolling back is deploying the older tag again', () => {
    const site = server(['v1', 'v2']);

    site.deploy('v1');
    site.deploy('v2');
    const result = site.deploy('v1');

    assert.equal(result.status, 0, result.output);
    assert.equal(site.current(), 'releases/v1');
    assert.equal(site.state('previous-tag'), 'v2');
});

test('deploy (7): keeps the five newest releases, and never the one serving or the one before', () => {
    const tags = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'];
    const site = server(tags);

    site.deploy('v2');
    // v2 is now the oldest-but-one on disk and the previous release.
    const result = site.deploy('v8');

    assert.equal(result.status, 0, result.output);
    assert.deepEqual(readdirSync(join(site.dir, 'releases')).sort(), ['v2', 'v4', 'v5', 'v6', 'v7', 'v8']);
});

test('the DNS check runs unless skipped, and its refusal stops a first deploy', () => {
    const site = server(['v1']);
    const result = run('bash', ['deploy/deploy.sh', 'v1'], {
        cwd: site.dir,
        bin: site.bin.dir,
        env: { DIG: '/nonexistent/dig' },
    });

    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('refusing the first deploy until waffle-site.example.com points here'), result.stderr);
    assert.equal(site.current(), null);
});

test('deploy.sh is the script the workflow runs, from where the workflow puts it', () => {
    const workflow = readFileSync(join(ROOT, '.github/workflows/deploy.yml'), 'utf8');

    assert.match(workflow, /bash \/opt\/waffle_site\/deploy\/deploy\.sh '\$TAG'/);
    assert.match(workflow, /dist\/ "\$\{DROPLET_USER\}@\$\{DROPLET_HOST\}:\/opt\/waffle_site\/releases\/\$\{TAG\}\/"/);
});
