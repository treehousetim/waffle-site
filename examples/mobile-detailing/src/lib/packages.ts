/**
 * The detailing packages, as the waffle app describes them at
 * GET /api/site/packages (PLAYBOOK.md, "Packages and booking"). The office
 * keeps prices and durations in the app; the site shows them as of the last
 * build.
 *
 * Everything is checked here before a page renders it. Anything unexpected
 * fails the build with the endpoint and the field named, rather than
 * shipping a price list with a blank price or a link built from junk. A
 * package's slug becomes a URL, so it must be a plain lowercase slug.
 *
 * The shape:
 *
 *     {
 *       "updated": "YYYY-MM-DD",
 *       "currency": "USD",
 *       "sizes": [{ "id": "coupe-sedan", "label": "Coupe / sedan" }, ...],
 *       "packages": [{
 *         "slug": "express-wash", "name": "...", "summary": "...",
 *         "prices_cents":     { "<size id>": 6500, ... },   every size, whole cents
 *         "duration_minutes": { "<size id>": 45, ... },     every size, whole minutes
 *         "included": ["...", ...]
 *       }, ...]
 *     }
 */

const ENDPOINT = '/api/site/packages';

export interface VehicleSize {
    id: string;
    label: string;
}

export interface DetailPackage {
    slug: string;
    name: string;
    summary: string;
    /** By size id, in cents. */
    pricesCents: Record<string, number>;
    /** By size id, in minutes. */
    durationMinutes: Record<string, number>;
    included: string[];
}

export interface PackageList {
    updated: string;
    currency: string;
    sizes: VehicleSize[];
    packages: DetailPackage[];
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(field: string, expected: string): never {
    throw new Error(`${ENDPOINT}: ${field}: expected ${expected}.`);
}

function record(value: unknown, field: string, keys: readonly string[]): Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        fail(field, 'an object');
    }

    const object = value as Record<string, unknown>;
    const unknown = Object.keys(object).filter((key) => !keys.includes(key));

    if (unknown.length > 0) {
        fail(field, `only the fields ${keys.join(', ')}; got '${unknown[0]}'`);
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
    if (typeof value !== 'string' || !SLUG.test(value) || value.length > 60) {
        fail(field, 'a lowercase slug such as "full-detail"');
    }

    return value;
}

/** A whole number for every size, and nothing else. */
function bySize(value: unknown, field: string, sizes: readonly VehicleSize[], min: number, max: number): Record<string, number> {
    const object = record(value, field, sizes.map((size) => size.id));
    const out: Record<string, number> = {};

    for (const size of sizes) {
        const amount = object[size.id];

        if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < min || amount > max) {
            fail(`${field}.${size.id}`, `a whole number from ${min} to ${max}`);
        }

        out[size.id] = amount;
    }

    return out;
}

export function parsePackages(data: unknown): PackageList {
    const root = record(data, 'data', ['updated', 'currency', 'sizes', 'packages']);

    const updated = root.updated;
    if (typeof updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(updated) || Number.isNaN(Date.parse(updated))) {
        fail('updated', 'a date, YYYY-MM-DD');
    }

    const currency = root.currency;
    if (currency !== 'USD') {
        fail('currency', '"USD", the only currency the site formats');
    }

    if (!Array.isArray(root.sizes) || root.sizes.length === 0 || root.sizes.length > 6) {
        fail('sizes', 'a list of 1-6 vehicle sizes');
    }

    const sizes = root.sizes.map((raw, index) => {
        const size = record(raw, `sizes[${index}]`, ['id', 'label']);

        return { id: slug(size.id, `sizes[${index}].id`), label: text(size.label, `sizes[${index}].label`, 40) };
    });

    if (new Set(sizes.map((size) => size.id)).size !== sizes.length) {
        fail('sizes', 'each size id once');
    }

    if (!Array.isArray(root.packages) || root.packages.length === 0 || root.packages.length > 20) {
        fail('packages', 'a list of 1-20 packages');
    }

    const packages = root.packages.map((raw, index): DetailPackage => {
        const where = `packages[${index}]`;
        const item = record(raw, where, ['slug', 'name', 'summary', 'prices_cents', 'duration_minutes', 'included']);

        if (!Array.isArray(item.included) || item.included.length === 0 || item.included.length > 16) {
            fail(`${where}.included`, 'a list of 1-16 items');
        }

        return {
            slug: slug(item.slug, `${where}.slug`),
            name: text(item.name, `${where}.name`, 40),
            summary: text(item.summary, `${where}.summary`, 220),
            pricesCents: bySize(item.prices_cents, `${where}.prices_cents`, sizes, 0, 10_000_000),
            durationMinutes: bySize(item.duration_minutes, `${where}.duration_minutes`, sizes, 5, 3_000),
            included: item.included.map((line, at) => text(line, `${where}.included[${at}]`, 160)),
        };
    });

    if (new Set(packages.map((item) => item.slug)).size !== packages.length) {
        fail('packages', 'each slug once');
    }

    return { updated, currency, sizes, packages };
}

/** "$65", "$1,150": whole dollars, which is how every package is priced. */
export function formatPrice(cents: number): string {
    const dollars = cents / 100;

    return dollars.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
        minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    });
}

/** "45 min", "4 h", "4.5 h", "2 days" for a two-visit job. */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = minutes / 60;

    if (hours > 10) {
        return `${Math.round((hours / 8) * 2) / 2} days`;
    }

    return `${Number.isInteger(hours) ? hours : Math.round(hours * 2) / 2} h`;
}

/** "October 1, 2026". */
export function formatUpdated(updated: string): string {
    return new Date(updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
