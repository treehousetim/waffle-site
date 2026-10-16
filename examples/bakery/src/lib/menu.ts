/**
 * Today's bakes, as the waffle app describes them at GET /api/site/menu
 * (docs/waffle-api.md). The bakers update the board in the app each
 * morning; the site shows it as of the last build, dated, so nobody mistakes
 * Friday's board for Saturday's.
 *
 * Every field is checked before a page renders it. Anything unexpected (a
 * missing price, an unknown category, a dietary flag the site cannot
 * explain, a field it has never heard of) fails the build with the endpoint
 * and the field named, rather than shipping a menu with a blank where a
 * price should be, or a nut warning it does not show.
 *
 * Failure list (each refused with its field named):
 *  1. data is not an object, or carries fields the site does not know
 *  2. date is missing or not a real YYYY-MM-DD day
 *  3. items is missing, not a list, or empty
 *  4. an item is not an object, or has an unknown field
 *  5. id is not a slug, or two items share one
 *  6. name or description is empty or not text
 *  7. category is not one of the site's categories (it would have no page)
 *  8. price_cents is not a whole number of cents, 0 or more
 *  9. currency is not a three-letter code
 * 10. dietary is not a list, holds an unknown flag, or repeats one
 * 11. sold_out is not true or false
 */
import { WaffleApiError } from '@core/lib/waffle-api.js';

const ENDPOINT = '/api/site/menu';

/** The counter's sections, in the order they are shown; each has a page at /menu/<slug>/. */
export const CATEGORIES = ['breads', 'pastries', 'cakes', 'coffee'] as const;
export type Category = (typeof CATEGORIES)[number];

/** What a bake can be flagged as, and how each flag is shown. */
export const DIETARY = {
    'vegan': { short: 'VG', label: 'Vegan', diet: 'https://schema.org/VeganDiet' },
    'vegetarian': { short: 'V', label: 'Vegetarian', diet: 'https://schema.org/VegetarianDiet' },
    'gluten-free': { short: 'GF', label: 'Made without gluten', diet: 'https://schema.org/GlutenFreeDiet' },
    'contains-nuts': { short: 'N', label: 'Contains nuts', diet: null },
} as const;
export type Dietary = keyof typeof DIETARY;

export interface MenuItem {
    id: string;
    name: string;
    category: Category;
    description: string;
    priceCents: number;
    currency: string;
    dietary: Dietary[];
    soldOut: boolean;
}

export interface Menu {
    /** YYYY-MM-DD: the day this board is for. */
    date: string;
    items: MenuItem[];
}

const MENU_FIELDS = ['date', 'items'];
const ITEM_FIELDS = ['id', 'name', 'category', 'description', 'price_cents', 'currency', 'dietary', 'sold_out'];

function fail(field: string, expected: string): never {
    throw new WaffleApiError(`${ENDPOINT}: ${field}: ${expected}`);
}

function record(value: unknown, field: string, known: readonly string[]): Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        fail(field, 'expected an object.');
    }

    const object = value as Record<string, unknown>;
    const unknown = Object.keys(object).filter((key) => !known.includes(key));

    if (unknown.length > 0) {
        fail(field, `unexpected field ${unknown.map((key) => `'${key}'`).join(', ')}.`);
    }

    return object;
}

function text(object: Record<string, unknown>, key: string, where: string, max = 200): string {
    const value = object[key];

    if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
        fail(`${where}.${key}`, `expected text of 1-${max} characters.`);
    }

    return value.trim();
}

