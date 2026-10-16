// src/lib/seo.js — docs/seo.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { absoluteUrl, canonicalUrl, isNoindex, pageTitle, robotsMeta } from '../../src/core/lib/seo.js';

const site = 'https://www.acme.com';

test('a title gets the site name after it', () => {
    assert.equal(pageTitle('Pricing', 'Acme'), 'Pricing — Acme');
    assert.equal(pageTitle('  Pricing  ', 'Acme'), 'Pricing — Acme');
});

test('a title that already names the site is left alone, in any case', () => {
    assert.equal(pageTitle('Acme — scheduling for small teams', 'Acme'), 'Acme — scheduling for small teams');
    assert.equal(pageTitle('Why ACME exists', 'Acme'), 'Why ACME exists');
});

test('an empty title becomes the site name', () => {
    assert.equal(pageTitle('   ', 'Acme'), 'Acme');
});

test('canonical URLs are absolute, end pages with a slash, and drop query and fragment', () => {
    assert.equal(canonicalUrl('/', site), 'https://www.acme.com/');
    assert.equal(canonicalUrl('/pricing', site), 'https://www.acme.com/pricing/');
    assert.equal(canonicalUrl('/pricing/', site), 'https://www.acme.com/pricing/');
    assert.equal(canonicalUrl('/blog/hello/?utm_source=x#top', site), 'https://www.acme.com/blog/hello/');
});

test('canonical URLs keep file names as they are', () => {
    assert.equal(canonicalUrl('/404.html', site), 'https://www.acme.com/404.html');
    assert.equal(canonicalUrl('/blog/rss.xml', site), 'https://www.acme.com/blog/rss.xml');
});

test('canonical URLs never leave the site', () => {
    assert.equal(canonicalUrl('//evil.example/x', site), 'https://www.acme.com/x/');
});

test('absolute URLs resolve paths against the site and leave absolute ones alone', () => {
    assert.equal(absoluteUrl('/og-default.png', site), 'https://www.acme.com/og-default.png');
    assert.equal(absoluteUrl('https://cdn.example/x.png', site), 'https://cdn.example/x.png');
});

test('a build that is not indexable keeps every robot out', () => {
    assert.equal(robotsMeta({ indexable: false, noindex: false }), 'noindex, nofollow');
    assert.equal(robotsMeta({ indexable: false, noindex: true }), 'noindex, nofollow');
});

test('production indexes pages, and follows the links on unlisted ones', () => {
    assert.equal(robotsMeta({ indexable: true, noindex: false }), 'index, follow');
    assert.equal(robotsMeta({ indexable: true, noindex: true }), 'noindex, follow');
});

test('noindex paths match with or without the slash or .html', () => {
    const list = ['/404', '/contact/thanks/'];

    assert.equal(isNoindex('/404/', list), true);
    assert.equal(isNoindex('/404.html', list), true);
    assert.equal(isNoindex('/contact/thanks', list), true);
    assert.equal(isNoindex('/contact/', list), false);
    assert.equal(isNoindex('/', ['/']), true);
    assert.equal(isNoindex('/', []), false);
});
