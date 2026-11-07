/**
 * deploy/pull.sh, the server's half of a release (docs/pull-based-deployments.md,
 * whose failure list the numbers cite). `curl` and `doppler` are stand-ins
 * first on PATH: GitHub's answers come from files in a scratch directory, and
 * nothing here touches the network. `jq`, `flock`, `tar` and `sha256sum` are
 * the real ones, as on the server. A release's deploy/deploy.sh is a stand-in
 * that records the tag and switches `current`, as the real one does at the
 * end of a good deploy; deploy/assemble.sh is the real one.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { appendFileSync, chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT, run, scratch } from '../support/shell.js';

const TOKEN = 'ghp-test-token-123';
const ME = run('id', ['-un']).stdout.trim();

const CURL = `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$SHIMS/curl.args"
out=""; fmt=""; data=""; url=""
while [ $# -gt 0 ]; do
    case "$1" in
        -K) [ "$2" = - ] && url="$(sed -n 's/^url = "\\(.*\\)"$/\\1/p')"; shift 2 ;;
        -o) out="$2"; shift 2 ;;
        -w) fmt="$2"; shift 2 ;;
        -d) data="$2"; shift 2 ;;
        -H|-m) shift 2 ;;
        -*) shift ;;
        *) url="$1"; shift ;;
    esac
done
code=200
case "$url" in
    https://hooks.example/*) printf '%s\\n' "$data" >> "$SHIMS/alerts.log"; exit 0 ;;
    */releases/latest|*/releases/tags/*)
        [ -n "\${FAKE_API_DOWN:-}" ] && exit 7
        code="\${FAKE_API_CODE:-200}"; src="$FAKE/release.json" ;;
    */releases/assets/*) src="$FAKE/asset-\${url##*/}" ;;
    *) exit 6 ;;
esac
if [ -n "$out" ]; then cat "$src" > "$out" 2>/dev/null || :; else cat "$src" 2>/dev/null || :; fi
[ -n "$fmt" ] && printf '%s' "$code"
exit 0
`;

const DOPPLER = `#!/usr/bin/env bash
[ -n "\${FAKE_DOPPLER_DOWN:-}" ] && exit 1
var="FAKE_SECRET_$3"
printf '%s' "\${!var:-}"
`;

// What a release's own deploy.sh does at the end of a good deploy.
const DEPLOY = `#!/usr/bin/env bash
root="$(cd "$(dirname "$0")/../../.." && pwd)"
echo "$1" >> "$root/deployed.log"
[ "\${FAKE_DEPLOY_EXIT:-0}" = 0 ] || exit "$FAKE_DEPLOY_EXIT"
if [ -L "$root/current" ]; then basename "$(readlink "$root/current")" > "$root/shared/deploy/previous-tag"; fi
ln -sfn "releases/$1" "$root/current.next" && mv -fT "$root/current.next" "$root/current"
`;

/** A server and a stand-in GitHub, each in its own scratch directory. */
function fixture() {
    const base = scratch('pull-');
    const f = { root: join(base, 'opt'), fake: join(base, 'fake'), shims: join(base, 'shims'), assets: [], release: null, next: 1 };

    for (const dir of [f.fake, f.shims, join(f.root, 'releases'), join(f.root, 'shared/deploy')]) {
        mkdirSync(dir, { recursive: true });
    }

    writeFileSync(join(f.shims, 'curl'), CURL);
    writeFileSync(join(f.shims, 'doppler'), DOPPLER);
    chmodSync(join(f.shims, 'curl'), 0o755);
    chmodSync(join(f.shims, 'doppler'), 0o755);

    return f;
}

/** Writes files under a directory. */
function write(dir, files) {
    for (const [path, content] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), content);
    }
}

/** Packs a tree into the stand-in GitHub as an asset pair: <name> and <name>.sha256. */
function attach(f, name, files, { uploader = 'github-actions[bot]', badSum = false, uploaded = true } = {}) {
    const tree = scratch('tree-');
    write(tree, files);
    if (files['deploy/deploy.sh']) chmodSync(join(tree, 'deploy/deploy.sh'), 0o755);

    const id = f.next;
    f.next += 2;
    run('tar', ['-czf', join(f.fake, `asset-${id}`), '-C', tree, '.']);
    const sum = badSum ? '0'.repeat(64) : createHash('sha256').update(readFileSync(join(f.fake, `asset-${id}`))).digest('hex');
    writeFileSync(join(f.fake, `asset-${id + 1}`), `${sum}  ${name}\n`);

    const state = uploaded ? 'uploaded' : 'open';
    const url = (n) => `https://api.example/repos/acme/site/releases/assets/${n}`;
    f.assets.push(
        { id, name, state, uploader: { login: uploader }, url: url(id) },
        { id: id + 1, name: `${name}.sha256`, state, uploader: { login: uploader }, url: url(id + 1) },
    );
    save(f);
}

