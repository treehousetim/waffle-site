/**
 * The price guide, as the waffle app describes it at /api/site/prices
 * (docs/waffle-api.md). The office keeps prices in the app; the site shows
 * them as of the last build. The data is checked here before a page renders
 * it: an item in the wrong shape fails the build with the field named,
 * rather than shipping a price list with a blank price.
 */

import { WaffleApiError } from './waffle-api.js';

/** What a price is per. */
export const UNITS = ['job', 'hour', 'visit', 'fixture'];

/**
 * @typedef {object} PriceItem
 * @property {string} id
 * @property {string} category
 * @property {string} name
 * @property {string} description
 * @property {number} fromCents     the starting price
 * @property {string} currency      ISO 4217, e.g. USD
 * @property {'job' | 'hour' | 'visit' | 'fixture'} unit
 * @property {string | null} service  the slug of the service page it belongs to
 */

/**
 * @typedef {object} PriceGuide
 * @property {string} updated  YYYY-MM-DD, when the office last changed it
 * @property {PriceItem[]} items
 */

/**
 * @param {unknown} data
 * @returns {PriceGuide}
 */
export function parsePriceGuide(data) {
    const where = '/api/site/prices';

    if (data === null || typeof data !== 'object' || Array.isArray(data)) {
        throw new WaffleApiError(`${where}: expected {"updated": "YYYY-MM-DD", "items": [...]}.`);
    }

    const guide = /** @type {Record<string, unknown>} */ (data);
    const updated = guide.updated;

    if (typeof updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(updated) || Number.isNaN(Date.parse(updated))) {
        throw new WaffleApiError(`${where}.updated: expected a date, YYYY-MM-DD.`);
    }

    if (!Array.isArray(guide.items) || guide.items.length === 0) {
        throw new WaffleApiError(`${where}.items: expected a non-empty list.`);
    }

    const items = guide.items.map((raw, index) => parseItem(raw, `${where}.items[${index}]`));
    const ids = new Set();

    for (const item of items) {
        if (ids.has(item.id)) {
            throw new WaffleApiError(`${where}: two items have the id '${item.id}'.`);
        }

        ids.add(item.id);
    }

    return { updated, items };
}

/**
 * @param {unknown} raw
 * @param {string} where
 * @returns {PriceItem}
 */
function parseItem(raw, where) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new WaffleApiError(`${where}: expected an object.`);
    }

    const item = /** @type {Record<string, unknown>} */ (raw);
    const text = (/** @type {string} */ field) => {
        const value = item[field];

        if (typeof value !== 'string' || value.trim() === '') {
            throw new WaffleApiError(`${where}.${field}: expected text.`);
        }

        return value.trim();
    };
    const slug = (/** @type {string} */ field, /** @type {string} */ value) => {
        if (!/^[a-z0-9][a-z0-9-]*$/.test(value)) {
            throw new WaffleApiError(`${where}.${field}: lowercase letters, digits and -; got '${value}'.`);
        }

        return value;
    };

    const fromCents = item.from_cents;

    if (typeof fromCents !== 'number' || !Number.isInteger(fromCents) || fromCents < 0) {
        throw new WaffleApiError(`${where}.from_cents: expected a whole number of cents, 0 or more.`);
    }

    const currency = text('currency');

    if (!/^[A-Z]{3}$/.test(currency)) {
        throw new WaffleApiError(`${where}.currency: expected a three-letter code such as USD; got '${currency}'.`);
    }

    const unit = text('unit');

    if (!UNITS.includes(unit)) {
        throw new WaffleApiError(`${where}.unit: expected one of ${UNITS.join(', ')}; got '${unit}'.`);
    }

    // A slug, never a URL: the page builds the link, so the app cannot send
    // one that goes anywhere else.
    const service = item.service === undefined || item.service === null ? null : slug('service', String(item.service));

    return {
        id: slug('id', text('id')),
        category: text('category'),
        name: text('name'),
        description: text('description'),
        fromCents,
        currency,
        unit: /** @type {PriceItem['unit']} */ (unit),
        service,
    };
}

/**
 * Items grouped by category, in the order each category first appears.
 *
 * @param {readonly PriceItem[]} items
 * @returns {{ category: string, items: PriceItem[] }[]}
 */
export function byCategory(items) {
    /** @type {Map<string, PriceItem[]>} */
    const groups = new Map();

    for (const item of items) {
        groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
    }

    return [...groups].map(([category, grouped]) => ({ category, items: grouped }));
}

/**
 * A price for people: no decimals on whole amounts, $0 as "Free".
 *
 * @param {number} cents
 * @param {string} currency
 * @param {string} [locale]
 */
export function formatPrice(cents, currency, locale = 'en-US') {
    if (cents === 0) {
        return 'Free';
    }

    const whole = cents % 100 === 0;

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2,
    }).format(cents / 100);
}
