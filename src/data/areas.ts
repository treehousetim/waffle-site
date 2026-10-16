/**
 * The towns the business serves. Each has its own page,
 * src/pages/areas/<slug>.astro, written by hand: a page per town is only
 * worth having when it says something true and specific about working there
 * (docs/pages.md, "Town pages"). Search engines treat near-identical town
 * pages as doorway pages and rank none of them.
 */
export interface Area {
    slug: string;
    name: string;
    /** Driving time from the shop, for the list. */
    drive: string;
}

export const areas: Area[] = [
    { slug: 'springfield', name: 'Springfield', drive: 'Our home base' },
    { slug: 'riverside', name: 'Riverside', drive: 'About 15 minutes' },
    { slug: 'fairview', name: 'Fairview', drive: 'About 20 minutes' },
    { slug: 'oakdale', name: 'Oakdale', drive: 'About 25 minutes' },
    { slug: 'millbrook', name: 'Millbrook', drive: 'About 30 minutes' },
    { slug: 'lakewood', name: 'Lakewood', drive: 'About 35 minutes' },
];

export const areaNames = areas.map((area) => area.name);
export const areaUrl = (slug: string) => `/areas/${slug}/`;
