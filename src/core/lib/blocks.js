/**
 * Block bodies from the waffle app (Waffle's docs/content.md, "Blocks"): an
 * ordered list of typed blocks from one fixed set, each rendered by its own
 * component. The app checks them when staff save; they are checked again
 * here, so a block this site cannot render fails the build, naming the block
 * and field (docs/data-pages.md, failure 1), instead of vanishing from a page.
 */

import { WaffleApiError } from './waffle-api.js';

/** Every type, and the fields it takes. */
const FIELDS = {
    heading: ['type', 'level', 'text'],
    text: ['type', 'markdown'],
    quote: ['type', 'text', 'cite'],
    callout: ['type', 'tone', 'markdown'],
    faq: ['type', 'items'],
    cta: ['type', 'label', 'path', 'note'],
    table: ['type', 'columns', 'rows'],
    image: ['type', 'media_id', 'caption', 'media'],
    gallery: ['type', 'media_ids', 'caption', 'media'],
};

const MEDIA_FIELDS = ['id', 'path', 'width', 'height', 'alt', 'caption', 'credit_name', 'credit_url'];

const SITE_PATH = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/;

/**
 * @param {unknown} value
 * @param {string} where
 * @returns {Record<string, any>[]}
 */
export function parseBlocks(value, where) {
    if (!Array.isArray(value)) {
        throw new WaffleApiError(`${where}: expected a list of blocks.`);
    }

    return value.map((block, index) => parseBlock(block, `${where}[${index}]`));
}

/**
 * The Markdown in each block, in order, for the page to render: a list per
 * block (a block of questions holds one per answer).
 *
 * @param {readonly Record<string, any>[]} blocks
 * @returns {string[][]}
 */
export function markdownOf(blocks) {
    return blocks.map((block) => {
        switch (block.type) {
            case 'text':
            case 'callout':
                return [block.markdown];
            case 'faq':
                return block.items.map((/** @type {{ answer: string }} */ item) => item.answer);
            default:
                return [];
        }
    });
}

/**
 * Every image the blocks show, once each, as the app described it: what a
 * build fetches and resizes.
 *
 * @param {readonly Record<string, any>[]} blocks  parsed
 * @returns {{ id: number, path: string, width: number, height: number, alt: string, caption: string | null, credit_name: string | null, credit_url: string | null }[]}
 */
export function mediaOf(blocks) {
    const seen = new Map();

    for (const block of blocks) {
        for (const media of block.type === 'image' ? [block.media] : block.type === 'gallery' ? block.media : []) {
            seen.set(media.id, media);
        }
    }

    return [...seen.values()];
}

/** @param {unknown} raw @param {string} where */
function parseBlock(raw, where) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new WaffleApiError(`${where}: expected a block.`);
    }

    const block = /** @type {Record<string, unknown>} */ (raw);
    const type = String(block.type);
    const fields = /** @type {Record<string, string[]>} */ (FIELDS)[type];

    if (fields === undefined) {
        throw new WaffleApiError(`${where}: '${type}' is not a block type this site renders.`);
    }

    const extra = Object.keys(block).filter((key) => !fields.includes(key));

    if (extra.length > 0) {
        throw new WaffleApiError(`${where}: unexpected field ${extra.join(', ')}.`);
    }

    switch (type) {
        case 'heading':
            if (![2, 3, 4].includes(/** @type {number} */ (block.level))) {
                throw new WaffleApiError(`${where}.level: expected 2, 3 or 4.`);
            }
            text(block.text, `${where}.text`);
            break;
        case 'text':
            text(block.markdown, `${where}.markdown`);
            break;
        case 'quote':
            text(block.text, `${where}.text`);
            optionalText(block.cite, `${where}.cite`);
            break;
        case 'callout':
            if (block.tone !== 'note' && block.tone !== 'warning') {
                throw new WaffleApiError(`${where}.tone: expected note or warning.`);
            }
            text(block.markdown, `${where}.markdown`);
            break;
        case 'faq':
            faq(block.items, `${where}.items`);
            break;
        case 'cta':
            text(block.label, `${where}.label`);
            if (typeof block.path !== 'string' || !SITE_PATH.test(block.path)) {
                throw new WaffleApiError(`${where}.path: expected a page on this site, like /about/.`);
            }
            optionalText(block.note, `${where}.note`);
            break;
        case 'image':
            optionalText(block.caption, `${where}.caption`);
            parseMedia(block.media, `${where}.media`);
            break;
        case 'gallery':
            optionalText(block.caption, `${where}.caption`);
            if (!Array.isArray(block.media) || block.media.length < 2) {
                throw new WaffleApiError(`${where}.media: expected the gallery's images.`);
            }
            block.media.forEach((media, index) => parseMedia(media, `${where}.media[${index}]`));
            break;
        default:
            table(block, where);
    }

    return block;
}

/**
 * One image as the app describes it: published, so described (Waffle's
 * docs/content.md, "Media"), and fetched by its path on the app.
 *
 * @param {unknown} raw
 * @param {string} where
 */
function parseMedia(raw, where) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new WaffleApiError(`${where}: expected an image.`);
    }

    const media = /** @type {Record<string, unknown>} */ (raw);
    const extra = Object.keys(media).filter((key) => !MEDIA_FIELDS.includes(key));

    if (extra.length > 0) {
        throw new WaffleApiError(`${where}: unexpected field ${extra.join(', ')}.`);
    }

    if (!Number.isInteger(media.id) || typeof media.path !== 'string' || media.path !== `/api/site/media/${media.id}.jpg`) {
        throw new WaffleApiError(`${where}: expected an image id and its /api/site/media/<id>.jpg path.`);
    }

    if (!Number.isInteger(media.width) || !Number.isInteger(media.height) || Number(media.width) < 1 || Number(media.height) < 1) {
        throw new WaffleApiError(`${where}: expected the image's width and height.`);
    }

    text(media.alt, `${where}.alt`);
    optionalText(media.caption, `${where}.caption`);
    optionalText(media.credit_name, `${where}.credit_name`);
    optionalText(media.credit_url, `${where}.credit_url`);
}

/** @param {unknown} items @param {string} where */
function faq(items, where) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new WaffleApiError(`${where}: expected a non-empty list.`);
    }

    items.forEach((item, index) => {
        if (item === null || typeof item !== 'object') {
            throw new WaffleApiError(`${where}[${index}]: expected a question and answer.`);
        }

        text(item.question, `${where}[${index}].question`);
        text(item.answer, `${where}[${index}].answer`);
    });
}

/** @param {Record<string, unknown>} block @param {string} where */
function table(block, where) {
    const { columns, rows } = block;

    if (!Array.isArray(columns) || columns.length === 0 || !columns.every((column) => typeof column === 'string')) {
        throw new WaffleApiError(`${where}.columns: expected a non-empty list of text.`);
    }

    if (!Array.isArray(rows)) {
        throw new WaffleApiError(`${where}.rows: expected a list.`);
    }

    rows.forEach((row, index) => {
        if (!Array.isArray(row) || row.length !== columns.length || !row.every((cell) => typeof cell === 'string')) {
            throw new WaffleApiError(`${where}.rows[${index}]: expected ${columns.length} cells of text.`);
        }
    });
}

/** @param {unknown} value @param {string} where */
function text(value, where) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new WaffleApiError(`${where}: expected text.`);
    }
}

/** @param {unknown} value @param {string} where */
function optionalText(value, where) {
    if (value !== null && typeof value !== 'string') {
        throw new WaffleApiError(`${where}: expected text or null.`);
    }
}
