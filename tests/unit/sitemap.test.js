// src/core/lib/sitemap.js — docs/scoped-builds.md: a scoped release's sitemap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeSitemap } from '../../src/core/lib/sitemap.js';

const HEAD = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
const sitemap = (...paths) => `${HEAD}${paths.map((path) => `<url><loc>https://waffle-site.example.com${path}</loc></url>`).join('')}</urlset>`;

test('a scoped release lists every page: those it built, and the served ones it kept (13)', () => {
    const served = sitemap('/', '/stays/', '/stays/a/', '/stays/b/', '/stays/gone/');
    const built = sitemap('/', '/stays/', '/stays/b/', '/stays/new/');

    assert.equal(
        mergeSitemap(served, built, ['stays/gone']),
        sitemap('/', '/stays/', '/stays/a/', '/stays/b/', '/stays/new/'),
    );
});

test('a sitemap it cannot read is refused rather than shipped empty', () => {
    assert.throws(() => mergeSitemap('not xml', sitemap('/'), []), /not a sitemap/);
    assert.throws(() => mergeSitemap(sitemap('/'), '<urlset>', []), /not a sitemap/);
});

test('a release with no pages listed yet keeps what the build made', () => {
    assert.equal(mergeSitemap(sitemap(), sitemap('/stays/a/'), []), sitemap('/stays/a/'));
});