function save(f) {
    writeFileSync(join(f.fake, 'release.json'), JSON.stringify({ ...f.release, assets: f.assets }));
}

/** A full release, as deploy.yml attaches it: the server's files and the built site. */
function releaseTree(tag, { complete = true } = {}) {
    const files = {
        'deploy/deploy.sh': DEPLOY,
        'deploy/assemble.sh': readFileSync(join(ROOT, 'deploy/assemble.sh'), 'utf8'),
        'dist/events/a/index.html': 'event a, old',
        'dist/events/b/index.html': 'event b',
        'dist/pages-manifest.json': JSON.stringify({ release: tag, records: {}, pages: {} }),
    };

    if (complete) {
        Object.assign(files, {
            'docker-compose.prod.yml': '',
            'docker/caddy/Caddyfile': '',
            'dist/index.html': `${tag} home`,
            'dist/build.txt': `${tag}\n`,
        });
    }

    return files;
}

/** Publishes a release in the stand-in GitHub, with its tarball unless told otherwise. */
function publish(f, tag, { author = 'treehousetim', assets = true, complete = true, ...options } = {}) {
    f.release = { tag_name: tag, author: { login: author } };
    f.assets = [];
    save(f);

    if (assets) {
        attach(f, `site-${tag}.tar.gz`, releaseTree(tag, { complete }), options);
    }
}

/** A data rebuild of the latest release, as rebuild.yml attaches it. */
function rebuild(f, run, { over, ...options } = {}) {
    const tag = f.release.tag_name;
    attach(f, `site-${tag}.d${run}.tar.gz`, {
        'events/a/index.html': `event a, from d${run}`,
        'pages-manifest.json': JSON.stringify({ release: tag, records: {}, pages: {} }),
        '.scoped-remove': 'events/b\n',
        '.scoped-base': `${over ?? tag}\n`,
        'build.txt': `${tag}.d${run}\n`,
    }, options);
}

/** A release that only ever lived here: on disk, and `current` pointing at it. */
function live(f, tag) {
    mkdirSync(join(f.root, 'releases', tag, 'deploy'), { recursive: true });
    rmSync(join(f.root, 'current'), { force: true });
    symlinkSync(`releases/${tag}`, join(f.root, 'current'));
}

/** Runs the poller, as the timer does unless told otherwise. */
function pull(f, args = ['check'], env = {}) {
    return run('bash', [join(ROOT, 'deploy/pull.sh'), ...args], {
        env: {
            PATH: `${f.shims}:${process.env.PATH}`,
            HOME: f.root,
            APP_ROOT: f.root,
            SLUG: 'site',
            REPO: 'acme/site',
            DEPLOY_AUTHORS: 'treehousetim alice',
            DEPLOY_USER: ME,
            GITHUB_API: 'https://api.example',
            FAKE: f.fake,
            SHIMS: f.shims,
            FAKE_SECRET_GITHUB_RELEASES_TOKEN: TOKEN,
            FAKE_SECRET_DEPLOY_ALERT_WEBHOOK: 'https://hooks.example/alert',
            ...env,
        },
    });
}

