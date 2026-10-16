/**
 * The studio's calendar, as the waffle app describes it at
 * GET /api/site/availability: for each of the coming months, whether it is
 * booked, has a few dates left, or is open, and how many dates are free.
 * Shown as the calendar strip on /enquire/, as of the last build.
 *
 * Failure list (each is a case in checks.js, "refuses availability..."):
 *   1. The answer is not an object, or has fields the site does not know.
 *   2. `updated` is not a YYYY-MM-DD date.
 *   3. `months` is missing, empty, or longer than two years.
 *   4. A month is not YYYY-MM, or the months are out of order or repeat.
 *   5. `status` is not booked, limited or open.
 *   6. `open_dates` is not a whole number from 0 to 31.
 *   7. The status and the count disagree: booked with dates free, or open
 *      or limited with none, which would tell a couple the wrong thing.
 *
 * Kept free of imports so checks.js can run it directly.
 */

export const STATUSES = ['booked', 'limited', 'open'] as const;

export type Status = (typeof STATUSES)[number];

export interface Month {
    /** YYYY-MM */
    month: string;
    status: Status;
    openDates: number;
}

export interface Availability {
    updated: string;
    months: Month[];
}

const ENDPOINT = '/api/site/availability';

function fail(field: string, expected: string): never {
    throw new Error(`${ENDPOINT} ${field}: expected ${expected}.`);
}

function known(value: unknown, field: string, keys: readonly string[]): Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        fail(field, 'an object');
    }

    const object = value as Record<string, unknown>;
    const extra = Object.keys(object).find((key) => !keys.includes(key));

    if (extra !== undefined) {
        fail(`${field}.${extra}`, `no such field (known: ${keys.join(', ')})`);
    }

    return object;
}

function parseMonth(value: unknown, field: string): Month {
    const raw = known(value, field, ['month', 'status', 'open_dates']);

    if (typeof raw.month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw.month)) {
        fail(`${field}.month`, 'a month, YYYY-MM');
    }

    if (typeof raw.status !== 'string' || !(STATUSES as readonly string[]).includes(raw.status)) {
        fail(`${field}.status`, `one of ${STATUSES.join(', ')}`);
    }

    const openDates = raw.open_dates;

    if (typeof openDates !== 'number' || !Number.isInteger(openDates) || openDates < 0 || openDates > 31) {
        fail(`${field}.open_dates`, 'a whole number from 0 to 31');
    }

    const status = raw.status as Status;

    if ((status === 'booked') !== (openDates === 0)) {
        fail(`${field}.open_dates`, status === 'booked' ? '0 for a booked month' : 'at least 1 for a month that is not booked');
    }

    return { month: raw.month, status, openDates };
}

/** Checks the app's answer and returns it in the site's own shape, or throws naming the field. */
export function parseAvailability(data: unknown): Availability {
    const raw = known(data, 'data', ['updated', 'months']);

    if (typeof raw.updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.updated) || Number.isNaN(Date.parse(raw.updated))) {
        fail('updated', 'a date, YYYY-MM-DD');
    }

    if (!Array.isArray(raw.months) || raw.months.length === 0 || raw.months.length > 24) {
        fail('months', 'a list of 1-24 months');
    }

    const months = raw.months.map((item: unknown, index: number) => parseMonth(item, `months[${index}]`));

    months.forEach((month, index) => {
        const previous = months[index - 1];

        if (previous !== undefined && month.month <= previous.month) {
            fail(`months[${index}].month`, `a month after ${previous.month}, in order and without repeats`);
        }
    });

    return { updated: raw.updated, months };
}

/** "Nov", "2026" for a YYYY-MM month: the strip prints them on two lines. */
export function monthParts(month: string): { short: string; long: string; year: string } {
    const date = new Date(`${month}-15T12:00:00Z`);

    return {
        short: date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
        long: date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }),
        year: month.slice(0, 4),
    };
}
