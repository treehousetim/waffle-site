/**
 * Scoped builds (docs/scoped-builds.md, whose failure list the numbers cite):
 * tools/scoped-release.mjs, which picks what a scoped build ships, and
 * deploy/assemble.sh, which lays it over a copy of the served release on the
 * server. Both run for real against scratch directories; deploy.sh is a
 * stand-in that records the tag it was given.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readlinkSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { copyRepo, ROOT, run, scratch } from '../support/shell.js';

const HEAD = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
const sitemap = (...paths) => `${HEAD}${paths.map((path) => `<url><loc>https://waffle-site.example.com${path}</loc></url>`).join('')}</urlset>`;
const manifest = (records, pages, release = 'v7') => JSON.stringify({ release, records, pages });

/** @param {string} dir @param {Record<string, string>} files */
function write(dir, files) {
    for (const [path, content] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), content);
    }
}

const served = manifest(
    { 'properties:a': 'fa', 'properties:b': 'fb' },
    { '/stays/': ['properties:*'], '/stays/a/': ['properties:a'], '/stays/b/': ['properties:b'] },
);

/** A scoped build where stay a changed and stay b was retired. */
function scopedBuild(release = 'v7') {
    const dir = scratch('scoped-');
    write(dir, {
        'served-manifest.json': served,
        'served-sitemap.xml': sitemap('/', '/stays/', '/stays/a/', '/stays/b/'),
        'dist/pages-manifest.json': manifest({ 'properties:a': 'fa2' }, { '/stays/': ['properties:*'], '/stays/a/': ['properties:a'] }, release),
        'dist/redirects.caddy': '# redirects\n',
        'dist/sitemap-index.xml': '<sitemapindex/>',
        'dist/sitemap-0.xml': sitemap('/', '/stays/', '/stays/a/'),
        'dist/index.html': 'home, unchanged',
        'dist/stays/index.html': 'all stays, new',
        'dist/stays/a/index.html': 'stay a, new',
        'dist/_astro/app.abc.css': 'css',
    });

    return dir;
}

const scope = (dir) => run('node', [join(ROOT, 'tools/scoped-release.mjs'), 'dist', 'served-manifest.json', 'served-sitemap.xml', 'out'], { cwd: dir });

test('a scoped build ships only the pages that changed, and lists those that went (13, 14)', () => {
    const dir = scopedBuild();
    const result = scope(dir);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(join(dir, 'out/stays/a/index.html'), 'utf8'), 'stay a, new');
    assert.equal(readFileSync(join(dir, 'out/stays/index.html'), 'utf8'), 'all stays, new');
    assert.equal(existsSync(join(dir, 'out/index.html')), false, 'an unaffected page is not shipped');
    assert.equal(readFileSync(join(dir, 'out/.scoped-remove'), 'utf8'), 'stays/b\n');
    assert.equal(readFileSync(join(dir, 'out/sitemap-0.xml'), 'utf8'), sitemap('/', '/stays/', '/stays/a/'));
    for (const file of ['pages-manifest.json', 'redirects.caddy', 'sitemap-index.xml', '_astro/app.abc.css']) {
        assert.ok(existsSync(join(dir, 'out', file)), file);
    }
    assert.match(result.stdout, /1 removed/);
});

test('a scoped build is refused over another release\'s code (15)', () => {
    const result = scope(scopedBuild('v8'));

    assert.equal(result.status, 1);
    assert.match(result.stderr, /built from v8, but v7 is being served/);
});

test('a changed page the build did not make fails, rather than shipping without it (13)', () => {
    const dir = scopedBuild();
    run('rm', [join(dir, 'dist/stays/a/index.html')]);

    assert.match(scope(dir).stderr, /did not make stays\/a\/index\.html/);
});

test('nothing changed makes no release', () => {
    const dir = scopedBuild();
    write(dir, { 'dist/pages-manifest.json': served, 'dist/stays/b/index.html': 'b' });
    const result = scope(dir);

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /nothing changed/);
    assert.equal(existsSync(join(dir, 'out')), false);
});

