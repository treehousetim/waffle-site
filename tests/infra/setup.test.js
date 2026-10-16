/**
 * tools/rename-project.sh and tools/setup.sh (docs/create-project.md,
 * failure list). Each test works on a copy of the files the rename touches,
 * in a scratch directory; the repository itself is never renamed.
 *
 * This file is excluded from the rename, so the placeholders below stay
 * placeholders in every project made from the template.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { copyRepo, fakeBin, run } from '../support/shell.js';

const TREE = ['tools/rename-project.sh', 'tools/setup.sh', 'package.json', 'package-lock.json', 'VERSION', 'CHANGELOG.md',
    'docker-compose.prod.yml', '.github/workflows/deploy.yml', 'src/site.ts', 'README.md', 'AGENTS.md', 'LICENSE'];

const project = () => copyRepo(TREE);
const rename = (dir, ...args) => run('bash', ['tools/rename-project.sh', ...args], { cwd: dir });
const file = (dir, name) => readFileSync(join(dir, name), 'utf8');
const placeholders = /waffle_site|Waffle Site|waffle-site\.example\.com/;

test('(5) renames every placeholder outside the lines that point at the template', () => {
    const dir = project();
    const result = rename(dir, 'acme', 'Acme Electric', 'www.acme.com');

    assert.equal(result.status, 0, result.output);

    for (const name of TREE.filter((path) => !['tools/rename-project.sh', 'tools/setup.sh', 'LICENSE'].includes(path))) {
        const leftover = file(dir, name).split('\n').filter((line) => placeholders.test(line) && !line.includes('treehousetim/waffle'));

        assert.deepEqual(leftover, [], name);
    }

    assert.match(file(dir, 'package.json'), /"name": "acme"/);
    assert.match(file(dir, 'src/site.ts'), /name: 'Acme Electric'/);
    assert.match(file(dir, 'src/site.ts'), /legalName: 'Acme Electric LLC'/);
    assert.match(file(dir, 'docker-compose.prod.yml'), /SITE_ADDRESS: www\.acme\.com/);
    assert.match(file(dir, '.github/workflows/deploy.yml'), /\/opt\/acme\//);
});

test('(6) the waffle app defaults to app. on the site\'s domain, and can be named', () => {
    const dir = project();
    rename(dir, 'acme', 'Acme', 'www.acme.com');
    assert.match(file(dir, 'docker-compose.prod.yml'), /WAFFLE_APP_URL: https:\/\/app\.acme\.com$/m);

    const named = project();
    rename(named, 'acme', 'Acme', 'acme.com', 'portal.acme.com');
    assert.match(file(named, 'docker-compose.prod.yml'), /WAFFLE_APP_URL: https:\/\/portal\.acme\.com$/m);
});

test('(7) keeps every line that points at the template itself', () => {
    const dir = project();
    rename(dir, 'acme', 'Acme', 'www.acme.com');

    assert.match(file(dir, '.github/workflows/deploy.yml'), /if: github\.repository != 'treehousetim\/waffle-site'/);
});

test('(8) starts the site\'s own release stream, recording where it came from', () => {
    const dir = project();
    writeFileSync(join(dir, 'VERSION'), '0.3.1\n');
    rename(dir, 'acme', 'Acme', 'www.acme.com');

    assert.equal(file(dir, 'VERSION'), '0\n');
    assert.match(file(dir, 'CHANGELOG.md'), /Started from \[treehousetim\/waffle-site v0\.3\.1\]/);
    assert.match(file(dir, 'CHANGELOG.md'), /## \[Unreleased\]\n$/);
});

test('(1-4) refuses a bad answer and touches nothing', () => {
    for (const args of [
        ['Acme', 'Acme', 'www.acme.com'],
        ['a', 'Acme', 'www.acme.com'],
        ['acme-co', 'Acme', 'www.acme.com'],
        ['acme', 'Acme\'s "best"', 'www.acme.com'],
        ['acme', 'Acme', 'acme'],
        ['acme', 'Acme', 'WWW.acme.com'],
        ['acme', 'Acme', 'www.acme.com', 'app_acme.com'],
        ['acme', 'Acme', 'www.acme.com', 'www.acme.com'],
        ['acme', 'Acme'],
    ]) {
        const dir = project();
        const result = rename(dir, ...args);

        assert.equal(result.status, 2, args.join(' | '));
        assert.match(file(dir, 'package.json'), /"name": "waffle_site"/, args.join(' | '));
    }
});

test('(9) a second run finds nothing to rename', () => {
    const dir = project();
    rename(dir, 'acme', 'Acme', 'www.acme.com');

    assert.match(rename(dir, 'other', 'Other', 'www.other.com').stdout, /nothing to rename/);
    assert.match(file(dir, 'package.json'), /"name": "acme"/);
});

// ------------------------------------------------------------- setup.sh

const setup = (dir, args, env = {}) => run('bash', ['tools/setup.sh', ...args], { cwd: dir, env, input: '' });

test('(10) suggests a valid slug, name and hostnames for whatever the directory is called', () => {
    const dir = project();
    const suggest = (name) => setup(dir, ['--suggest', name]).stdout.trim().split('\n');

    assert.deepEqual(suggest('Acme Electric'), ['acme_electric', 'Acme Electric', 'www.acme-electric.example.com', 'app.acme-electric.example.com']);
    assert.equal(suggest('123')[0], 'site_123');
    assert.equal(suggest('!!!')[0], 'site');
});

test('(11) sets the site up from flags alone, without a terminal', () => {
    const dir = project();
    const result = setup(dir, ['--slug', 'acme', '--name', 'Acme', '--host', 'www.acme.com', '--app', 'app.acme.com', '--yes', '--no-git']);

    assert.equal(result.status, 0, result.output);
    assert.match(file(dir, 'package.json'), /"name": "acme"/);
    assert.match(result.stdout, /renamed: slug acme/);
    assert.equal(existsSync(join(dir, '.git')), false);
});

test('(12) refuses to guess without a terminal or --yes, and touches nothing', () => {
    const dir = project();
    const result = setup(dir, ['--no-git']);

    assert.equal(result.status, 2);
    assert.match(result.stderr, /no terminal to ask on/);
    assert.match(file(dir, 'package.json'), /"name": "waffle_site"/);
});

test('(13) passes on the rename script\'s refusal', () => {
    const dir = project();
    const result = setup(dir, ['--slug', 'Bad Slug', '--name', 'Acme', '--host', 'www.acme.com', '--yes', '--no-git']);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /the project was not renamed/);
});

test('(14) skips the rename when the site is already named, so it can be run again', () => {
    const dir = project();
    setup(dir, ['--slug', 'acme', '--name', 'Acme', '--host', 'www.acme.com', '--yes', '--no-git']);

    assert.match(setup(dir, ['--yes', '--no-git']).stdout, /already named \(acme\); skipping/);
});

test('(15) a clone of the template itself is told to start its own history', () => {
    const dir = project();
    run('git', ['init', '-q'], { cwd: dir });
    run('git', ['remote', 'add', 'origin', 'git@github.com:treehousetim/waffle-site.git'], { cwd: dir });

    assert.match(setup(dir, ['--slug', 'acme', '--name', 'Acme', '--host', 'www.acme.com', '--yes']).stdout, /clone of the template's own repository/);
});

test('(16) stops on a native Windows shell and points at WSL2', () => {
    const dir = project();
    const uname = fakeBin({ uname: 'echo MINGW64_NT-10.0' });
    const result = run('bash', ['tools/setup.sh', '--yes'], { cwd: dir, bin: uname.dir });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /WSL2/);
});

test('an unknown option is refused', () => {
    assert.equal(setup(project(), ['--fast']).status, 2);
});
