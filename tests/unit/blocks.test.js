// src/core/lib/blocks.js — block bodies from the waffle app (Waffle's docs/content.md, "Blocks").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captionLine, markdownOf, mediaOf, parseBlocks, parseMedia } from '../../src/core/lib/blocks.js';
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

const media = (id, overrides = {}) => ({ id, path: `/api/site/media/${id}.jpg`, width: 1200, height: 800, alt: `Image ${id}`, caption: null, credit_name: null, credit_url: null, ...overrides });

test('image and gallery blocks carry the images the app describes, and every image is named once', () => {
    const blocks = [
        { type: 'image', media_id: 1, caption: 'The room', media: media(1) },
        { type: 'gallery', media_ids: [2, 1], caption: null, media: [media(2), media(1)] },
    ];

    assert.deepEqual(parseBlocks(blocks, 'b'), blocks);
    assert.deepEqual(markdownOf(blocks), [[], []]);
    assert.deepEqual(mediaOf(blocks).map((m) => m.id), [1, 2]);
    assert.deepEqual(mediaOf([{ type: 'heading', level: 2, text: 'A' }]), []);
});

test('an image the build cannot trust fails it, naming the field (1)', () => {
    const cases = [
        [{ type: 'image', media_id: 1, caption: null, media: null }, /b\[0\]\.media: expected an image/],
        [{ type: 'image', media_id: 1, caption: null, media: media(1, { extra: 1 }) }, /b\[0\]\.media: unexpected field extra/],
        [{ type: 'image', media_id: 1, caption: null, media: media(1, { path: 'https://elsewhere.example/x.jpg' }) }, /expected an image id and its/],
        [{ type: 'image', media_id: 1, caption: null, media: media(1, { width: 0 }) }, /expected the image's width and height/],
        [{ type: 'image', media_id: 1, caption: null, media: media(1, { alt: '' }) }, /b\[0\]\.media\.alt: expected text/],
        [{ type: 'image', media_id: 1, caption: 3, media: media(1) }, /b\[0\]\.caption: expected text or null/],
        [{ type: 'gallery', media_ids: [1], caption: null, media: [media(1)] }, /b\[0\]\.media: expected the gallery's images/],
        [{ type: 'gallery', media_ids: [1, 2], caption: null, media: [media(1), null] }, /b\[0\]\.media\[1\]: expected an image/],
    ];

    for (const [block, message] of cases) {
        assert.throws(() => parseBlocks([block], 'b'), message, String(message));
    }
});

test('one image on its own, such as a cover, is checked like a block\'s and given back', () => {
    assert.deepEqual(parseMedia(media(4), 'cover'), media(4));
    assert.throws(() => parseMedia(media(4, { width: 0 }), 'cover'), (e) => e instanceof WaffleApiError && /cover: expected the image's width and height/.test(e.message));
});

test('an image\'s credit is shown with or without a caption, each name once', () => {
    assert.equal(captionLine('The room', [media(1, { credit_name: 'Sample Person' })]), 'The room · Credit: Sample Person');
    assert.equal(captionLine(null, [media(1, { credit_name: 'Sample Person' }), media(2, { credit_name: 'Sample Person' }), media(3)]), 'Credit: Sample Person');
    assert.equal(captionLine('Just a caption', [media(1)]), 'Just a caption');
    assert.equal(captionLine(null, [media(1)]), '');
});