function parseItem(raw: unknown, where: string): MenuItem {
    const item = record(raw, where, ITEM_FIELDS);
    const id = text(item, 'id', where, 60);

    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
        fail(`${where}.id`, `expected lowercase letters, digits and -; got '${id}'.`);
    }

    const category = text(item, 'category', where, 30);

    if (!(CATEGORIES as readonly string[]).includes(category)) {
        fail(`${where}.category`, `expected one of ${CATEGORIES.join(', ')}; got '${category}'.`);
    }

    const priceCents = item.price_cents;

    if (typeof priceCents !== 'number' || !Number.isInteger(priceCents) || priceCents < 0) {
        fail(`${where}.price_cents`, 'expected a whole number of cents, 0 or more.');
    }

    const currency = text(item, 'currency', where, 3);

    if (!/^[A-Z]{3}$/.test(currency)) {
        fail(`${where}.currency`, `expected a three-letter code such as USD; got '${currency}'.`);
    }

    const dietary = item.dietary;

    if (!Array.isArray(dietary)) {
        fail(`${where}.dietary`, 'expected a list (empty when nothing applies).');
    }

    for (const [index, flag] of dietary.entries()) {
        if (typeof flag !== 'string' || !(flag in DIETARY)) {
            fail(`${where}.dietary[${index}]`, `expected one of ${Object.keys(DIETARY).join(', ')}; got '${String(flag)}'.`);
        }

        if (dietary.indexOf(flag) !== index) {
            fail(`${where}.dietary[${index}]`, `'${flag}' is listed twice.`);
        }
    }

    if (typeof item.sold_out !== 'boolean') {
        fail(`${where}.sold_out`, 'expected true or false.');
    }

    return {
        id,
        name: text(item, 'name', where, 80),
        category: category as Category,
        description: text(item, 'description', where, 200),
        priceCents,
        currency,
        dietary: dietary as Dietary[],
        soldOut: item.sold_out,
    };
}

/** Checks the app's answer and returns it in the site's own shape. */
export function parseMenu(data: unknown): Menu {
    const menu = record(data, 'data', MENU_FIELDS);
    const date = menu.date;

    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))
        || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
        fail('date', 'expected the day the menu is for, YYYY-MM-DD.');
    }

    if (!Array.isArray(menu.items) || menu.items.length === 0) {
        fail('items', 'expected a non-empty list.');
    }

    const items = menu.items.map((raw, index) => parseItem(raw, `items[${index}]`));
    const seen = new Set<string>();

    for (const [index, item] of items.entries()) {
        if (seen.has(item.id)) {
            fail(`items[${index}].id`, `two items have the id '${item.id}'.`);
        }

        seen.add(item.id);
    }

    return { date, items };
}

/** The items of one category, in the app's order. */
export const inCategory = (menu: Menu, category: Category) => menu.items.filter((item) => item.category === category);

/** "$4.25" */
export const formatPrice = (cents: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);

/** "Friday, October 16" for the board's date. */
export const menuDay = (date: string, options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });

/**
 * The board as schema.org data: a Menu with a MenuSection per category and
 * a MenuItem per bake, its price as an Offer (out of stock when sold out),
 * and the diets it suits. Linked to the business by its @id.
 */
export function menuJsonLd(menu: Menu, sections: readonly { slug: Category; name: string; url: string }[], url: string, siteUrl: string) {
    return {
        '@type': 'Menu',
        '@id': `${url}#menu`,
        name: `Today’s bakes, ${menuDay(menu.date)}`,
        url,
        inLanguage: 'en',
        provider: { '@id': `${siteUrl}/#organization` },
        hasMenuSection: sections
            .map((section) => ({ section, items: inCategory(menu, section.slug) }))
            .filter(({ items }) => items.length > 0)
            .map(({ section, items }) => ({
                '@type': 'MenuSection',
                name: section.name,
                url: section.url,
                hasMenuItem: items.map((item) => {
                    const diets = item.dietary.map((flag) => DIETARY[flag].diet).filter((diet) => diet !== null);

                    return {
                        '@type': 'MenuItem',
                        name: item.name,
                        description: item.description,
                        offers: {
                            '@type': 'Offer',
                            price: (item.priceCents / 100).toFixed(2),
                            priceCurrency: item.currency,
                            availability: item.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
                            validFrom: menu.date,
                        },
                        ...(diets.length > 0 ? { suitableForDiet: diets } : {}),
                    };
                }),
            })),
    };
}
