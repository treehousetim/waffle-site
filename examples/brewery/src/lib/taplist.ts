/**
 * What is pouring now, as the waffle app describes it at /api/site/taplist.
 * The bar keeps the tap list in the app; the site shows it as of the last
 * build (the header ticker, /on-tap/, the home page's board, each beer's
 * page). Everything is checked here before a page renders it.
 *
 * Ways the answer can be wrong, each refused with the field named:
 *   1. Not an object with `updated` and `taps`, or with fields we do not know.
 *   2. `updated` is not a date and time with a zone.
 *   3. No taps, or an absurd number of them.
 *   4. A tap number that is not a whole number from 1 to 60, or used twice.
 *   5. A name or style that is empty, too long, or carries markup.
 *   6. An ABV outside 0-20%, or an IBU outside 0-150 (null is allowed: some
 *      beers, a sour or a cider, are not measured).
 *   7. No pours, a pour without a size, ounces outside 1-64, or a price that
 *      is not a whole number of cents from 0 to $100.
 *   8. `new` or `limited` that is not true or false.
 *   9. A `beer` that is not a slug: it becomes a link, so a URL is refused.
 */
import { boolean, list, number, object, oneOf, slug, text, timestamp, unique } from './check';

const WHERE = '/api/site/taplist';

export interface Pour {
    /** "Taster", "Half", "Pint", "Crowler": what the bar calls it. */
    size: string;
    ounces: number;
    priceCents: number;
}

export interface Tap {
    tap: number;
    name: string;
    style: string;
    abv: number;
    ibu: number | null;
    /** The core beer's slug when this tap pours one (src/data/beers.ts). */
    beer: string | null;
    isNew: boolean;
    limited: boolean;
    /** How it is served: most on CO2, the stout on nitro, a cask on Fridays. */
    dispense: 'draft' | 'nitro' | 'cask';
    pours: Pour[];
}

export interface Taplist {
    updated: Date;
    taps: Tap[];
}

export const DISPENSE = ['draft', 'nitro', 'cask'] as const;

export function parseTaplist(data: unknown): Taplist {
    const root = object(data, WHERE, ['updated', 'taps']);
    const updated = timestamp(root.updated, `${WHERE}.updated`);
    const taps = list(root.taps, `${WHERE}.taps`, { min: 1, max: 60 }).map((raw, index) => parseTap(raw, `${WHERE}.taps[${index}]`));

    unique(taps, (tap) => tap.tap, WHERE, 'taps numbered');

    return { updated, taps: [...taps].sort((a, b) => a.tap - b.tap) };
}

function parseTap(raw: unknown, where: string): Tap {
    const tap = object(raw, where, ['tap', 'name', 'style', 'abv', 'ibu', 'new', 'limited', 'dispense', 'pours'], ['beer']);

    return {
        tap: number(tap.tap, `${where}.tap`, { min: 1, max: 60, integer: true }),
        name: text(tap.name, `${where}.name`, 60),
        style: text(tap.style, `${where}.style`, 60),
        abv: number(tap.abv, `${where}.abv`, { min: 0, max: 20 }),
        ibu: tap.ibu === null ? null : number(tap.ibu, `${where}.ibu`, { min: 0, max: 150, integer: true }),
        beer: tap.beer === undefined || tap.beer === null ? null : slug(tap.beer, `${where}.beer`),
        isNew: boolean(tap.new, `${where}.new`),
        limited: boolean(tap.limited, `${where}.limited`),
        dispense: oneOf(tap.dispense, `${where}.dispense`, DISPENSE),
        pours: list(tap.pours, `${where}.pours`, { min: 1, max: 6 }).map((pour, index) => parsePour(pour, `${where}.pours[${index}]`)),
    };
}

function parsePour(raw: unknown, where: string): Pour {
    const pour = object(raw, where, ['size', 'ounces', 'price_cents']);

    return {
        size: text(pour.size, `${where}.size`, 20),
        ounces: number(pour.ounces, `${where}.ounces`, { min: 1, max: 64 }),
        priceCents: number(pour.price_cents, `${where}.price_cents`, { min: 0, max: 10_000, integer: true }),
    };
}

/** "$7", "$7.50": how a price is written on the board. */
export const dollars = (cents: number) => (cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`);

/** The pint, or the biggest glass pour, for one-line summaries. */
export const mainPour = (tap: Tap) => tap.pours.find((pour) => /pint/i.test(pour.size)) ?? tap.pours[tap.pours.length - 1];
