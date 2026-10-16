/**
 * Small, strict field checks shared by this site's waffle parsers
 * (taplist.ts, events.ts). Each throws a WaffleApiError naming the endpoint
 * and the field, so a wrong answer from the app fails the build with
 * something a person can act on, instead of shipping a page with a blank in
 * it (docs/waffle-api.md, AGENTS.md §5).
 */
import { WaffleApiError } from '@core/lib/waffle-api.js';

export type Fields = Record<string, unknown>;

/** An object with exactly these keys (optional ones may be missing), and no others. */
export function object(value: unknown, where: string, required: readonly string[], optional: readonly string[] = []): Fields {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new WaffleApiError(`${where}: expected an object.`);
    }

    const fields = value as Fields;
    const known = new Set([...required, ...optional]);

    for (const key of required) {
        if (!(key in fields)) {
            throw new WaffleApiError(`${where}.${key}: missing.`);
        }
    }

    for (const key of Object.keys(fields)) {
        if (!known.has(key)) {
            throw new WaffleApiError(`${where}.${key}: not a field this site knows; expected only ${[...known].join(', ')}.`);
        }
    }

    return fields;
}

export function list(value: unknown, where: string, { min = 0, max = 200 } = {}): unknown[] {
    if (!Array.isArray(value)) {
        throw new WaffleApiError(`${where}: expected a list.`);
    }

    if (value.length < min || value.length > max) {
        throw new WaffleApiError(`${where}: expected ${min} to ${max} items; got ${value.length}.`);
    }

    return value;
}

export function text(value: unknown, where: string, max = 200): string {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new WaffleApiError(`${where}: expected text.`);
    }

    if (value.length > max) {
        throw new WaffleApiError(`${where}: longer than ${max} characters.`);
    }

    // Markup has no business in plain data; Astro escapes it anyway, but a
    // tag here means the app sent something it should not have.
    if (/[<>]/.test(value)) {
        throw new WaffleApiError(`${where}: contains < or >; expected plain text.`);
    }

    return value.trim();
}

export function number(value: unknown, where: string, { min, max, integer = false }: { min: number; max: number; integer?: boolean }): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || (integer && !Number.isInteger(value))) {
        throw new WaffleApiError(`${where}: expected ${integer ? 'a whole number' : 'a number'}.`);
    }

    if (value < min || value > max) {
        throw new WaffleApiError(`${where}: expected ${min} to ${max}; got ${value}.`);
    }

    return value;
}

export function boolean(value: unknown, where: string): boolean {
    if (typeof value !== 'boolean') {
        throw new WaffleApiError(`${where}: expected true or false.`);
    }

    return value;
}

/** A slug, never a URL: pages build links from it, so the app cannot send one that goes elsewhere. */
export function slug(value: unknown, where: string): string {
    if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]{0,60}$/.test(value)) {
        throw new WaffleApiError(`${where}: expected a slug (lowercase letters, digits and -).`);
    }

    return value;
}

/** YYYY-MM-DD that is a real date. */
export function date(value: unknown, where: string): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new WaffleApiError(`${where}: expected a date, YYYY-MM-DD.`);
    }

    const parsed = new Date(`${value}T00:00:00Z`);

    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
        throw new WaffleApiError(`${where}: '${value}' is not a real date.`);
    }

    return value;
}

/** HH:MM, 24-hour. */
export function time(value: unknown, where: string): string {
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
        throw new WaffleApiError(`${where}: expected a time, HH:MM (24-hour).`);
    }

    return value;
}

/** An ISO 8601 date and time with a zone, e.g. 2026-10-15T16:42:00-04:00. */
export function timestamp(value: unknown, where: string): Date {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/.test(value) || Number.isNaN(Date.parse(value))) {
        throw new WaffleApiError(`${where}: expected a date and time with its zone, e.g. 2026-10-15T16:42:00-04:00.`);
    }

    return new Date(value);
}

export function oneOf<T extends string>(value: unknown, where: string, allowed: readonly T[]): T {
    if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
        throw new WaffleApiError(`${where}: expected one of ${allowed.join(', ')}; got '${String(value)}'.`);
    }

    return value as T;
}

export function unique<T>(items: readonly T[], key: (item: T) => string | number, where: string, what: string): void {
    const seen = new Set<string | number>();

    for (const item of items) {
        const value = key(item);

        if (seen.has(value)) {
            throw new WaffleApiError(`${where}: two ${what} are ${value}.`);
        }

        seen.add(value);
    }
}
