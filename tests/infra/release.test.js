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
const rebuild = read('.github/workflows/rebuild.yml');

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

test('the workflow builds only a published release, one build per tag', () => {
    assert.match(workflow, /on:\n {2}release:\n {4}types: \[published\]/);
    assert.match(workflow, /concurrency:\n {2}group: release-\$\{\{ github\.event\.release\.tag_name \}\}\n {2}cancel-in-progress: false/);
    assert.match(workflow, /^permissions:\n {2}contents: read/m);
});

test('the workflow never builds a release in the template\'s own repository', () => {
    assert.match(workflow, /if: github\.repository != 'treehousetim\/waffle-site'/);
});

test('the workflow refuses a tag that is not a release number, read through the environment', () => {
    assert.match(workflow, /TAG: \$\{\{ github\.event\.release\.tag_name \}\}/);
    assert.match(workflow, /\[\[ ! "\$TAG" =~ \^\[1-9\]\[0-9\]\*\$ \]\]/);
});

test('a release tag is the release number alone, everywhere a tag is checked', () => {
    for (const text of [workflow, rebuild, read('deploy/pull.sh'), read('deploy/deploy.sh'), read('deploy/assemble.sh'), read('tools/release.sh')]) {
        assert.doesNotMatch(text, /\^\(?v\[1-9\]|TAG="v|#v\}/);
    }
    assert.match(read('tools/release.sh'), /^TAG="\$\{NEXT\}"$/m);
});

test('every action is pinned to a commit, and no checkout keeps a token', () => {
    for (const text of [workflow, rebuild]) {
        const uses = [...text.matchAll(/uses: (\S+)/g)].map((match) => match[1]);

        assert.ok(uses.length > 0);
        for (const action of uses) {
            assert.match(action, /@[0-9a-f]{40}$/, action);
        }

        const checkouts = text.split('uses: actions/checkout@').slice(1);
        assert.ok(checkouts.length > 0);
        for (const checkout of checkouts) {
            assert.match(checkout.slice(0, 300), /persist-credentials: false/);
        }
    }
});

test('CI holds no secret and reaches no server: no secrets, no environment, no SSH', () => {
    for (const text of [workflow, rebuild]) {
        const commands = text.split('\n').filter((line) => !/^\s*#/.test(line)).join('\n');

        assert.doesNotMatch(commands, /secrets\./);
        assert.doesNotMatch(commands, /environment:/);
        assert.doesNotMatch(commands, /\b(ssh|scp|rsync)\b/);
        assert.doesNotMatch(commands, /doppler/i);
    }
});

test('the build is a production build, with the hostnames from docker-compose.prod.yml', () => {
    assert.match(workflow, /-e SITE_ENV=production/);
    assert.match(workflow, /-e SITE_RELEASE="\$TAG"/);
    assert.match(workflow, /sed -n 's\/\^ \*SITE_ADDRESS: \*\/\/p' docker-compose\.prod\.yml/);
    assert.match(workflow, /sed -n 's\/\^ \*WAFFLE_APP_URL: \*\/\/p' docker-compose\.prod\.yml/);
    assert.match(read('package.json'), /"build": "node tools\/check\.mjs && astro build && node tools\/audit\.mjs dist"/);
});

test('npm installs in a container that sees only the package files', () => {
    const install = workflow.slice(workflow.indexOf('docker run'), workflow.indexOf('npm audit signatures') + 30);

    for (const file of ['package.json', 'package-lock.json', '.npmrc']) {
        assert.ok(install.includes(`-v "$PWD/${file}:/app/${file}:ro"`), file);
    }
    assert.doesNotMatch(install, /-v "\$PWD:/);
    assert.match(install, /node:26 sh -euc 'npm ci; npm audit signatures'/);
});

test('the site builds in a container on a copy of the tree it cannot change, and only the built site comes out', () => {
    const build = workflow.slice(workflow.indexOf('name: Build the site'), workflow.indexOf('name: Take only the built site'));

    assert.match(build, /-v "\$PWD:\/src:ro"/);
    assert.match(build, /-v "\$RUNNER_TEMP\/dist:\/out"/);
    assert.match(build, /tar -C \/src --exclude=\.\/\.git --exclude=\.\/node_modules -cf - \. \| tar -C \/app -xf -; npm run build; cp -R dist\/\. \/out\//);
    assert.doesNotMatch(build, /docker\.sock/);

    const take = workflow.slice(workflow.indexOf('name: Take only the built site'), workflow.indexOf('name: Pack the release'));
    assert.match(take, /find "\$RUNNER_TEMP\/dist" ! -type f ! -type d/);
    assert.match(take, /printf '%s\\n' "\$TAG" > "\$RUNNER_TEMP\/dist\/build\.txt"/);
});

test('the release is the tag\'s own server files and the built site, nothing else', () => {
    const pack = workflow.slice(workflow.indexOf('name: Pack the release'), workflow.indexOf('upload-artifact'));

    assert.match(pack, /cp docker-compose\.yml docker-compose\.prod\.yml VERSION "\$stage\/"/);
    assert.match(pack, /cp docker\/caddy\/Caddyfile "\$stage\/docker\/caddy\/"/);
    assert.match(pack, /cp -R deploy "\$stage\/deploy"/);
    assert.match(pack, /cp -R "\$RUNNER_TEMP\/dist" "\$stage\/dist"/);
    assert.match(pack, /tar -C "\$stage" -czf "waffle_site-\$\{TAG\}\.tar\.gz" \./);
    assert.match(pack, /sha256sum "waffle_site-\$\{TAG\}\.tar\.gz" > "waffle_site-\$\{TAG\}\.tar\.gz\.sha256"/);
});

test('the attach job, the only one that can write, uploads the two files and runs nothing else', () => {
    const attach = jobsOf(workflow).attach;

    assert.deepEqual(Object.keys(jobsOf(workflow)), ['build', 'attach']);
    assert.match(attach, /permissions:\n {6}contents: write/);
    assert.match(attach, /sha256sum -c "waffle_site-\$\{TAG\}\.tar\.gz\.sha256"/);
    assert.match(attach, /gh release upload "\$TAG" "waffle_site-\$\{TAG\}\.tar\.gz" "waffle_site-\$\{TAG\}\.tar\.gz\.sha256" --clobber/);
    assert.match(attach, /GH_TOKEN: \$\{\{ github\.token \}\}/);
    assert.doesNotMatch(jobsOf(workflow).build, /contents: write/);
});

test('every shell script is executable in git', () => {
    let modes;

    try {
        // The suite runs as you, in a container, on a checkout Docker mounts:
        // git calls that "dubious ownership" unless told the directory is safe.
        modes = execSync('git -c safe.directory=* ls-files -s -- "*.sh"', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
        return; // not a git checkout (a test copy); nothing to check
    }

    for (const line of modes.split('\n').filter(Boolean)) {
        assert.match(line, /^100755 /, line);
    }
});

// ------------------------------------------------- rebuild.yml (docs/scoped-builds.md)

test('a change notice rebuilds, one rebuild at a time (16)', () => {
    assert.match(rebuild, /on:\n {2}repository_dispatch:\n {4}types: \[change-notice\]/);
    assert.match(rebuild, /concurrency:\n {2}group: rebuild\n {2}cancel-in-progress: false/);
    assert.match(rebuild, /^permissions:\n {2}contents: read/m);
    assert.match(rebuild, /if: github\.repository != 'treehousetim\/waffle-site'/);
});

test('a rebuild waits until the server serves the latest release and its newest rebuild (16)', () => {
    const wait = rebuild.slice(rebuild.indexOf('name: Wait for the server'), rebuild.indexOf('name: Read the release being served'));

    assert.match(wait, /gh api "repos\/\$GITHUB_REPOSITORY\/releases\/latest"/);
    assert.match(wait, /"\$SITE_URL\/build\.txt"/);
    assert.match(wait, /\[\[ ! "\$latest" =~ \^\[1-9\]\[0-9\]\*\$ \]\]/);
    assert.match(wait, /GH_TOKEN: \$\{\{ github\.token \}\}/);
});

test('a rebuild uses the served release\'s code, scoped by its manifest (14, 15)', () => {
    assert.match(rebuild, /\$SITE_URL\/pages-manifest\.json/);
    assert.match(rebuild, /\[ "\$release" != "\$RELEASE" \]/);
    assert.match(rebuild, /ref: \$\{\{ env\.RELEASE \}\}/);
    assert.match(rebuild, /-e SITE_PREVIOUS_MANIFEST=\/served\/manifest\.json/);
    assert.match(rebuild, /docker run --rm --network none [\s\S]*?node:26 sh -euc 'node \/app\/tools\/scoped-release\.mjs \/dist \/served\/manifest\.json \/served\/sitemap\.xml \/out\/scoped;/);
    assert.match(rebuild, /-e SERVED -e BUILD="\$\{RELEASE\}\.d\$\{RUN\}"/);
    assert.match(rebuild, /printf "%s\\n" "\$SERVED" > \/out\/scoped\/\.scoped-base; printf "%s\\n" "\$BUILD" > \/out\/scoped\/build\.txt/);
});

test('a rebuild never splices the notice into a script', () => {
    assert.match(rebuild, /CHANGES: \$\{\{ toJSON\(github\.event\.client_payload\.changes\) \}\}/);
    assert.doesNotMatch(rebuild.replace(/^.*CHANGES: .*$/m, ''), /client_payload/);
});

test('a rebuild is attached to the release it was built from, by the attach job alone', () => {
    const attach = jobsOf(rebuild).attach;

    assert.deepEqual(Object.keys(jobsOf(rebuild)), ['build', 'attach']);
    assert.match(attach, /permissions:\n {6}contents: write/);
    assert.match(attach, /gh release upload "\$RELEASE" "waffle_site-\$\{RELEASE\}\.d\$\{RUN\}\.tar\.gz" "waffle_site-\$\{RELEASE\}\.d\$\{RUN\}\.tar\.gz\.sha256" --clobber/);
    assert.match(rebuild, /include-hidden-files: true/);
});

// ------------------------------------------ npm runs only in containers

/** Each job of a workflow, by name, as text. */
function jobsOf(text) {
    const body = text.slice(text.indexOf('\njobs:\n') + 7);
    const names = [...body.matchAll(/^ {2}([a-z][a-z-]*):\n/gm)];

    return Object.fromEntries(names.map((match, index) => [match[1], body.slice(match.index, names[index + 1]?.index ?? body.length)]));
}

test('npm and the repository\'s own scripts run only in containers, and never in a job that can write', () => {
    for (const [file, text] of [['deploy.yml', workflow], ['rebuild.yml', rebuild]]) {
        for (const [name, job] of Object.entries(jobsOf(text))) {
            const code = job.split('\n').filter((line) => !/^\s*#/.test(line)).join('\n');

            // Nothing starts npm or node itself; each step that names them does so inside `docker run ... node:26`.
            assert.doesNotMatch(code, /^\s+(npm|npx|node) /m, `${file}: job ${name} runs npm or node on the runner`);
            for (const step of code.split(/\n\s+- name: /).filter((part) => /\b(npm|npx|node) /.test(part))) {
                assert.match(step, /docker run [\s\S]*node:26/, `${file}: job ${name}: ${step.split('\n')[0]}`);
            }

            if (/contents: write/.test(job)) {
                assert.doesNotMatch(job, /\b(npm|npx|node|docker) /, `${file}: job ${name} can write and runs code`);
            }
        }
    }

    assert.doesNotMatch(workflow + rebuild, /actions\/setup-node/);
});

test('no job of either workflow can run in the template\'s own repository', () => {
    for (const [file, text] of [['deploy.yml', workflow], ['rebuild.yml', rebuild]]) {
        for (const [name, job] of Object.entries(jobsOf(text))) {
            assert.match(job, /\n {4}if: .*github\.repository != 'treehousetim\/waffle-site'/, `${file}: job ${name} has no repository guard`);
        }
    }
});
