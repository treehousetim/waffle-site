// src/core/lib/manifest.js — docs/scoped-builds.md: the page manifest and scoped builds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    affectedPages, changedKeys, createManifest, ManifestError, parseManifest, pageFile, planScopedRelease, wants,
} from '../../src/core/lib/manifest.js';

const manifest = (records, pages, release = 'v7') => ({ release, records, pages });

const before = manifest(
    { 'stays:a': 'fa', 'stays:b': 'fb', 'posts:p': 'fp' },
    { '/stays/': ['stays:*'], '/stays/a/': ['stays:a'], '/stays/b/': ['stays:b'], '/blog/p/': ['posts:p'], '/about/': [] },
);

test('a manifest records every record\'s fingerprint and what each page uses', () => {
    const made = createManifest({
        release: 'v7',
        records: [{ key: 'stays:b', fingerprint: 'fb' }, { key: 'stays:a', fingerprint: 'fa' }, { key: 'stays:c', fingerprint: 'fc' }],
        pages: [{ path: '/stays/a/', uses: ['stays:a'] }, { path: '/stays/', uses: ['stays:*'] }, { path: '/stays/c/', uses: ['stays:c'] }],
    });

    assert.deepEqual(Object.keys(made.records), ['stays:a', 'stays:b', 'stays:c']);
    assert.deepEqual(Object.keys(made.pages), ['/stays/', '/stays/a/', '/stays/c/']);
    assert.deepEqual(parseManifest(JSON.parse(JSON.stringify(made))), made);
});

test('a manifest that is not one is refused, naming what is wrong', () => {
    for (const [bad, message] of [
        [null, /expected an object/],
        [{ release: '', records: {}, pages: {} }, /release: expected a release tag/],
        [{ release: 'v7', records: [], pages: {} }, /records: expected/],
        [{ release: 'v7', records: { 'stays:a': 3 }, pages: {} }, /records: expected/],
        [{ release: 'v7', records: { 'Stays a': 'f' }, pages: {} }, /records: expected/],
        [{ release: 'v7', records: {}, pages: { '/a/': 'stays:a' } }, /pages: expected/],
        [{ release: 'v7', records: {}, pages: { 'a/': [] } }, /pages: expected/],
        [{ release: 'v7', records: {}, pages: { '/a/': ['nope'] } }, /pages: expected/],
    ]) {
        assert.throws(() => parseManifest(bad), (e) => e instanceof ManifestError && message.test(e.message));
    }
});

test('a record changed if it is new, gone, or different (13)', () => {
    const after = manifest({ 'stays:a': 'fa', 'stays:b': 'fb2', 'stays:c': 'fc', 'posts:p': 'fp' }, {});
    const gone = manifest({ 'stays:b': 'fb', 'posts:p': 'fp' }, {});

    assert.deepEqual([...changedKeys(before, after)].sort(), ['stays:b', 'stays:c']);
    assert.deepEqual([...changedKeys(before, gone)], ['stays:a']);
    assert.deepEqual([...changedKeys(before, before)], []);
});

test('the affected pages are those that used a changed record, before or after (13)', () => {
    const after = manifest(
        { 'stays:a': 'fa', 'stays:b2': 'fb', 'posts:p': 'fp' },
        { '/stays/': ['stays:*'], '/stays/a/': ['stays:a'], '/stays/b2/': ['stays:b2'], '/blog/p/': ['posts:p'], '/about/': [] },
    );

    // b became b2: its old page, its new one, and the list of all stays. Not
    // the other stay, not the post, not a page that uses no records.
    assert.deepEqual(affectedPages(before, after), ['/stays/', '/stays/b/', '/stays/b2/']);
});

test('a scoped build makes only the entity pages whose record changed (14)', () => {
    assert.equal(wants(null, { key: 'stays:a', fingerprint: 'fa' }), true);
    assert.equal(wants(before, { key: 'stays:a', fingerprint: 'fa' }), false);
    assert.equal(wants(before, { key: 'stays:a', fingerprint: 'changed' }), true);
    assert.equal(wants(before, { key: 'stays:new', fingerprint: 'fn' }), true);
});

test('a page is a directory with an index.html', () => {
    assert.equal(pageFile('/'), 'index.html');
    assert.equal(pageFile('/stays/a/'), 'stays/a/index.html');
});

test('a scoped release copies the affected pages that exist and removes those that do not (13, 15)', () => {
    const after = manifest(
        { 'stays:a': 'fa2', 'posts:p': 'fp' },
        { '/stays/': ['stays:*'], '/stays/a/': ['stays:a'], '/blog/p/': ['posts:p'], '/about/': [] },
    );

    assert.deepEqual(planScopedRelease(before, after), {
        copy: ['stays/a/index.html', 'stays/index.html'],
        remove: ['stays/b'],
    });
});

test('a scoped release is never laid over another release\'s code (15)', () => {
    assert.throws(() => planScopedRelease(before, { ...before, release: 'v8' }), /built from v8, but v7 is being served/);
});