const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');
const alerts = (f) => read(join(f.shims, 'alerts.log'));
const deployed = (f) => read(join(f.root, 'deployed.log'));
const current = (f) => readlinkSync(join(f.root, 'current'));
const count = (text, needle) => text.split(needle).length - 1;
const released = (f, path) => read(join(f.root, 'releases', path));

// ------------------------------------------------------------- releases

test('pulls a newer release, checks it, unpacks it and hands it to its own deploy.sh', () => {
    const f = fixture();
    live(f, '1');
    publish(f, '2');

    const result = pull(f);

    assert.equal(result.status, 0, result.output);
    assert.equal(deployed(f), '2\n');
    assert.equal(released(f, '2/dist/index.html'), '2 home');
    assert.equal(current(f), 'releases/2');
    assert.equal(alerts(f), '');
});

test('deploys the first release onto an empty server', () => {
    const f = fixture();
    publish(f, '1');

    assert.equal(pull(f).status, 0);
    assert.equal(deployed(f), '1\n');
});

test('(4) does nothing, quietly, when the latest release is already live', () => {
    const f = fixture();
    live(f, '3');
    publish(f, '3');

    assert.equal(pull(f).status, 0);
    assert.equal(deployed(f), '');
    assert.equal(alerts(f), '');
});

test('(2) does nothing when no release has been published yet', () => {
    const f = fixture();

    assert.equal(pull(f, ['check'], { FAKE_API_CODE: '404' }).status, 0);
    assert.equal(deployed(f), '');
});

test('(3) refuses a tag that is not a release number, says so once, and never repeats the tag', () => {
    const f = fixture();
    publish(f, 'v2-<!channel>');

    pull(f);
    assert.equal(pull(f).status, 0);
    assert.equal(deployed(f), '');
    assert.equal(count(alerts(f), 'is not a release number'), 1);
    assert.doesNotMatch(alerts(f), /<!channel>/);
});

test('(5) refuses a release older than the one live, so a re-marked old tag cannot roll back', () => {
    const f = fixture();
    live(f, '10');
    publish(f, '9');

    pull(f);
    pull(f);
    assert.equal(deployed(f), '');
    assert.equal(count(alerts(f), 'older than 10'), 1);
});

test('(5) compares versions as numbers, not text, and a data rebuild counts as its release', () => {
    const f = fixture();
    live(f, '9.d4');
    publish(f, '10');

    pull(f);
    assert.equal(deployed(f), '10\n');
});

test('(6) refuses a release published by someone not approved', () => {
    const f = fixture();
    publish(f, '2', { author: 'mallory' });

    pull(f);
    pull(f);
    assert.equal(deployed(f), '');
    assert.equal(count(alerts(f), 'mallory'), 1);
});

test('(7) waits without failing while the files are still being attached', () => {
    const f = fixture();
    publish(f, '2', { assets: false });

    assert.equal(pull(f).status, 0);
    assert.equal(deployed(f), '');
    assert.equal(alerts(f), '');
});

test('(7) counts a file still uploading as missing', () => {
    const f = fixture();
    publish(f, '2', { uploaded: false });

    pull(f);
    assert.equal(deployed(f), '');
});

test('(7) says so, once, when the files have been missing too long', () => {
    const f = fixture();
    publish(f, '2', { assets: false });

    pull(f, ['check'], { ASSET_WAIT_MINUTES: '0' });
    pull(f, ['check'], { ASSET_WAIT_MINUTES: '0' });
    assert.equal(count(alerts(f), 'no tarball'), 1);
});

test('(8) refuses a tarball that does not match its checksum, and keeps nothing of it', () => {
    const f = fixture();
    publish(f, '2', { badSum: true });

    pull(f);
    pull(f);
    assert.equal(deployed(f), '');
    assert.equal(existsSync(join(f.root, 'releases/2')), false);
    assert.equal(existsSync(join(f.root, 'releases/2.partial')), false);
    assert.equal(count(alerts(f), 'checksum'), 1);
});

