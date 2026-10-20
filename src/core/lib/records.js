/**
 * Records from the waffle app's content site API (docs/data-pages.md, Waffle's
 * docs/content.md): `GET /api/site/<type>` answers `{records: [...]}`, every
 * published record as last published. Each is checked here before any page
 * uses it, and a record that does not parse fails the build with the record
 * and field named (failure 1). A record type's own fields are parsed by the
 * function the page passes in.
 */

import { createHash } from 'node:crypto';
import { parseBlocks } from './blocks.js';
import { WaffleApiError } from './waffle-api.js';

/** Lowercase letters, digits and single dashes: the app's slug rule. */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const UTC_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

/**
 * @typedef {object} SiteRecord
 * @property {string} key             "<type>:<slug>", how the page manifest names it
 * @property {string} slug
 * @property {string} title
 * @property {string} summary
 * @property {any} body               Markdown text, or a list of blocks (blocks.js) for a type whose body is blocks
 * @property {string | null} seoTitle
 * @property {string | null} seoDescription
 * @property {Date} publishedAt       first published
 * @property {Date} updatedAt         this version published
 * @property {string[]} previousSlugs each redirects to slug
 * @property {Record<string, unknown>} fields  the type's own, parsed
 * @property {string} fingerprint     changes whenever anything in the record does
 */

/**
 * @param {unknown} data  the envelope's data
 * @param {{
 *   path: string,
 *   fields: (raw: Record<string, unknown>, where: string) => Record<string, unknown>,
 *   body?: 'markdown' | 'blocks',
 * }} options
 * @returns {SiteRecord[]}
 */
export function parseRecords(data, { path, fields, body = 'markdown' }) {
    const type = path.split('/').filter(Boolean).at(-1);

    if (data === null || typeof data !== 'object' || !Array.isArray(/** @type {{records?: unknown}} */ (data).records)) {
        throw new WaffleApiError(`${path}: expected {"records": [...]}.`);
    }

    const records = /** @type {unknown[]} */ (/** @type {{records: unknown[]}} */ (data).records).map((raw, index) => {
        const where = `${path}.records[${index}]`;

        if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
            throw new WaffleApiError(`${where}: expected an object.`);
        }

        const record = /** @type {Record<string, unknown>} */ (raw);
        const slug = slugOf(record.slug, `${where}.slug`);

        return {
            key: `${type}:${slug}`,
            slug,
            title: text(record.title, `${where}.title`, true),
            summary: text(record.summary, `${where}.summary`, false),
            body: body === 'blocks' ? parseBlocks(record.body, `${where}.body`) : text(record.body, `${where}.body`, false),
            seoTitle: optionalText(record.seo_title, `${where}.seo_title`),
            seoDescription: optionalText(record.seo_description, `${where}.seo_description`),
            publishedAt: utc(record.published_at, `${where}.published_at`),
            updatedAt: utc(record.updated_at, `${where}.updated_at`),
            previousSlugs: slugList(record.previous_slugs, `${where}.previous_slugs`),
            fields: fields(record, where),
            fingerprint: fingerprint(record),
        };
    });

    // (3) A slug, current or past, belongs to one record: two would make one
    // page overwrite another, or a redirect point at the wrong page.
    const seen = new Set();

    for (const slug of records.flatMap((record) => [record.slug, ...record.previousSlugs])) {
        if (seen.has(slug)) {
            throw new WaffleApiError(`${path}: two records have the slug '${slug}'.`);
        }

        seen.add(slug);
    }

    return records;
}

/**
 * `GET /api/site/<type>/retired`: every slug of every retired record, which
 * the site answers with 410 Gone.
 *
 * @param {unknown} data
 * @param {string} path
 * @returns {string[]}
 */
export function parseRetired(data, path) {
    const slugs = data !== null && typeof data === 'object' ? /** @type {{slugs?: unknown}} */ (data).slugs : undefined;

    if (!Array.isArray(slugs) || !slugs.every((slug) => typeof slug === 'string' && SLUG.test(slug))) {
        throw new WaffleApiError(`${path}: expected {"slugs": [...]}, each a slug.`);
    }

    return slugs;
}

/**
 * A record's fingerprint: the SHA-256 of what the app sent. The page manifest
 * keeps it, so the next build sees exactly which records changed.
 *
 * @param {unknown} raw
 */
export function fingerprint(raw) {
    return createHash('sha256').update(JSON.stringify(raw)).digest('hex');
}

/** @param {unknown} value @param {string} where */
function slugOf(value, where) {
    if (typeof value !== 'string' || !SLUG.test(value)) {
        throw new WaffleApiError(`${where}: expected lowercase letters, digits and single dashes.`);
    }

    return value;
}

/** @param {unknown} value @param {string} where */
function slugList(value, where) {
    if (!Array.isArray(value) || !value.every((slug) => typeof slug === 'string' && SLUG.test(slug))) {
        throw new WaffleApiError(`${where}: expected a list of slugs.`);
    }

    return /** @type {string[]} */ (value);
}

/** @param {unknown} value @param {string} where @param {boolean} required */
function text(value, where, required) {
    if (typeof value !== 'string' || (required && value.trim() === '')) {
        throw new WaffleApiError(`${where}: expected text.`);
    }

    return value;
}

/** @param {unknown} value @param {string} where */
function optionalText(value, where) {
    if (value !== null && typeof value !== 'string') {
        throw new WaffleApiError(`${where}: expected text or null.`);
    }

    return value;
}

/** @param {unknown} value @param {string} where */
function utc(value, where) {
    const text = typeof value === 'string' && UTC_TIME.test(value) ? value : null;
    const at = text === null ? null : new Date(text);

    if (text === null || at === null || Number.isNaN(at.getTime()) || at.toISOString().slice(0, 19) !== text.slice(0, 19)) {
        throw new WaffleApiError(`${where}: expected a UTC time, like 2026-11-12T18:30:00Z.`);
    }

    return at;
}
