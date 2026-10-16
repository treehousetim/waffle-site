/**
 * tools/npm.sh (docs/supply-chain.md, failure list). A stand-in `docker`
 * records each container it is asked to start, one argument per line, so the
 * tests read exactly what npm would have run with.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fakeBin, read, ROOT, run } from '../support/shell.js';

function npm(args, env = {}) {
    const bin = fakeBin({
        docker: `n=$(( $(ls "$(dirname "$0")" | grep -c '^run\\.') + 1 )); for arg in "$@"; do printf '%s\\n' "$arg"; done > "$(dirname "$0")/run.$n"`,
    });
    const result = run('bash', ['tools/npm.sh', ...args], { bin: bin.dir, env: { NPM_TODAY: '2026-10-12', HOME: '/home/someone', ...env } });
    const runs = readdirSync(bin.dir)
        .filter((name) => name.startsWith('run.'))
        .sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)))
        .map((name) => readFileSync(join(bin.dir, name), 'utf8').split('\n').filter(Boolean));

    // The last container started is the one that runs npm; before it, the
    // volume ownership fix.
    return { ...result, runs, container: runs.at(-1) ?? [] };
}

const npmArgs = (container) => container.slice(container.indexOf('npm') + 1);

test('(1) holds back every version younger than a week when resolving', () => {
    for (const command of [['install'], ['install', 'astro'], ['i', 'x'], ['update'], ['up'], ['add', 'x']]) {
        assert.ok(npmArgs(npm(command).container).includes('--before=2026-10-05'), command.join(' '));
    }
});

test('(1) leaves commands that resolve nothing alone', () => {
    for (const command of [['ci'], ['run', 'build'], ['audit', 'signatures'], ['exec', '--', 'node', 'x.mjs']]) {
        assert.equal(npmArgs(npm(command).container).some((arg) => arg.startsWith('--before')), false, command.join(' '));
    }
});

test('the window comes from NPM_COOLDOWN_DAYS', () => {
    assert.ok(npmArgs(npm(['update'], { NPM_COOLDOWN_DAYS: '14' }).container).includes('--before=2026-09-28'));
});

test('(5) 0 turns the window off, and says so loudly', () => {
    const result = npm(['install', 'x'], { NPM_COOLDOWN_DAYS: '0' });

    assert.equal(npmArgs(result.container).some((arg) => arg.startsWith('--before')), false);
    assert.match(result.stderr, /the cooldown is OFF/);
});

test('(11) refuses a window that is not a number of days', () => {
    for (const days of ['seven', '-1', '7d', ' ']) {
        const result = npm(['install'], { NPM_COOLDOWN_DAYS: days });

        assert.equal(result.status, 2, days);
        assert.deepEqual(result.runs, []);
    }
});

test('(2) install scripts are off in the container and in the project', () => {
    assert.ok(npm(['ci']).container.includes('NPM_CONFIG_IGNORE_SCRIPTS=true'));
    assert.match(read('.npmrc'), /^ignore-scripts=true$/m);
});

test('(3) mounts the repository and nothing of the home directory', () => {
    const container = npm(['ci']).container;
    const mounts = container.filter((arg, index) => container[index - 1] === '-v');

    assert.ok(mounts.includes(`${ROOT}:/app`));
    assert.equal(mounts.some((mount) => mount.startsWith('/home/someone')), false);
    assert.ok(container.includes('HOME=/tmp'));
});

test('(8) runs as the invoking user', () => {
    const container = npm(['ci']).container;

    assert.match(container[container.indexOf('--user') + 1], /^\d+:\d+$/);
});

test('(9) node_modules lives in a Docker volume named for the project', () => {
    assert.ok(npm(['ci']).container.includes('waffle_site_node_modules:/app/node_modules'));
});

test('(10) the dev server is published to this machine only, and proxies to a local waffle app', () => {
    const container = npm(['run', 'dev']).container;

    assert.ok(container.includes('127.0.0.1:4321:4321'));
    assert.ok(container.includes('DEV_HOST=0.0.0.0'));
    assert.ok(container.includes('WAFFLE_APP_URL=http://host.docker.internal:8080'));
    assert.ok(npm(['run', 'dev'], { WAFFLE_APP_URL: 'http://host.docker.internal:9000' }).container.includes('WAFFLE_APP_URL=http://host.docker.internal:9000'));
});

test('build settings pass through only when set', () => {
    assert.equal(npm(['run', 'build']).container.some((arg) => arg.startsWith('SITE_ENV=')), false);
    assert.ok(npm(['run', 'build'], { SITE_ENV: 'production', SITE_URL: 'https://www.acme.com' }).container.includes('SITE_URL=https://www.acme.com'));
});

test('stops when Docker is missing, and on a native Windows shell (12)', () => {
    const noDocker = run('bash', ['tools/npm.sh', 'ci'], { env: { NPM_DOCKER: '/nonexistent/docker' } });
    assert.match(noDocker.stderr, /Docker is needed/);

    const uname = fakeBin({ uname: 'echo MINGW64_NT-10.0' });
    const windows = run('bash', ['tools/npm.sh', 'ci'], { bin: uname.dir });
    assert.equal(windows.status, 1);
    assert.match(windows.stderr, /WSL2/);
});

test('(4) is the only way any document or script tells you to run npm', () => {
    // CI is the one exception: `npm ci` on a runner that holds no secret yet.
    const files = ['README.md', 'AGENTS.md',
        ...readdirSync(join(ROOT, 'docs')).filter((name) => name.endsWith('.md')).map((name) => `docs/${name}`),
        ...readdirSync(join(ROOT, 'tools')).filter((name) => name.endsWith('.sh')).map((name) => `tools/${name}`),
        ...readdirSync(join(ROOT, 'deploy')).filter((name) => name.endsWith('.sh')).map((name) => `deploy/${name}`)];
    const offenders = [];

    for (const file of files.filter((name) => !['tools/npm.sh', 'tools/test.sh', 'docs/supply-chain.md'].includes(name))) {
        read(file).split('\n').forEach((line, index) => {
            if (/(?<![\w./-])npm (?:install|i|ci|update|up|upgrade|add|run|exec)\b|(?<![\w./-])npx [\w@]/.test(line)) {
                offenders.push(`${file}:${index + 1}: ${line.trim()}`);
            }
        });
    }

    assert.deepEqual(offenders, []);
});

test('(6, 7) CI installs exactly the lockfile and checks signatures before building', () => {
    const workflow = read('.github/workflows/deploy.yml');

    assert.doesNotMatch(workflow, /^\s+npm (?:install|i|update)\b/m);
    assert.match(workflow, /^( +)npm ci\n\1npm audit signatures\n\1npm run build$/m);
});