test('(9) refuses a release whose tree is incomplete', () => {
    const f = fixture();
    publish(f, '2', { complete: false });

    pull(f);
    assert.equal(deployed(f), '');
    assert.equal(existsSync(join(f.root, 'releases/2')), false);
    assert.match(alerts(f), /incomplete/);
});

test('(10) skips a tick while another deploy holds the lock', async () => {
    const f = fixture();
    publish(f, '2');
    const holder = spawn('flock', [join(f.root, 'shared/deploy/lock'), 'sleep', '3']);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const result = pull(f);
    holder.kill();

    assert.equal(result.status, 0);
    assert.equal(deployed(f), '');
});

test('(11, 12) records a failed deploy, says so, and does not retry it on the next tick', () => {
    const f = fixture();
    live(f, '1');
    publish(f, '2');

    const result = pull(f, ['check'], { FAKE_DEPLOY_EXIT: '1' });
    pull(f, ['check'], { FAKE_DEPLOY_EXIT: '1' });

    assert.equal(result.status, 1);
    assert.equal(deployed(f), '2\n');
    assert.equal(read(join(f.root, 'shared/deploy/failed-tag')).trim(), '2');
    assert.match(alerts(f), /2 failed/);
    assert.equal(current(f), 'releases/1');
});

test('(11) tries a failed release again after retry', () => {
    const f = fixture();
    publish(f, '2');
    pull(f, ['check'], { FAKE_DEPLOY_EXIT: '1' });

    pull(f, ['retry']);
    pull(f);
    assert.equal(deployed(f), '2\n2\n');
    assert.equal(existsSync(join(f.root, 'shared/deploy/failed-tag')), false);
});

test('(1) reports GitHub being unreachable only once it has lasted', () => {
    const f = fixture();
    publish(f, '2');

    const quiet = pull(f, ['check'], { FAKE_API_DOWN: '1' });
    const before = alerts(f);
    pull(f, ['check'], { FAKE_API_DOWN: '1', API_ALERT_MINUTES: '0' });
    pull(f, ['check'], { FAKE_API_DOWN: '1', API_ALERT_MINUTES: '0' });

    assert.equal(quiet.status, 1);
    assert.equal(before, '');
    assert.equal(count(alerts(f), 'GitHub'), 1);
    assert.equal(deployed(f), '');
});

test('(1) treats an answer it cannot read as GitHub failing, never as nothing to do', () => {
    const f = fixture();
    writeFileSync(join(f.fake, 'release.json'), '<html>rate limited</html>');

    assert.equal(pull(f, ['check'], { API_ALERT_MINUTES: '0' }).status, 1);
    assert.match(alerts(f), /GitHub/);
});

test('(13) stops, and says so once, without the release token', () => {
    const f = fixture();
    publish(f, '2');

    const result = pull(f, ['check'], { FAKE_SECRET_GITHUB_RELEASES_TOKEN: '' });
    pull(f, ['check'], { FAKE_SECRET_GITHUB_RELEASES_TOKEN: '' });

    assert.equal(result.status, 1);
    assert.equal(deployed(f), '');
    assert.equal(count(alerts(f), 'GITHUB_RELEASES_TOKEN'), 1);
});

test('(13) stops when Doppler cannot be read', () => {
    const f = fixture();
    publish(f, '2');

    const result = pull(f, ['check'], { FAKE_DOPPLER_DOWN: '1' });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /GITHUB_RELEASES_TOKEN/);
    assert.equal(deployed(f), '');
});

test('(14) clears a half-unpacked release left by an interrupted run', () => {
    const f = fixture();
    publish(f, '2');
    mkdirSync(join(f.root, 'releases/2.partial/stale'), { recursive: true });

    pull(f);
    assert.equal(existsSync(join(f.root, 'releases/2.partial')), false);
    assert.equal(existsSync(join(f.root, 'releases/2/stale')), false);
    assert.equal(deployed(f), '2\n');
});

