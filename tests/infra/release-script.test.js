/**
 * tools/release.sh (docs/releasing.md, whose failure list the numbers cite).
 * Each test gets a scratch repository with a bare repository as its origin,
 * a stand-in `gh` that logs its calls, and RELEASE_TEST_CMD standing in for
 * the coverage gate. Nothing leaves the scratch directory.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fakeBin, git, ROOT, run, scratch } from '../support/shell.js';

function repo(version, unreleased = '### Added\n- A page.\n') {
    const base = scratch('release-');
    const dir = join(base, 'work');
    const origin = join(base, 'origin.git');
    const gh = fakeBin({
        gh: `
            case "$1 $2" in
                "auth status") exit "\${FAKE_GH_AUTH_EXIT:-0}" ;;
                "release create")
                    while [ "$#" -gt 0 ]; do
                        [ "$1" = "--notes-file" ] && cp "$2" "$(dirname "$0")/notes.md"
                        shift
                    done ;;
            esac`,
    });

    mkdirSync(join(dir, 'tools'), { recursive: true });
    copyFileSync(join(ROOT, 'tools/release.sh'), join(dir, 'tools/release.sh'));
    writeFileSync(join(dir, 'VERSION'), `${version}\n`);
    const previous = version === '0' || version === '0.0.0' ? '' : `## [${version}] - 2026-01-01\n\n### Fixed\n- Old.\n`;
    writeFileSync(join(dir, 'CHANGELOG.md'), `# Changelog\n\n## [Unreleased]\n\n${unreleased}\n${previous}`);

    git(base, 'init', '-q', '--bare', '-b', 'main', origin);
    git(dir, 'init', '-q', '-b', 'main');
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'start');
    git(dir, 'remote', 'add', 'origin', origin);
    git(dir, 'push', '-q', 'origin', 'main');

    const release = (args = [], env = {}) => run('bash', ['tools/release.sh', ...args], {
        cwd: dir,
        bin: gh.dir,
        env: {
            RELEASE_TEST_CMD: 'true',
            GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.test',
            GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.test',
            GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
            ...env,
        },
    });

    return {
        dir,
        origin,
        gh,
        release,
        git: (...args) => git(dir, ...args).stdout.trim(),
        file: (name) => readFileSync(join(dir, name), 'utf8'),
        notes: () => (existsSync(join(gh.dir, 'notes.md')) ? readFileSync(join(gh.dir, 'notes.md'), 'utf8') : null),
    };
}

test('(9, 10) releases a site as the next number: version, changelog, commit, tag, push, notes', () => {
    const site = repo('0');
    const result = site.release();

    assert.equal(result.status, 0, result.output);
    assert.equal(site.file('VERSION'), '1\n');
    assert.match(site.file('CHANGELOG.md'), /## \[Unreleased\]\n\n## \[1\] - \d{4}-\d{2}-\d{2}\n\n### Added\n- A page\./);
    assert.equal(site.git('log', '-1', '--format=%s'), 'Release v1');
    assert.equal(site.git('tag', '--list'), 'v1');
    assert.match(git(site.dir, 'ls-remote', '--tags', 'origin').stdout, /refs\/tags\/v1/);
    assert.equal(site.notes(), '### Added\n- A page.\n');
    assert.ok(site.gh.calls().some((call) => call.startsWith('gh release create v1 --title v1')));
});

test('(7) works out the next version', () => {
    for (const [version, args, next] of [['0', [], '1'], ['7', [], '8'], ['0.0.0', [], '0.0.1'], ['0.4.2', [], '0.4.3'],
        ['0.4.2', ['--minor'], '0.5.0'], ['0.4.2', ['--major'], '1.0.0']]) {
        assert.equal(repo(version).release(['--print-next', ...args]).stdout.trim(), next, `${version} ${args}`);
    }
});

test('(7) refuses a semver bump for a site', () => {
    assert.match(repo('3').release(['--minor']).stderr, /the next release is simply 4/);
});

test('(8) refuses a VERSION it cannot read', () => {
    for (const version of ['v1', '1.0', 'one', '01']) {
        assert.equal(repo(version).release().status, 1, version);
    }
});

test('(1) refuses to release from anywhere but main', () => {
    const site = repo('0');
    site.git('switch', '-q', '-c', 'feature');

    assert.match(site.release().stderr, /releases are cut from main/);
});

test('(2) refuses uncommitted changes', () => {
    const site = repo('0');
    writeFileSync(join(site.dir, 'new.txt'), 'x');

    assert.match(site.release().stderr, /uncommitted changes/);
});

test('(3) refuses a main that differs from origin', () => {
    const site = repo('0');
    writeFileSync(join(site.dir, 'new.txt'), 'x');
    site.git('add', '-A');
    site.git('commit', '-q', '-m', 'ahead');

    assert.match(site.release().stderr, /main and origin\/main differ/);
});

test('(4) refuses a release with nothing under [Unreleased]', () => {
    assert.match(repo('2', '').release().stderr, /nothing under \[Unreleased\]/);
});

test('(5) refuses a tag that already exists', () => {
    const site = repo('0');
    site.git('tag', 'v1');

    assert.match(site.release().stderr, /the tag v1 already exists/);
});

test('(6) leaves nothing behind when the gate is red', () => {
    const site = repo('0');
    const result = site.release([], { RELEASE_TEST_CMD: 'false' });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /the tests are red/);
    assert.equal(site.file('VERSION'), '0\n');
    assert.equal(site.git('status', '--porcelain'), '');
    assert.equal(site.git('tag', '--list'), '');
});

test('(11) stops before changing anything when gh is not signed in', () => {
    const site = repo('0');
    const result = site.release([], { FAKE_GH_AUTH_EXIT: '1' });

    assert.match(result.stderr, /gh is not signed in/);
    assert.equal(site.file('VERSION'), '0\n');
});

test('(12) a dry run changes nothing and says what it would do', () => {
    const site = repo('0');
    const result = site.release(['--dry-run']);

    assert.equal(result.status, 0, result.output);
    assert.match(result.stdout, /Dry run: 0 -> 1/);
    assert.equal(site.file('VERSION'), '0\n');
    assert.equal(site.git('tag', '--list'), '');
});

test('an unknown option is refused', () => {
    assert.equal(repo('0').release(['--fast']).status, 2);
});

test('the gate is the coverage run', () => {
    assert.match(readFileSync(join(ROOT, 'tools/release.sh'), 'utf8'), /GATE="\$\{RELEASE_TEST_CMD:-\.\/tools\/test\.sh --coverage\}"/);
});
