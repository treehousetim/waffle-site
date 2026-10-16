// src/lib/prices.js — docs/waffle-api.md, "GET /api/site/prices".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { byCategory, formatPrice, parsePriceGuide, UNITS } from '../../src/lib/prices.js';
import { WaffleApiError } from '../../src/lib/waffle-api.js';

const item = (overrides = {}) => ({
    id: 'ev-charger',
    category: 'EV charging',
    name: 'Level 2 charger installation',
    description: 'Up to 30 feet from the panel.',
    from_cents: 89900,
    currency: 'USD',
    unit: 'job',
    service: 'ev-chargers',
    ...overrides,
});
const guide = (items = [item()], updated = '2026-10-01') => ({ updated, items });

test('a valid guide becomes the shape the page renders', () => {
    assert.deepEqual(parsePriceGuide(guide([item({ name: ' Level 2 charger installation ' })])), {
        updated: '2026-10-01',
        items: [{
            id: 'ev-charger', category: 'EV charging', name: 'Level 2 charger installation',
            description: 'Up to 30 feet from the panel.', fromCents: 89900, currency: 'USD', unit: 'job', service: 'ev-chargers',
        }],
    });
});

test('an item with no service page has service null', () => {
    assert.equal(parsePriceGuide(guide([item({ service: undefined })])).items[0].service, null);
    assert.equal(parsePriceGuide(guide([item({ service: null })])).items[0].service, null);
});

test('the guide itself must be an object with a date and items', () => {
    assert.throws(() => parsePriceGuide([]), /expected \{"updated"/);
    assert.throws(() => parsePriceGuide(null), /expected \{"updated"/);
    assert.throws(() => parsePriceGuide(guide([item()], '1 Oct')), /\.updated: expected a date/);
    assert.throws(() => parsePriceGuide(guide([item()], '2026-13-45')), /\.updated: expected a date/);
    assert.throws(() => parsePriceGuide({ updated: '2026-10-01' }), /\.items: expected a non-empty list/);
    assert.throws(() => parsePriceGuide(guide([])), /\.items: expected a non-empty list/);
});

test('each malformed field is named', () => {
    const cases = [
        [null, /items\[0\]: expected an object/],
        [[item()], /items\[0\]: expected an object/],
        [item({ id: '' }), /items\[0\]\.id: expected text/],
        [item({ id: 'EV Charger' }), /\.id: lowercase letters/],
        [item({ category: 3 }), /\.category: expected text/],
        [item({ from_cents: 899.5 }), /\.from_cents: expected a whole number/],
        [item({ from_cents: -1 }), /\.from_cents/],
        [item({ from_cents: '89900' }), /\.from_cents/],
        [item({ currency: 'usd' }), /\.currency: expected a three-letter code/],
        [item({ unit: 'week' }), /\.unit: expected one of job, hour, visit, fixture/],
        [item({ service: 'https://evil.example/' }), /\.service: lowercase letters/],
    ];

    for (const [raw, message] of cases) {
        assert.throws(() => parsePriceGuide(guide([raw])), message, JSON.stringify(raw));
    }
});

test('two items with one id are refused, as a WaffleApiError', () => {
    assert.throws(() => parsePriceGuide(guide([item(), item()])), (error) => error instanceof WaffleApiError && /two items have the id 'ev-charger'/.test(error.message));
});

test('units are the ones a page knows how to say', () => {
    assert.deepEqual(UNITS, ['job', 'hour', 'visit', 'fixture']);
});

test('items group by category in first-seen order', () => {
    const items = parsePriceGuide(guide([
        item({ id: 'a', category: 'Repairs' }),
        item({ id: 'b', category: 'EV charging' }),
        item({ id: 'c', category: 'Repairs' }),
    ])).items;

    assert.deepEqual(byCategory(items).map((group) => [group.category, group.items.map((i) => i.id)]), [
        ['Repairs', ['a', 'c']],
        ['EV charging', ['b']],
    ]);
});

test('prices drop .00, keep cents, and $0 is Free', () => {
    assert.equal(formatPrice(89900, 'USD'), '$899');
    assert.equal(formatPrice(8950, 'USD'), '$89.50');
    assert.equal(formatPrice(0, 'USD'), 'Free');
    assert.equal(formatPrice(1000, 'EUR', 'de-DE'), '10 €');
});