test('(15) keeps the newest releases, data rebuilds among them, and always the live and previous ones', () => {
    const f = fixture();

    for (const tag of ['1', '2', '3', '3.d2', '3.d10', '4']) {
        mkdirSync(join(f.root, 'releases', tag));
    }

    // 2 is live, so once 5 is deployed it is the previous release.
    live(f, '2');
    publish(f, '5');

    pull(f, ['check'], { KEEP: '3' });
    assert.deepEqual(readdirSync(join(f.root, 'releases')).sort(), ['2', '3.d10', '4', '5']);
});

test('(16) never puts the release token on a command line or leaves it on disk', () => {
    const f = fixture();
    publish(f, '2');

    pull(f);
    assert.doesNotMatch(read(join(f.shims, 'curl.args')), new RegExp(TOKEN));
    assert.equal(run('grep', ['-rl', TOKEN, f.root]).stdout, '');
});

test('(16) never puts the alert webhook on a command line', () => {
    const f = fixture();
    publish(f, '2', { author: 'mallory' });

    pull(f);
    assert.match(alerts(f), /mallory/);
    assert.doesNotMatch(read(join(f.shims, 'curl.args')), /hooks\.example/);
});

test('(17) refuses release files that GitHub Actions did not upload, and says so once', () => {
    const f = fixture();
    publish(f, '2', { uploader: 'mallory' });

    pull(f);
    pull(f);
    assert.equal(deployed(f), '');
    assert.equal(existsSync(join(f.root, 'releases/2')), false);
    assert.equal(count(alerts(f), 'not uploaded by github-actions[bot]'), 1);
});

for (const change of ['edited', 'added', 'removed']) {
    test(`(18) refuses to deploy a release on disk that has changed since it was unpacked: a file ${change}`, () => {
        const f = fixture();
        publish(f, '2');
        pull(f, ['check'], { FAKE_DEPLOY_EXIT: '1' });
        const release = join(f.root, 'releases/2');

        if (change === 'edited') appendFileSync(join(release, 'deploy/deploy.sh'), '\necho planted\n');
        if (change === 'added') writeFileSync(join(release, 'planted.sh'), 'echo planted\n');
        if (change === 'removed') rmSync(join(release, 'dist/index.html'));

        pull(f, ['retry']);
        const result = pull(f, ['deploy', '2']);

        assert.equal(result.status, 1);
        assert.equal(deployed(f), '2\n');
        assert.match(alerts(f), /changed since it was unpacked/);
    });
}

test('(19) refuses to run as anyone but the deploy user', () => {
    const f = fixture();
    publish(f, '2');

    const result = pull(f, ['check'], { DEPLOY_USER: 'someone-else' });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /someone-else/);
    assert.equal(deployed(f), '');
    assert.equal(existsSync(join(f.root, 'shared/deploy/lock')), false);
});

// ------------------------------------------------------- data rebuilds

/** A server serving 1, deployed by the poller itself, so it is on disk with its manifest. */
function serving(tag = '1') {
    const f = fixture();
    publish(f, tag);
    const result = pull(f);
    assert.equal(result.status, 0, result.output);

    return f;
}

test('(20) deploys a data rebuild of the live release: a copy of it with the changes laid over', () => {
    const f = serving();
    rebuild(f, 5);

    const result = pull(f);

    assert.equal(result.status, 0, result.output);
    assert.equal(deployed(f), '1\n1.d5\n');
    assert.equal(current(f), 'releases/1.d5');
    assert.equal(released(f, '1.d5/dist/events/a/index.html'), 'event a, from d5');
    assert.equal(released(f, '1.d5/dist/index.html'), '1 home');
    assert.equal(released(f, '1.d5/dist/build.txt'), '1.d5\n');
    assert.equal(existsSync(join(f.root, 'releases/1.d5/dist/events/b')), false);
    assert.equal(existsSync(join(f.root, 'releases/1.d5.incoming')), false);
    assert.equal(alerts(f), '');
});

