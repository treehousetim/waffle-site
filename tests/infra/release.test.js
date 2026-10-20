/**
 * Versions and the release workflow, asserted by shape (docs/releasing.md).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { read, ROOT } from '../support/shell.js';

const version = read('VERSION').trim();
const changelog = read('CHANGELOG.md');
const workflow = read('.github/workflows/deploy.yml');

test('VERSION is semver for the template, or one number for a site', () => {
    assert.match(version, /^(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*))?$/);
});

test('a released version has its changelog section; an unreleased one has none to have', () => {
    const released = version !== '0' && version !== '0.0.0';

    assert.match(changelog, /^## \[Unreleased\]$/m);

    if (released) {
        assert.ok(changelog.includes(`## [${version}] - `), `CHANGELOG.md has no section for ${version}`);
    }
});

test('nothing else claims to be the version', () => {
    const pkg = JSON.parse(read('package.json'));

    assert.equal('version' in pkg, false, 'package.json carries a version; VERSION is the only place one is written');
});

test('the workflow deploys only a published release, one at a time', () => {
    assert.match(workflow, /on:\n {2}release:\n {4}types: \[published\]/);
    assert.match(workflow, /concurrency:\n {2}group: deploy-production\n {2}cancel-in-progress: false/);
    assert.match(workflow, /permissions:\n {2}contents: read/);
});

test('the workflow never deploys from the template\'s own repository', () => {
    assert.match(workflow, /if: github\.repository != 'treehousetim\/waffle-site'/);
});

test('the workflow refuses a tag that is not vN, read through the environment', () => {
    assert.match(workflow, /TAG: \$\{\{ github\.event\.release\.tag_name \}\}/);
    assert.match(workflow, /\[\[ ! "\$TAG" =~ \^v\[1-9\]\[0-9\]\*\$ \]\]/);
});

test('every action is pinned to a commit', () => {
    const uses = [...workflow.matchAll(/uses: (\S+)/g)].map((match) => match[1]);

    assert.ok(uses.length > 0);
    for (const action of uses) {
        assert.match(action, /@[0-9a-f]{40}$/, action);
    }
});

test('DOPPLER_TOKEN is the only secret, and it is loaded after npm has run', () => {
    const secrets = new Set([...workflow.matchAll(/secrets\.([A-Z_]+)/g)].map((match) => match[1]));

    assert.deepEqual([...secrets], ['DOPPLER_TOKEN']);
    assert.ok(workflow.indexOf('npm run build') < workflow.indexOf('Install the Doppler CLI'));
    assert.match(workflow, /environment:\n {6}name: prod/);
});

test('the build is a production build from the lockfile, verified, then audited', () => {
    assert.match(workflow, /SITE_ENV: production/);
    assert.match(workflow, /npm ci\n\s+npm audit signatures\n\s+npm run build/);
    assert.match(read('package.json'), /"build": "node tools\/check\.mjs && astro build && node tools\/audit\.mjs dist"/);
});

test('the build reads its hostnames from docker-compose.prod.yml, the one place they are written', () => {
    assert.match(workflow, /sed -n 's\/\^ \*SITE_ADDRESS: \*\/\/p' docker-compose\.prod\.yml/);
    assert.match(workflow, /sed -n 's\/\^ \*WAFFLE_APP_URL: \*\/\/p' docker-compose\.prod\.yml/);
});

test('the rsync never deletes what lives only on the server', () => {
    const tree = workflow.slice(workflow.indexOf('rsync -az --delete'), workflow.indexOf('rsync -az --delete', workflow.indexOf('rsync -az --delete') + 1));

    for (const kept of ["'releases/'", "'current'", "'.deploy/'", "'node_modules/'", "'dist/'", "'.git/'", "'tests/'"]) {
        assert.ok(tree.includes(`--exclude ${kept}`), kept);
    }

    const commands = workflow.split('\n').filter((line) => !/^\s*#/.test(line)).join('\n');
    assert.doesNotMatch(commands, /--delete-excluded/);
});

test('every shell script is executable in git', () => {
    let modes;

    try {
        modes = execSync('git ls-files -s -- "*.sh"', { cwd: ROOT, encoding: 'utf8' }).trim();
    } catch {
        return; // not a git checkout (a test copy); nothing to check
    }

    for (const line of modes.split('\n').filter(Boolean)) {
        assert.match(line, /^100755 /, line);
    }
});

// ------------------------------------------------- rebuild.yml (docs/scoped-builds.md)

const rebuild = read('.github/workflows/rebuild.yml');

test('a change notice rebuilds, one build at a time, behind any deploy (16)', () => {
    assert.match(rebuild, /on:\n {2}repository_dispatch:\n {4}types: \[change-notice\]/);
    assert.match(rebuild, /concurrency:\n {2}group: deploy-production\n {2}cancel-in-progress: false/);
    assert.match(rebuild, /permissions:\n {2}contents: read/);
    assert.match(rebuild, /if: github\.repository != 'treehousetim\/waffle-site'/);
});

test('a rebuild uses the served release\'s code, scoped by its manifest (14, 15)', () => {
    assert.match(rebuild, /\$SITE_URL\/pages-manifest\.json/);
    assert.match(rebuild, /\[\[ ! "\$release" =~ \^v\[1-9\]\[0-9\]\*\$ \]\]/);
    assert.match(rebuild, /ref: \$\{\{ env\.RELEASE \}\}/);
    assert.match(rebuild, /SITE_PREVIOUS_MANIFEST: \$\{\{ runner\.temp \}\}\/served-manifest\.json/);
    assert.match(rebuild, /node tools\/scoped-release\.mjs dist/);
    assert.match(rebuild, /deploy\/assemble\.sh '\$RELEASE' '\$RUN'/);
    assert.match(workflow, /SITE_RELEASE: \$\{\{ env\.TAG \}\}/);
});

test('a rebuild never splices the notice into a script, and loads secrets after npm', () => {
    assert.match(rebuild, /CHANGES: \$\{\{ toJSON\(github\.event\.client_payload\.changes\) \}\}/);
    assert.doesNotMatch(rebuild.replace(/^.*CHANGES: .*$/m, ''), /client_payload/);
    assert.ok(rebuild.indexOf('npm run build') < rebuild.indexOf('Install the Doppler CLI'));
    assert.deepEqual([...new Set(rebuild.match(/secrets\.[A-Z_]+/g))], ['secrets.DOPPLER_TOKEN']);

    for (const action of rebuild.match(/uses: \S+/g) ?? []) {
        assert.match(action, /@[0-9a-f]{40}$/, action);
    }
});
