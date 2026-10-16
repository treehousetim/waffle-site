/**
 * The bakery and the site as a whole: name, contact details, hours, the
 * towns its wholesale van reaches, navigation, and the pages kept out of
 * search results. Every page reads it through Base.astro; nothing here is
 * per page.
 *
 * Name, address and phone must read the same everywhere (on this site, the
 * Google Business Profile, directories): search engines match them to decide
 * that all of those are one business. Change them here and every page follows.
 *
 * The audit fails the build if a navigation link points at a page that does
 * not exist (docs/seo.md, 10).
 */

export interface NavLink {
    label: string;
    href: string;
}

export interface OpeningHours {
    /** schema.org day names. */
    days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[];
    opens: string;
    closes: string;
}

export const site = {
    /** The name people read, after every page title: "Today's bakes — Crumb & Kettle". */
    name: 'Crumb & Kettle',

    /** One line about the business, used where a page has nothing better. */
    tagline: 'Sourdough bakery and café on Cooper’s Row',

    /** The site's own description, for the home page and the WebSite node. */
    description:
        'A neighborhood sourdough bakery and café in Larkhaven: long-fermented bread, laminated pastry, celebration cakes to order and good coffee, every morning.',

    lang: 'en',
    locale: 'en_US',

    /** The header's links, in order. Paths end in / (docs/pages.md). */
    nav: [
        { label: 'Today’s bakes', href: '/menu/' },
        { label: 'Cakes', href: '/cakes/' },
        { label: 'Wholesale', href: '/wholesale/' },
        { label: 'Visit', href: '/visit/' },
        { label: 'Our story', href: '/about/' },
        { label: 'Journal', href: '/journal/' },
    ] satisfies NavLink[],

    /** The header's button. */
    cta: { label: 'Order a cake', href: '/cakes/order/' } satisfies NavLink,

    /** The footer's links, in columns. */
    footer: [
        {
            heading: 'The counter',
            links: [
                { label: 'Today’s bakes', href: '/menu/' },
                { label: 'Bread', href: '/menu/breads/' },
                { label: 'Pastries', href: '/menu/pastries/' },
                { label: 'Cakes by the slice', href: '/menu/cakes/' },
                { label: 'Coffee', href: '/menu/coffee/' },
            ],
        },
        {
            heading: 'Orders',
            links: [
                { label: 'Celebration cakes', href: '/cakes/' },
                { label: 'Order a cake', href: '/cakes/order/' },
                { label: 'Wholesale for cafés', href: '/wholesale/' },
                { label: 'Questions', href: '/faq/' },
            ],
        },
        {
            heading: 'The bakery',
            links: [
                { label: 'Our story', href: '/about/' },
                { label: 'The bakers', href: '/bakers/' },
                { label: 'Visit us', href: '/visit/' },
                { label: 'Journal', href: '/journal/' },
                { label: 'Contact', href: '/contact/' },
            ],
        },
    ] satisfies { heading: string; links: NavLink[] }[],

    /**
     * The business, for people and for search engines (JSON-LD Bakery, a
     * kind of FoodEstablishment and LocalBusiness). Example details: the
     * town is invented and 555-01xx numbers are reserved for fiction.
     * Replace every one before launch.
     */
    business: {
        /** schema.org type: Bakery, CafeOrCoffeeShop, Restaurant... */
        type: 'Bakery',
        name: 'Crumb & Kettle',
        legalName: 'Crumb & Kettle Bakery LLC',
        /** How it is written on the page; `phoneE164` is how it is dialled. */
        phone: '(802) 555-0137',
        phoneE164: '+18025550137',
        email: 'hello@example.com',
        address: {
            street: '14 Cooper’s Row',
            city: 'Larkhaven',
            region: 'VT',
            postalCode: '05999',
            country: 'US',
        },
        geo: { latitude: 44.0012, longitude: -72.6231 },
        hours: [
            { days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:00', closes: '15:00' },
            { days: ['Saturday'], opens: '07:30', closes: '15:00' },
            { days: ['Sunday'], opens: '08:00', closes: '13:00' },
        ] satisfies OpeningHours[],
        /** Said next to the hours. */
        closed: 'Closed Mondays: the ovens rest and so do we.',
        priceRange: '$',
        founded: 2014,
        /** A square raster image of at least 112px; search engines ignore SVG logos. */
        logo: '/logo.png',
        /** Profiles elsewhere: Google Business Profile, Instagram... */
        sameAs: [] as string[],
    },

    /** Towns the wholesale van delivers to, mornings, Tuesday to Saturday. */
    deliveryTowns: ['Larkhaven', 'Ashcombe', 'Millrace', 'Fallow Bridge', 'Upper Wending'],

    /** The link preview used by any page that does not choose its own (1200x630). */
    defaultImage: { src: '/og-default.png', alt: 'Crumb & Kettle: sourdough bakery and café in Larkhaven' },

    /** The blog's own name and description, for its index and its feed. */
    blog: {
        title: 'The journal',
        description: 'Recipes, baking notes and news from the Crumb & Kettle bakehouse: sourdough at home, laminated dough, seasonal bakes and the coffee we pour.',
        /** Who a post is by when it does not say. */
        defaultAuthor: 'The Crumb & Kettle bakers',
        /** Where it lives. */
        path: '/journal/',
    },

    /**
     * Pages kept out of search results and out of the sitemap. The audit
     * fails a page here that robots may index, and a page not here that
     * they may not (docs/seo.md, 6).
     */
    noindex: ['/404', '/cakes/order/thanks/', '/credits/'],
};

/** The business's address on one line, as it should appear everywhere. */
export const addressLine = (() => {
    const { street, city, region, postalCode } = site.business.address;

    return `${street}, ${city}, ${region} ${postalCode}`;
})();

/** "Tue–Fri", "Saturday": a run of days, short when it is a range. */
export const dayRange = (days: readonly string[]) =>
    days.length === 1 ? (days[0] ?? '') : `${(days[0] ?? '').slice(0, 3)}–${(days[days.length - 1] ?? '').slice(0, 3)}`;

/** "07:00" as "7am", "15:30" as "3:30pm". */
export const clock = (time: string) => {
    const [h = 0, m = 0] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 === 0 ? 12 : h % 12;

    return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`;
};