test('(20) the live release is never changed by its data rebuild, so rolling back to it works', () => {
    const f = serving();
    rebuild(f, 5);

    pull(f);
    assert.equal(released(f, '1/dist/events/a/index.html'), 'event a, old');
    assert.ok(existsSync(join(f.root, 'releases/1/dist/events/b/index.html')));

    const back = pull(f, ['deploy', '1']);
    assert.equal(back.status, 0, back.output);
    assert.equal(current(f), 'releases/1');
});

test('(20) takes only the newest data rebuild, and none older than what is live', () => {
    const f = serving();
    rebuild(f, 3);
    rebuild(f, 12);
    rebuild(f, 9);

    pull(f);
    assert.equal(current(f), 'releases/1.d12');

    pull(f);
    assert.equal(deployed(f), '1\n1.d12\n');
});

test('(20) a data rebuild of a release that is no longer the latest is never deployed', () => {
    const f = serving();
    rebuild(f, 5);
    f.assets.push({ ...f.assets.at(-2), name: 'site-0.d7.tar.gz' });
    save(f);
    publish(f, '2');
    attach(f, 'site-1.d6.tar.gz', { 'build.txt': '1.d6\n' });

    pull(f);
    pull(f);
    assert.equal(deployed(f), '1\n2\n');
});

test('(21) refuses a data rebuild built over something that is not live, once, and does not retry it', () => {
    const f = serving();
    rebuild(f, 5, { over: '1.d4' });

    const result = pull(f);
    pull(f);

    assert.equal(result.status, 0);
    assert.equal(deployed(f), '1\n');
    assert.equal(current(f), 'releases/1');
    assert.equal(count(alerts(f), 'not built over 1'), 1);
    assert.equal(existsSync(join(f.root, 'releases/1.d5')), false);
});

test('(22) refuses to build a data rebuild over a live release that has changed since it was unpacked', () => {
    const f = serving();
    appendFileSync(join(f.root, 'releases/1/dist/index.html'), '<script>planted</script>');
    rebuild(f, 5);

    pull(f);
    assert.equal(deployed(f), '1\n');
    assert.match(alerts(f), /1 on this server has changed since it was unpacked/);
});

test('(8, 9, 17) a data rebuild is checked like a release: checksum, contents, uploader', () => {
    for (const [options, needle] of [[{ badSum: true }, 'checksum'], [{ uploader: 'mallory' }, 'not uploaded by github-actions[bot]']]) {
        const f = serving();
        rebuild(f, 5, options);

        pull(f);
        assert.equal(deployed(f), '1\n', needle);
        assert.match(alerts(f), new RegExp(needle.replace(/[[\]]/g, '\\$&')));
    }

    const f = serving();
    attach(f, 'site-1.d5.tar.gz', { 'build.txt': '1.d5\n' });
    pull(f);
    assert.equal(deployed(f), '1\n');
    assert.match(alerts(f), /incomplete/);
});

test('(11) a failed data rebuild is not retried until retry, or a newer one', () => {
    const f = serving();
    rebuild(f, 5);

    pull(f, ['check'], { FAKE_DEPLOY_EXIT: '1' });
    pull(f);
    assert.equal(deployed(f), '1\n1.d5\n');

    rebuild(f, 6);
    pull(f);
    assert.equal(current(f), 'releases/1.d6');
});

test('a data rebuild deploys by name only from disk: it cannot be rebuilt from GitHub', () => {
    const f = serving();

    const result = pull(f, ['deploy', '1.d5']);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /only from disk/);
});

// ----------------------------------------------------------- commands

test('deploys a named tag on request, older ones included, for a deliberate rollback', () => {
    const f = fixture();
    live(f, '5');
    publish(f, '4');

    assert.equal(pull(f, ['deploy', '4']).status, 0);
    assert.equal(deployed(f), '4\n');
});

