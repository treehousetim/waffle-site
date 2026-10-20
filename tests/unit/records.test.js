// src/core/lib/records.js — docs/data-pages.md: records from the waffle app's content site API.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fingerprint, parseRecords, parseRetired, SLUG } from '../../src/core/lib/records.js';
import { WaffleApiError } from '../../src/core/lib/waffle-api.js';

const raw = (overrides = {}) => ({
    id: 3,
    slug: 'lakeside-cabin',
    title: 'Lakeside cabin',
    summary: 'A cabin by the lake.',
    body: 'Sleeps six.',
    seo_title: null,
    seo_description: 'Sample description.',
    published_at: '2026-01-01T12:00:00Z',
    updated_at: '2026-01-02T12:00:00Z',
    previous_slugs: ['lakeside'],
    ...overrides,
});
const data = (...records) => ({ records });
const noFields = () => ({});

test('a valid record becomes the shape pages use, with its own fields parsed', () => {
    const [record] = parseRecords(data(raw({ town: 'Asheville' })), {
        path: '/api/site/properties',
        fields: (r, where) => ({ town: `${r.town} at ${where}` }),
    });

    assert.deepEqual({ ...record, raw: undefined }, {
        key: 'properties:lakeside-cabin',
        slug: 'lakeside-cabin',
        title: 'Lakeside cabin',
        summary: 'A cabin by the lake.',
        body: 'Sleeps six.',
        seoTitle: null,
        seoDescription: 'Sample description.',
        publishedAt: new Date('2026-01-01T12:00:00Z'),
        updatedAt: new Date('2026-01-02T12:00:00Z'),
        previousSlugs: ['lakeside'],
        fields: { town: 'Asheville at /api/site/properties.records[0]' },
        fingerprint: fingerprint(raw({ town: 'Asheville' })),
        raw: undefined,
    });
});

test('the type is the last part of the path', () => {
    assert.equal(parseRecords(data(raw()), { path: '/api/site/posts', fields: noFields })[0].key, 'posts:lakeside-cabin');
    assert.deepEqual(parseRecords(data(), { path: '/api/site/posts', fields: noFields }), []);
});

test('the answer must hold a list of records (1)', () => {
    for (const bad of [null, [], {}, { records: {} }]) {
        assert.throws(() => parseRecords(bad, { path: '/api/site/posts', fields: noFields }), (e) => e instanceof WaffleApiError && /\/api\/site\/posts: expected \{"records"/.test(e.message));
    }
});

test('a record that does not parse names the record and the field (1)', () => {
    const cases = [
        [null, /records\[0\]: expected an object/],
        [raw({ slug: 'Lakeside Cabin' }), /records\[0\]\.slug: expected lowercase letters/],
        [raw({ slug: 7 }), /records\[0\]\.slug: expected lowercase letters/],
        [raw({ title: ' ' }), /records\[0\]\.title: expected text/],
        [raw({ summary: 3 }), /records\[0\]\.summary: expected text/],
        [raw({ body: null }), /records\[0\]\.body: expected text/],
        [raw({ seo_title: 4 }), /records\[0\]\.seo_title: expected text or null/],
        [raw({ seo_description: undefined }), /records\[0\]\.seo_description: expected text or null/],
        [raw({ published_at: '2026-01-01 12:00:00' }), /records\[0\]\.published_at: expected a UTC time/],
        [raw({ updated_at: '2026-13-01T12:00:00Z' }), /records\[0\]\.updated_at: expected a UTC time/],
        [raw({ previous_slugs: 'lakeside' }), /records\[0\]\.previous_slugs: expected a list of slugs/],
        [raw({ previous_slugs: ['Bad Slug'] }), /records\[0\]\.previous_slugs: expected a list of slugs/],
    ];

    for (const [record, message] of cases) {
        assert.throws(() => parseRecords(data(record), { path: '/api/site/posts', fields: noFields }), message);
    }
});

test('two records may not share a slug, now or in the past (3)', () => {
    const options = { path: '/api/site/posts', fields: noFields };

    assert.throws(() => parseRecords(data(raw(), raw({ id: 4, previous_slugs: [] })), options), /two records have the slug 'lakeside-cabin'/);
    assert.throws(() => parseRecords(data(raw(), raw({ id: 4, slug: 'other', previous_slugs: ['lakeside'] })), options), /two records have the slug 'lakeside'/);
});

test('retired slugs are a list of slugs', () => {
    assert.deepEqual(parseRetired({ slugs: ['gone', 'gone-too'] }, '/api/site/properties/retired'), ['gone', 'gone-too']);

    for (const bad of [null, {}, { slugs: 'gone' }, { slugs: ['Gone'] }]) {
        assert.throws(() => parseRetired(bad, '/api/site/properties/retired'), /\/api\/site\/properties\/retired: expected \{"slugs"/);
    }
});

test('a fingerprint changes with any field, and only then', () => {
    assert.equal(fingerprint(raw()), fingerprint(raw()));
    assert.notEqual(fingerprint(raw()), fingerprint(raw({ title: 'Lakeside cabin!' })));
    assert.match(fingerprint(raw()), /^[0-9a-f]{64}$/);
    assert.ok(SLUG.test('a-b-1') && !SLUG.test('a--b'));
});

test('a type whose body is blocks has its blocks checked (1)', () => {
    const blocks = [{ type: 'heading', level: 2, text: 'The cabin' }];
    const [record] = parseRecords(data(raw({ body: blocks })), { path: '/api/site/pages', fields: noFields, body: 'blocks' });

    assert.deepEqual(record.body, blocks);
    assert.throws(() => parseRecords(data(raw({ body: 'text' })), { path: '/api/site/pages', fields: noFields, body: 'blocks' }), /records\[0\]\.body: expected a list of blocks/);
});
