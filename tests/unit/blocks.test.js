// src/core/lib/blocks.js — block bodies from the waffle app (Waffle's docs/content.md, "Blocks").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markdownOf, parseBlocks } from '../../src/core/lib/blocks.js';
import { WaffleApiError } from '../../src/core/lib/waffle-api.js';

const every = () => [
    { type: 'heading', level: 2, text: 'The cabin' },
    { type: 'text', markdown: 'Sleeps **six**.' },
    { type: 'quote', text: 'A sample quotation.', cite: null },
    { type: 'callout', tone: 'warning', markdown: 'Bring a torch.' },
    { type: 'faq', items: [{ question: 'Pets?', answer: 'Yes.' }] },
    { type: 'cta', label: 'See the stays', path: '/stays/', note: 'All year.' },
    { type: 'table', columns: ['Season'], rows: [['Summer']] },
];

test('every block type in the set passes, unchanged', () => {
    assert.deepEqual(parseBlocks(every(), 'pages[0].body'), every());
    assert.deepEqual(parseBlocks([], 'b'), []);
});

test('anything outside the set fails the build, naming the block and field (1)', () => {
    const cases = [
        ['not a list', /b: expected a list of blocks/],
        [[null], /b\[0\]: expected a block/],
        [[{ type: 'html', html: '<b>' }], /b\[0\]: 'html' is not a block type this site renders/],
        [[{ type: 'heading', level: 1, text: 'A' }], /b\[0\]\.level: expected 2, 3 or 4/],
        [[{ type: 'heading', level: 2, text: '' }], /b\[0\]\.text: expected text/],
        [[{ type: 'heading', level: 2, text: 'A', style: 'x' }], /b\[0\]: unexpected field style/],
        [[{ type: 'quote', text: 'A', cite: 3 }], /b\[0\]\.cite: expected text or null/],
        [[{ type: 'callout', tone: 'danger', markdown: 'x' }], /b\[0\]\.tone: expected note or warning/],
        [[{ type: 'faq', items: [] }], /b\[0\]\.items: expected a non-empty list/],
        [[{ type: 'faq', items: [{ question: 'Q' }] }], /b\[0\]\.items\[0\]\.answer: expected text/],
        [[{ type: 'faq', items: ['Q'] }], /b\[0\]\.items\[0\]: expected a question and answer/],
        [[{ type: 'cta', label: 'Go', path: 'https://x.example/', note: null }], /b\[0\]\.path: expected a page on this site/],
        [[{ type: 'table', columns: ['A', 'B'], rows: [['1']] }], /b\[0\]\.rows\[0\]: expected 2 cells/],
        [[{ type: 'table', columns: [], rows: [] }], /b\[0\]\.columns: expected a non-empty list of text/],
        [[{ type: 'table', columns: ['A'], rows: 'x' }], /b\[0\]\.rows: expected a list/],
    ];

    for (const [blocks, message] of cases) {
        assert.throws(() => parseBlocks(blocks, 'b'), (e) => e instanceof WaffleApiError && message.test(e.message), String(message));
    }
});

test('names the Markdown each block holds, for rendering', () => {
    assert.deepEqual(markdownOf(every()), [[], ['Sleeps **six**.'], [], ['Bring a torch.'], ['Yes.'], [], []]);
});