test('(23) a rollback by name holds: the next tick does not deploy the newer release again', () => {
    const f = fixture();
    publish(f, '4');
    pull(f);
    publish(f, '5');
    pull(f);

    const back = pull(f, ['deploy', '4']);
    pull(f);
    pull(f);

    assert.equal(back.status, 0, back.output);
    assert.equal(deployed(f), '4\n5\n4\n');
    assert.equal(current(f), 'releases/4');
    assert.match(pull(f, ['status']).stdout, /held: {5}5/);
});

test('(23) the hold ends when something newer is published, or on retry', () => {
    const f = serving('4');
    rebuild(f, 2);
    pull(f);
    pull(f, ['deploy', '4']);

    rebuild(f, 3);
    pull(f);
    assert.equal(current(f), 'releases/4.d3');

    pull(f, ['deploy', '4']);
    pull(f, ['retry']);
    pull(f);
    assert.equal(current(f), 'releases/4.d3');
});

test('(23) a rollback while GitHub cannot be read holds whatever the next check finds', () => {
    const f = serving('4');
    rebuild(f, 2);
    pull(f);

    assert.equal(pull(f, ['deploy', '4'], { FAKE_API_DOWN: '1' }).status, 0);
    pull(f);
    assert.equal(current(f), 'releases/4');
    assert.match(pull(f, ['status']).stdout, /held: {5}4\.d2/);
});

test('(8) still refuses a named tag that fails its checksum', () => {
    const f = fixture();
    publish(f, '4', { badSum: true });

    assert.equal(pull(f, ['deploy', '4']).status, 1);
    assert.equal(deployed(f), '');
});

test('refuses a named tag that is not a release', () => {
    const f = fixture();

    for (const tag of ['main', 'v1', '1;id', '1.d', '../1', '01']) {
        assert.equal(pull(f, ['deploy', tag]).status, 2, tag);
    }
});

test('shows what is live, what was before, and what failed', () => {
    const f = fixture();
    live(f, '7.d3');
    writeFileSync(join(f.root, 'shared/deploy/previous-tag'), '7\n');
    writeFileSync(join(f.root, 'shared/deploy/failed-tag'), '8\n');

    const result = pull(f, ['status']);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /live: {5}7\.d3/);
    assert.match(result.stdout, /previous: 7/);
    assert.match(result.stdout, /failed: {3}8/);
});

test('refuses to run until the unit names the repository and who may publish', () => {
    const f = fixture();
    publish(f, '2');

    for (const [name, message] of [['REPO', /REPO is not set/], ['DEPLOY_AUTHORS', /DEPLOY_AUTHORS is not set/]]) {
        const result = pull(f, ['check'], { [name]: '' });

        assert.equal(result.status, 2, name);
        assert.match(result.stderr, message);
    }
    assert.equal(deployed(f), '');
});

test('rejects a command it does not know', () => {
    const f = fixture();
    const result = pull(f, ['explode']);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /usage/);
});

test('the systemd units run the poller every minute as the deploy user, with settings that are not secret', () => {
    const service = readFileSync(join(ROOT, 'deploy/systemd/waffle_site-deploy.service'), 'utf8');
    const timer = readFileSync(join(ROOT, 'deploy/systemd/waffle_site-deploy.timer'), 'utf8');

    assert.match(service, /^User=deploy$/m);
    assert.match(service, /^ExecStart=\/usr\/local\/sbin\/waffle_site-pull check$/m);
    for (const setting of ['APP_ROOT=/opt/waffle_site', 'SLUG=waffle_site']) {
        assert.ok(service.includes(`Environment=${setting}`), setting);
    }
    // Empty in the template, filled in for a project (docs/fresh-install.md).
    assert.match(service, /^Environment=REPO=([\w.-]+\/[\w.-]+)?$/m);
    assert.match(service, /^Environment=DEPLOY_AUTHORS=[\w -]*$/m);
    assert.doesNotMatch(service, /TOKEN|WEBHOOK|SECRET/);
    assert.match(timer, /^OnUnitActiveSec=1min$/m);
    assert.match(timer, /^Unit=waffle_site-deploy\.service$/m);
});

