/**
 * The studio's packages, as the waffle app describes them at
 * GET /api/site/packages: each collection's hours of coverage, price and
 * what it includes, and the add-ons. The studio keeps prices in the app;
 * the site shows them as of the last build.
 *
 * Every field is checked before a page renders it. Anything unexpected
 * fails the build with the endpoint and the field named, rather than
 * shipping a packages page with a blank price.
 *
 * Failure list (each is a case in checks.js, "refuses packages..."):
 *   1. The answer is not an object.
 *   2. `updated` is not a YYYY-MM-DD date.
 *   3. `currency` is not a three-letter ISO 4217 code.
 *   4. `collections` is missing or empty.
 *   5. A collection's id is not a lowercase slug, or two share one.
 *   6. A name, summary or inclusion is empty, not text, or absurdly long.
 *   7. `kind` is not weddings, elopements or portraits.
 *   8. `hours`, `photographers` or `price_cents` is not a sensible number.
 *   9. `featured` is not true or false, or more than one is featured.
 *  10. An add-on is malformed, or its `per` is not hour, item or day.
 *  11. An unknown field appears: the app changed shape and the site did not.
 *
 * Kept free of imports so checks.js can run it directly.
 */

export const PACKAGE_KINDS = ['weddings', 'elopements', 'portraits'] as const;
export const ADD_ON_UNITS = ['hour', 'item', 'day'] as const;

export type PackageKind = (typeof PACKAGE_KINDS)[number];

export interface Collection {
    id: string;
    name: string;
    kind: PackageKind;
    hours: number;
    photographers: number;
    priceCents: number;
    summary: string;
    inclusions: string[];
    featured: boolean;
}

export interface AddOn {
    id: string;
    name: string;
    priceCents: number;
    per: (typeof ADD_ON_UNITS)[number];
}

export interface Packages {
    updated: string;
    currency: string;
    season: string;
    collections: Collection[];
    addOns: AddOn[];
}

const ENDPOINT = '/api/site/packages';

function fail(field: string, expected: string): never {
    throw new Error(`${ENDPOINT} ${field}: expected ${expected}.`);
}

function record(value: unknown, field: string, keys: readonly string[]): Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        fail(field, 'an object');
    }

    const object = value as Record<string, unknown>;
    const unknown = Object.keys(object).filter((key) => !keys.includes(key));

    if (unknown.length > 0) {
        fail(`${field}.${unknown[0]}`, `no such field (known: ${keys.join(', ')})`);
    }

    return object;
}

function text(value: unknown, field: string, max: number): string {
    if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
        fail(field, `text of 1-${max} characters`);
    }

    return value.trim();
}

function slug(value: unknown, field: string): string {
    if (typeof value !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)) {
        fail(field, 'a lowercase slug');
    }

    return value;
}

function number(value: unknown, field: string, min: number, max: number, integer: boolean): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
        fail(field, `${integer ? 'a whole number' : 'a number'} from ${min} to ${max}`);
    }

    return value;
}

function oneOf<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
    if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
        fail(field, `one of ${allowed.join(', ')}`);
    }

    return value as T;
}

function unique(ids: string[], field: string): void {
    const seen = new Set<string>();

    for (const id of ids) {
        if (seen.has(id)) {
            fail(field, `unique ids, but '${id}' appears twice`);
        }

        seen.add(id);
    }
}

function parseCollection(value: unknown, field: string): Collection {
    const raw = record(value, field, ['id', 'name', 'kind', 'hours', 'photographers', 'price_cents', 'summary', 'inclusions', 'featured']);

    if (!Array.isArray(raw.inclusions) || raw.inclusions.length === 0 || raw.inclusions.length > 12) {
        fail(`${field}.inclusions`, 'a list of 1-12 inclusions');
    }

    if (typeof raw.featured !== 'boolean') {
        fail(`${field}.featured`, 'true or false');
    }

    return {
        id: slug(raw.id, `${field}.id`),
        name: text(raw.name, `${field}.name`, 60),
        kind: oneOf(raw.kind, `${field}.kind`, PACKAGE_KINDS),
        hours: number(raw.hours, `${field}.hours`, 0.5, 48, false),
        photographers: number(raw.photographers, `${field}.photographers`, 1, 4, true),
        priceCents: number(raw.price_cents, `${field}.price_cents`, 1, 10_000_000, true),
        summary: text(raw.summary, `${field}.summary`, 240),
        inclusions: raw.inclusions.map((item: unknown, index: number) => text(item, `${field}.inclusions[${index}]`, 120)),
        featured: raw.featured,
    };
}

function parseAddOn(value: unknown, field: string): AddOn {
    const raw = record(value, field, ['id', 'name', 'price_cents', 'per']);

    return {
        id: slug(raw.id, `${field}.id`),
        name: text(raw.name, `${field}.name`, 80),
        priceCents: number(raw.price_cents, `${field}.price_cents`, 1, 10_000_000, true),
        per: oneOf(raw.per, `${field}.per`, ADD_ON_UNITS),
    };
}

/** Checks the app's answer and returns it in the site's own shape, or throws naming the field. */
export function parsePackages(data: unknown): Packages {
    const raw = record(data, 'data', ['updated', 'currency', 'season', 'collections', 'add_ons']);

    if (typeof raw.updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.updated) || Number.isNaN(Date.parse(raw.updated))) {
        fail('updated', 'a date, YYYY-MM-DD');
    }

    if (typeof raw.currency !== 'string' || !/^[A-Z]{3}$/.test(raw.currency)) {
        fail('currency', 'an ISO 4217 code such as USD');
    }

    if (!Array.isArray(raw.collections) || raw.collections.length === 0) {
        fail('collections', 'a non-empty list');
    }

    if (!Array.isArray(raw.add_ons)) {
        fail('add_ons', 'a list (empty is fine)');
    }

    const collections = raw.collections.map((item: unknown, index: number) => parseCollection(item, `collections[${index}]`));
    const addOns = raw.add_ons.map((item: unknown, index: number) => parseAddOn(item, `add_ons[${index}]`));

    unique(collections.map((item) => item.id), 'collections');
    unique(addOns.map((item) => item.id), 'add_ons');

    if (collections.filter((item) => item.featured).length > 1) {
        fail('collections', 'at most one featured collection');
    }

    return {
        updated: raw.updated,
        currency: raw.currency,
        season: text(raw.season, 'season', 20),
        collections,
        addOns,
    };
}

/** "$7,400": whole dollars where there are no cents, which is how a studio prices. */
export function formatMoney(cents: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    }).format(cents / 100);
}

/** "1½ hours", "9 hours", "12 hours over two days" is the page's to say; this is the number. */
export function formatHours(hours: number): string {
    const whole = Math.floor(hours);
    const half = hours - whole === 0.5;

    if (Number.isInteger(hours)) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    return half ? `${whole === 0 ? '' : whole}½ hours` : `${hours} hours`;
}
