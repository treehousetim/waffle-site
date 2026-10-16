// src/lib/posts.js — docs/blog.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postsTagged, readingMinutes, relatedPosts, tagIndex, tagSlug, visiblePosts } from '../../src/core/lib/posts.js';

const post = (id, date, { draft = false, tags = [] } = {}) => ({ id, data: { pubDate: new Date(date), draft, tags } });
const now = new Date('2026-10-14T12:00:00Z');

const posts = [
    post('old', '2026-01-01'),
    post('new', '2026-10-01'),
    post('draft', '2026-09-01', { draft: true }),
    post('future', '2026-12-01'),
    post('same-day-b', '2026-05-05'),
    post('same-day-a', '2026-05-05'),
];

test('production shows published posts, newest first, ties by id', () => {
    assert.deepEqual(visiblePosts(posts, { includeDrafts: false, now }).map((p) => p.id), ['new', 'same-day-a', 'same-day-b', 'old']);
});

test('drafts and future posts show only when drafts are included', () => {
    assert.deepEqual(visiblePosts(posts, { includeDrafts: true, now }).map((p) => p.id), [
        'future', 'new', 'draft', 'same-day-a', 'same-day-b', 'old',
    ]);
});

test('a post dated exactly now is published', () => {
    assert.equal(visiblePosts([post('now', now.toISOString())], { includeDrafts: false, now }).length, 1);
});

test('visiblePosts does not reorder the input', () => {
    const input = [post('a', '2026-01-01'), post('b', '2026-02-01')];
    visiblePosts(input, { includeDrafts: false, now });

    assert.deepEqual(input.map((p) => p.id), ['a', 'b']);
});

test('tag slugs are lowercase words joined by hyphens', () => {
    assert.equal(tagSlug('Product News'), 'product-news');
    assert.equal(tagSlug('  C++ & Rust! '), 'c-rust');
    assert.equal(tagSlug('release-notes'), 'release-notes');
});

test('the tag index merges spellings, counts posts once each, most used first', () => {
    const tagged = [
        post('a', '2026-01-01', { tags: ['Product', 'news'] }),
        post('b', '2026-01-02', { tags: ['product', 'Product'] }),
        post('c', '2026-01-03', { tags: ['guides'] }),
        post('d', '2026-01-04', { tags: ['Guides'] }),
    ];

    assert.deepEqual(tagIndex(tagged), [
        { tag: 'guides', slug: 'guides', count: 2 },
        { tag: 'Product', slug: 'product', count: 2 },
        { tag: 'news', slug: 'news', count: 1 },
    ]);
});

test('posts tagged with a slug match every spelling of the tag', () => {
    const tagged = [post('a', '2026-01-01', { tags: ['Product News'] }), post('b', '2026-01-02', { tags: ['other'] })];

    assert.deepEqual(postsTagged(tagged, 'product-news').map((p) => p.id), ['a']);
    assert.deepEqual(postsTagged(tagged, 'missing'), []);
});

test('reading time is words over 230, at least a minute', () => {
    assert.equal(readingMinutes(''), 1);
    assert.equal(readingMinutes('word '.repeat(100)), 1);
    assert.equal(readingMinutes('word '.repeat(690)), 3);
});

test('related posts share a topic first, then fill with the newest others, never the post itself', () => {
    const list = [
        post('a', '2026-05-01', { tags: ['Panels'] }),
        post('b', '2026-04-01', { tags: ['Lighting'] }),
        post('c', '2026-03-01', { tags: ['panels', 'Safety'] }),
        post('d', '2026-02-01', { tags: ['Safety'] }),
        post('e', '2026-01-01', { tags: [] }),
    ];

    assert.deepEqual(relatedPosts(list[0], list, 3).map((p) => p.id), ['c', 'b', 'd']);
    assert.deepEqual(relatedPosts(list[2], list, 2).map((p) => p.id), ['a', 'd']);
    assert.deepEqual(relatedPosts(list[4], list, 3).map((p) => p.id), ['a', 'b', 'c']);
    assert.deepEqual(relatedPosts(list[0], [list[0]], 3), []);
});
