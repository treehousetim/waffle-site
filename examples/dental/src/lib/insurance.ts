/**
 * The insurance plans the practice accepts and the ways to pay, as the
 * waffle app describes them at GET /api/site/insurance (docs/waffle-api.md).
 * The front desk keeps the list in the app; the site shows it as of the last
 * build.
 *
 * Every field is checked here before a page renders it. Anything unexpected
 * (a missing field, an unknown network status, a price without what it is
 * per, a field nobody asked for) fails the build with the endpoint and the
 * field named, rather than shipping a plan list with a blank in it. Nothing
 * here becomes a link, so no URL is ever taken from the app.
 *
 * Failure list (each refused with the field named):
 *  1. data is not an object, or carries a key not listed below.
 *  2. updated is not a real YYYY-MM-DD date.
 *  3. plans or payments is not a non-empty list.
 *  4. an item is not an object, or has a key not listed below.
 *  5. an id is not lowercase-and-dashes, or two items share one.
 *  6. a name or note is not a non-empty string, or is absurdly long.
 *  7. a plan's type or network is not one of the known values.
 *  8. a payment's from_cents is not a whole, non-negative number, or comes
 *     without `per` (or `per` without it), or `per` is unknown.
 */

const WHERE = '/api/site/insurance';

export const PLAN_TYPES = ['PPO', 'HMO', 'Indemnity', 'Public', 'Medicare Advantage'] as const;
export const NETWORKS = ['in-network', 'out-of-network'] as const;
export const PERIODS = ['month', 'year'] as const;

export interface Plan {
    id: string;
    name: string;
    type: (typeof PLAN_TYPES)[number];
    network: (typeof NETWORKS)[number];
    note: string;
}

export interface PaymentOption {
    id: string;
    name: string;
    note: string;
    /** A starting price, when the option has one. */
    price: { cents: number; per: (typeof PERIODS)[number] } | null;
}

export interface InsuranceGuide {
    /** YYYY-MM-DD: when the front desk last changed it. */
    updated: string;
    plans: Plan[];
    payments: PaymentOption[];
}

type Raw = Record<string, unknown>;

function fail(path: string, expected: string): never {
    throw new Error(`${WHERE}: ${path}: expected ${expected}.`);
}

function object(value: unknown, path: string, keys: readonly string[]): Raw {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        fail(path, 'an object');
    }

    const raw = value as Raw;
    const unknown = Object.keys(raw).filter((key) => !keys.includes(key));

    if (unknown.length > 0) {
        fail(`${path}.${unknown[0]}`, `no such field (allowed: ${keys.join(', ')})`);
    }

    return raw;
}

function text(raw: Raw, field: string, path: string, max: number): string {
    const value = raw[field];

    if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
        fail(`${path}.${field}`, `a non-empty string of at most ${max} characters`);
    }

    return value.trim();
}

function oneOf<T extends string>(raw: Raw, field: string, path: string, allowed: readonly T[]): T {
    const value = raw[field];

    if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
        fail(`${path}.${field}`, `one of ${allowed.join(', ')}`);
    }

    return value as T;
}

function id(raw: Raw, path: string, seen: Set<string>): string {
    const value = raw.id;

    if (typeof value !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
        fail(`${path}.id`, 'lowercase letters, digits and dashes');
    }

    if (seen.has(value)) {
        fail(`${path}.id`, `a unique id ('${value}' is used twice)`);
    }

    seen.add(value);

    return value;
}

function list(value: unknown, path: string): unknown[] {
    if (!Array.isArray(value) || value.length === 0) {
        fail(path, 'a non-empty list');
    }

    return value;
}

function plan(value: unknown, path: string, seen: Set<string>): Plan {
    const raw = object(value, path, ['id', 'name', 'type', 'network', 'note']);

    return {
        id: id(raw, path, seen),
        name: text(raw, 'name', path, 80),
        type: oneOf(raw, 'type', path, PLAN_TYPES),
        network: oneOf(raw, 'network', path, NETWORKS),
        note: text(raw, 'note', path, 240),
    };
}

function payment(value: unknown, path: string, seen: Set<string>): PaymentOption {
    const raw = object(value, path, ['id', 'name', 'note', 'from_cents', 'per']);
    const result = { id: id(raw, path, seen), name: text(raw, 'name', path, 80), note: text(raw, 'note', path, 240) };
    const hasCents = 'from_cents' in raw;
    const hasPer = 'per' in raw;

    if (hasCents !== hasPer) {
        fail(`${path}.${hasCents ? 'per' : 'from_cents'}`, 'from_cents and per together, or neither');
    }

    if (!hasCents) {
        return { ...result, price: null };
    }

    const cents = raw.from_cents;

    if (typeof cents !== 'number' || !Number.isInteger(cents) || cents < 0 || cents > 10_000_000) {
        fail(`${path}.from_cents`, 'a whole number of cents, 0 or more');
    }

    return { ...result, price: { cents, per: oneOf(raw, 'per', path, PERIODS) } };
}

export function parseInsurance(data: unknown): InsuranceGuide {
    const raw = object(data, 'data', ['updated', 'plans', 'payments']);
    const updated = raw.updated;

    if (typeof updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(updated) || Number.isNaN(Date.parse(updated))) {
        fail('data.updated', 'a date, YYYY-MM-DD');
    }

    const planIds = new Set<string>();
    const paymentIds = new Set<string>();

    return {
        updated,
        plans: list(raw.plans, 'data.plans').map((item, index) => plan(item, `data.plans[${index}]`, planIds)),
        payments: list(raw.payments, 'data.payments').map((item, index) => payment(item, `data.payments[${index}]`, paymentIds)),
    };
}

/** "$329" or "$50": whole dollars, as the practice writes prices. */
export function dollars(cents: number): string {
    const value = cents / 100;

    return `$${value.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })}`;
}