test('a build too big for one sitemap file, or bad arguments, is refused', () => {
    const dir = scopedBuild();
    write(dir, { 'dist/sitemap-1.xml': sitemap() });

    assert.match(scope(dir).stderr, /more than one sitemap file/);
    assert.equal(run('node', [join(ROOT, 'tools/scoped-release.mjs')]).status, 2);
});

// ------------------------------------------------------------ assemble.sh

/** A server serving v7, with a scoped build of it rsync'd as v7.d5.incoming. */
function server({ servedRelease = 'v7' } = {}) {
    const dir = copyRepo(['deploy/assemble.sh']);
    write(dir, {
        'deploy/deploy.sh': 'echo "$1" > "$(dirname "$0")/../deployed"',
        'releases/v7/pages-manifest.json': manifest({}, {}, servedRelease).replace('{', '{\n "release": "' + servedRelease + '",\n'),
        'releases/v7/index.html': 'home',
        'releases/v7/stays/a/index.html': 'stay a, old',
        'releases/v7/stays/b/index.html': 'stay b',
        'releases/v7.d5.incoming/pages-manifest.json': '{}',
        'releases/v7.d5.incoming/stays/a/index.html': 'stay a, new',
        'releases/v7.d5.incoming/.scoped-remove': 'stays/b\n',
    });
    symlinkSync('releases/v7', join(dir, 'current'));

    return { dir, assemble: (...args) => run('bash', ['deploy/assemble.sh', ...args], { cwd: dir }) };
}

test('assemble: a copy of the served release, the changes laid over, then deployed', () => {
    const site = server();
    const result = site.assemble('v7', '5');
    const fresh = (path) => readFileSync(join(site.dir, 'releases/v7.d5', path), 'utf8');

    assert.equal(result.status, 0, result.stderr);
    assert.equal(fresh('stays/a/index.html'), 'stay a, new');
    assert.equal(fresh('index.html'), 'home');
    assert.equal(existsSync(join(site.dir, 'releases/v7.d5/stays/b')), false);
    assert.equal(existsSync(join(site.dir, 'releases/v7.d5/.scoped-remove')), false);
    assert.equal(existsSync(join(site.dir, 'releases/v7.d5.incoming')), false);
    assert.equal(readFileSync(join(site.dir, 'deployed'), 'utf8').trim(), 'v7.d5');
});

test('assemble: the served release is never changed, so rolling back works (15)', () => {
    const site = server();
    site.assemble('v7', '5');

    assert.equal(readFileSync(join(site.dir, 'releases/v7/stays/a/index.html'), 'utf8'), 'stay a, old');
    assert.ok(existsSync(join(site.dir, 'releases/v7/stays/b/index.html')));
    assert.equal(readlinkSync(join(site.dir, 'current')), 'releases/v7');
});

test('assemble: refused over a release built from other code (15)', () => {
    const site = server({ servedRelease: 'v6' });
    const result = site.assemble('v7', '5');

    assert.equal(result.status, 1);
    assert.match(result.stderr, /built from v6, not v7/);
    assert.equal(existsSync(join(site.dir, 'deployed')), false);
});

test('assemble: removes only page directories inside the release', () => {
    const site = server();
    write(site.dir, { 'releases/v7.d5.incoming/.scoped-remove': '../v7\n' });
    const result = site.assemble('v7', '5');

    assert.equal(result.status, 1);
    assert.match(result.stderr, /not a page directory/);
    assert.ok(existsSync(join(site.dir, 'releases/v7/index.html')));
    assert.equal(existsSync(join(site.dir, 'releases/v7.d5')), false);
});

test('assemble: refuses bad arguments, a missing build, or nothing served', () => {
    const site = server();

    for (const args of [[], ['v7'], ['7', '5'], ['v7', '0'], ['v7', '5;id']]) {
        assert.equal(site.assemble(...args).status, 2, args.join(' '));
    }

    assert.match(site.assemble('v7', '6').stderr, /nothing to assemble/);
    run('rm', [join(site.dir, 'current')]);
    assert.match(site.assemble('v7', '5').stderr, /no release is being served/);
});
