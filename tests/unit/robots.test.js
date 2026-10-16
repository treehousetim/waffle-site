// src/lib/robots.js — docs/seo.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { robotsTxt } from '../../src/lib/robots.js';

test('production lets robots in and names the sitemap', () => {
    assert.equal(
        robotsTxt({ indexable: true, siteUrl: 'https://www.acme.com', sitemapPath: '/sitemap-index.xml' }),
        'User-agent: *\nAllow: /\n\nSitemap: https://www.acme.com/sitemap-index.xml\n',
    );
});

test('any other build keeps every robot out and names no sitemap', () => {
    assert.equal(
        robotsTxt({ indexable: false, siteUrl: 'http://localhost:4321', sitemapPath: '/sitemap-index.xml' }),
        'User-agent: *\nDisallow: /\n',
    );
});
