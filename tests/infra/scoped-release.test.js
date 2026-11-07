/**
 * Scoped builds (docs/scoped-builds.md, whose failure list the numbers cite):
 * tools/scoped-release.mjs, which picks what a scoped build ships, and
 * deploy/assemble.sh, which lays it over a copy of the served release on the
 * server. Both run for real against scratch directories.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT, run, scratch } from '../support/shell.js';

const HEAD = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
const sitemap = (...paths) => `${HEAD}${paths.map((path) => `<url><loc>https://waffle-site.example.com${path}</loc></url>`).join('')}</urlset>`;
const manifest = (records, pages, release = '7') => JSON.stringify({ release, records, pages });

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
function scopedBuild(release = '7') {
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
    const result = scope(scopedBuild('8'));

    assert.equal(result.status, 1);
    assert.match(result.stderr, /built from 8, but 7 is being served/);
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

/**
 * A server serving 7, with a data rebuild of it unpacked by the poller into
 * releases/7.d5.incoming. assemble.sh is run from the served release, as the
 * poller runs it.
 */
function server({ servedRelease = '7', base = '7' } = {}) {
    const dir = scratch('assemble-');
    write(dir, {
        'releases/7/deploy/assemble.sh': readFileSync(join(ROOT, 'deploy/assemble.sh'), 'utf8'),
        'releases/7/deploy/deploy.sh': 'echo "$1" > "$(dirname "$0")/../../../deployed"',
        'releases/7/dist/pages-manifest.json': `{\n "release": "${servedRelease}",\n "records": {},\n "pages": {}\n}`,
        'releases/7/dist/index.html': 'home',
        'releases/7/dist/stays/a/index.html': 'stay a, old',
        'releases/7/dist/stays/b/index.html': 'stay b',
        'incoming/pages-manifest.json': '{"release": "7"}',
        'incoming/stays/a/index.html': 'stay a, new',
        'incoming/build.txt': '7.d5\n',
        'incoming/.scoped-remove': 'stays/b\n',
        'incoming/.scoped-base': `${base}\n`,
    });
    symlinkSync('releases/7', join(dir, 'current'));

    return {
        dir,
        out: join(dir, 'releases/7.d5.partial'),
        assemble: (...args) => run('bash', [join(dir, 'releases/7/deploy/assemble.sh'), ...args], { cwd: dir }),
    };
}

const go = (site) => site.assemble(join(site.dir, 'incoming'), site.out);

test('assemble: a copy of the served release with the changes laid over, and nothing deployed', () => {
    const site = server();
    const result = go(site);
    const fresh = (path) => readFileSync(join(site.out, path), 'utf8');

    assert.equal(result.status, 0, result.stderr);
    assert.equal(fresh('dist/stays/a/index.html'), 'stay a, new');
    assert.equal(fresh('dist/index.html'), 'home');
    assert.equal(fresh('dist/build.txt'), '7.d5\n');
    assert.equal(existsSync(join(site.out, 'dist/stays/b')), false);
    assert.equal(existsSync(join(site.out, 'dist/.scoped-remove')), false);
    assert.equal(existsSync(join(site.out, 'dist/.scoped-base')), false);
    assert.ok(existsSync(join(site.out, 'deploy/deploy.sh')), 'the copy carries the served release\'s server files');
    assert.equal(existsSync(join(site.dir, 'deployed')), false);
});

test('assemble: the served release is never changed, so rolling back works (15)', () => {
    const site = server();
    go(site);

    assert.equal(readFileSync(join(site.dir, 'releases/7/dist/stays/a/index.html'), 'utf8'), 'stay a, old');
    assert.ok(existsSync(join(site.dir, 'releases/7/dist/stays/b/index.html')));
    assert.equal(readlinkSync(join(site.dir, 'current')), 'releases/7');
});

test('assemble: refused over a release built from other code (15)', () => {
    const site = server({ servedRelease: '6' });
    const result = go(site);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /built from 6, not 7/);
    assert.equal(existsSync(site.out), false);
});

test('assemble: refused when the rebuild was made over something other than this release (21)', () => {
    const site = server({ base: '7.d4' });
    const result = go(site);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /built over 7\.d4, not 7/);
    assert.equal(existsSync(site.out), false);
});

test('assemble: removes only page directories inside the release', () => {
    const site = server();
    write(site.dir, { 'incoming/.scoped-remove': '../7\n' });
    const result = go(site);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /not a page directory/);
    assert.ok(existsSync(join(site.dir, 'releases/7/dist/index.html')));
    assert.equal(existsSync(site.out), false);
});

test('assemble: refuses bad arguments, or an incomplete rebuild', () => {
    const site = server();

    assert.equal(site.assemble().status, 2);
    assert.equal(site.assemble(join(site.dir, 'incoming')).status, 2);

    write(site.dir, { 'incoming/build.txt': '7.d5;id\n' });
    assert.match(go(site).stderr, /build\.txt/);

    rmSync(join(site.dir, 'incoming/.scoped-base'));
    assert.match(go(site).stderr, /incomplete/);
    assert.equal(existsSync(site.out), false);
});
