// src/core/lib/routes.js — pages from the app never replace the site's own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertFreeSlugs, topLevelNames, withoutOwn } from '../../src/core/lib/routes.js';

test('names the site\'s own top-level pages and folders from its page files', () => {
    assert.deepEqual(
        topLevelNames(['./about.astro', './index.astro', './stays/index.astro', './[slug].astro', './robots.txt.ts', './blog/[slug].astro']),
        new Set(['about', 'index', 'stays', '[slug]', 'robots.txt', 'blog']),
    );
});

test('refuses an app page whose slug is one of the site\'s own', () => {
    const own = new Set(['about', 'stays']);

    assert.doesNotThrow(() => assertFreeSlugs(['house-rules'], own));
    assert.throws(() => assertFreeSlugs(['house-rules', 'about'], own), /The app's page 'about' would replace the site's own \/about\//);
});

test('never lets an old or retired app page slug redirect or 410 one of the site\'s own', () => {
    assert.deepEqual(withoutOwn(['contact', 'old-house-rules', 'about'], new Set(['about', 'contact'])), ['old-house-rules']);
});
