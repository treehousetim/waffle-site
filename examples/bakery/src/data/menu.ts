/**
 * The counter's four sections, each with its own page at /menu/<slug>/
 * (src/pages/menu/<slug>.astro, built on layouts/CategoryPage.astro). What
 * is on the counter today comes from the waffle app (src/lib/menu.ts); this
 * is what stays the same: what the section is, its photo, and the regular
 * bakes and the days they come out of the oven.
 *
 * The slugs are the waffle app's category names: an item in the app's menu
 * whose category is not one of these fails the build (src/lib/menu.ts).
 */
import type { PhotoName } from './photos';
import type { Category } from '../lib/menu';

export interface Regular {
    name: string;
    /** When it is baked: "Every day", "Fridays". */
    when: string;
    note: string;
}

export interface MenuSection {
    slug: Category;
    name: string;
    /** The short line on the card. */
    summary: string;
    photo: PhotoName;
    /** A second photo, pinned beside today's slip. */
    sidePhoto: PhotoName;
    doodle: 'loaf' | 'croissant' | 'slice' | 'cup';
    regulars: Regular[];
}

export const sections: MenuSection[] = [
    {
        slug: 'breads',
        name: 'Bread',
        summary: 'Naturally leavened loaves, fermented for thirty hours and baked dark.',
        photo: 'baguettes',
        sidePhoto: 'sourdoughCrumb',
        doodle: 'loaf',
        regulars: [
            { name: 'Country sourdough', when: 'Every day', note: 'The loaf the bakery is built on. Most of it is gone by eleven on a Saturday.' },
            { name: 'Baguette', when: 'Every day, twice', note: 'A morning bake and a 1pm bake, so there is a fresh one for supper.' },
            { name: 'Seeded rye', when: 'Tuesday to Saturday', note: 'Forty percent rye, packed with seeds; keeps a week wrapped in a cloth.' },
            { name: 'Spelt & honey tin', when: 'Wednesday and Saturday', note: 'Soft enough for a lunchbox, with honey from the hives above Millrace.' },
            { name: 'Olive & rosemary fougasse', when: 'Friday to Sunday', note: 'For the table: tear it, do not slice it.' },
            { name: 'Walnut & raisin levain', when: 'Fridays', note: 'Rum-soaked raisins and toasted walnuts. Contains nuts.' },
            { name: 'Porridge loaf', when: 'Saturdays', note: 'Cooked oats folded into the dough: the most custardy crumb we make.' },
        ],
    },
    {
        slug: 'pastries',
        name: 'Pastries',
        summary: 'Laminated by hand over three days, with cultured butter and patience.',
        photo: 'croissants',
        sidePhoto: 'cinnamonBuns',
        doodle: 'croissant',
        regulars: [
            { name: 'Butter croissant', when: 'Every day', note: 'Three days from mixing to the oven. Twenty-seven layers.' },
            { name: 'Pain au chocolat', when: 'Every day', note: 'Two batons of dark chocolate, never one.' },
            { name: 'Almond croissant', when: 'Every day', note: 'Yesterday’s croissants, twice-baked. Nothing wasted. Contains nuts.' },
            { name: 'Cardamom knot', when: 'Thursday to Sunday', note: 'Twisted by hand, cardamom ground the same morning.' },
            { name: 'Seasonal danish', when: 'Every day', note: 'Changes with the farm stand: rhubarb in May, squash and sage now.' },
            { name: 'Morning bun', when: 'Every day', note: 'The savory one: ham, aged cheddar, a swipe of mustard.' },
            { name: 'Kouign-amann', when: 'Saturdays', note: 'Caramelized, salty, sticky. Ask for a napkin.' },
        ],
    },
    {
        slug: 'cakes',
        name: 'Cakes by the slice',
        summary: 'Loaf cakes and tray bakes on the counter, cut thick, and whole cakes to order.',
        photo: 'cakeSlice',
        sidePhoto: 'scone',
        doodle: 'slice',
        regulars: [
            { name: 'Lemon drizzle', when: 'Every day', note: 'Sharp, sticky, sugar-crusted. Never changes; nobody would let it.' },
            { name: 'Brown butter banana loaf', when: 'Every day', note: 'With toasted pecans. Contains nuts.' },
            { name: 'Chocolate olive oil cake', when: 'Every day', note: 'Vegan by happy accident, and the darkest thing on the counter.' },
            { name: 'Seasonal fruit cake', when: 'Every day', note: 'Apple and cider now; plum in September; strawberry in June.' },
            { name: 'Carrot cake', when: 'Weekends', note: 'Brown sugar cream cheese frosting, no raisins, no apologies.' },
        ],
    },
    {
        slug: 'coffee',
        name: 'Coffee & the kettle',
        summary: 'Espresso, a filter that changes weekly, stove-top chai and proper hot chocolate.',
        photo: 'latteArt',
        sidePhoto: 'pourOver',
        doodle: 'cup',
        regulars: [
            { name: 'Espresso, flat white, latte', when: 'Every day', note: 'A seasonal espresso blend from a small roaster two valleys over.' },
            { name: 'Filter of the week', when: 'Every day', note: 'Brewed by the batch, changed every Tuesday.' },
            { name: 'Kettle chai', when: 'Every day', note: 'Simmered on the stove from whole spices; the café’s namesake.' },
            { name: 'Hot chocolate', when: 'Every day', note: 'Shaved dark chocolate melted into milk. Oat milk on request.' },
            { name: 'Loose-leaf tea', when: 'Every day', note: 'A pot for one or two: breakfast, green, mint from the yard.' },
        ],
    },
];

export const sectionUrl = (slug: string) => `/menu/${slug}/`;

export const sectionFor = (slug: Category) => {
    const section = sections.find((item) => item.slug === slug);

    if (section === undefined) {
        throw new Error(`No menu section '${slug}' in src/data/menu.ts.`);
    }

    return section;
};
