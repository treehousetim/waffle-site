/**
 * The brewery and the site as a whole: name, contact details, hours, the age
 * policy, navigation, footer, and the pages kept out of search results.
 * Every page reads it through Base.astro; nothing here is per page.
 *
 * Name, address and phone must read the same everywhere (on this site, the
 * Google Business Profile, beer apps and directories): search engines match
 * them to decide all of those are one business. Change them here and every
 * page follows.
 *
 * Ironwood Brewing Co. and the town of Wrenford are invented. The 555-01xx
 * number is reserved for fiction. Replace every fact before launch.
 */

export interface NavLink {
    label: string;
    href: string;
}

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface OpeningHours {
    /** schema.org day names. */
    days: Day[];
    opens: string;
    closes: string;
}

export const site = {
    /** The name people read, after every page title: "Our beers — Ironwood Brewing Co.". */
    name: 'Ironwood Brewing Co.',

    /** One line about the business, used where a page has nothing better. */
    tagline: 'Small-batch beer, brewed and poured in an 1888 iron foundry on the Tamsen River',

    /** The site's own description, for the home page and the WebSite node. */
    description:
        'Small-batch brewery and taproom in the old Wrenford stove foundry: what is on tap now, our core beers, events, brewery tours and private hire.',

    lang: 'en',
    locale: 'en_US',

    /** The header's links, in order. Paths end in / (docs/pages.md). */
    nav: [
        { label: 'On tap', href: '/on-tap/' },
        { label: 'Our beers', href: '/beers/' },
        { label: 'Taproom', href: '/taproom/' },
        { label: 'Events', href: '/events/' },
        { label: 'Tours', href: '/tours/' },
        { label: 'Brewing notes', href: '/blog/' },
    ] satisfies NavLink[],

    /** The header's button. */
    cta: { label: 'Private hire', href: '/private-hire/' } satisfies NavLink,

    /** The footer's links, in columns. */
    footer: [
        {
            heading: 'Drink',
            links: [
                { label: 'On tap now', href: '/on-tap/' },
                { label: 'Our beers', href: '/beers/' },
                { label: 'The taproom', href: '/taproom/' },
                { label: 'Events', href: '/events/' },
            ],
        },
        {
            heading: 'Visit',
            links: [
                { label: 'Brewery tours', href: '/tours/' },
                { label: 'Private hire', href: '/private-hire/' },
                { label: 'Contact and directions', href: '/contact/' },
                { label: 'FAQ', href: '/faq/' },
            ],
        },
        {
            heading: 'The brewery',
            links: [
                { label: 'Our story', href: '/about/' },
                { label: 'Brewing notes', href: '/blog/' },
                { label: 'Privacy', href: '/privacy/' },
                { label: 'Photo credits', href: '/credits/' },
            ],
        },
    ] satisfies { heading: string; links: NavLink[] }[],

    /**
     * The business, for people and for search engines (JSON-LD Brewery, a
     * kind of FoodEstablishment and so of LocalBusiness).
     */
    business: {
        type: 'Brewery',
        name: 'Ironwood Brewing Co.',
        legalName: 'Ironwood Brewing Company LLC',
        /** How it is written on the page; `phoneE164` is how it is dialled. */
        phone: '(740) 555-0137',
        phoneE164: '+17405550137',
        email: 'taproom@example.com',
        address: {
            street: '14 Foundry Row',
            city: 'Wrenford',
            region: 'OH',
            postalCode: '43999',
            country: 'US',
        },
        geo: { latitude: 39.9612, longitude: -82.4988 },
        /** The taproom's hours. Monday and Tuesday it is closed: the brewers brew. */
        hours: [
            { days: ['Wednesday', 'Thursday'], opens: '15:00', closes: '22:00' },
            { days: ['Friday'], opens: '15:00', closes: '23:00' },
            { days: ['Saturday'], opens: '12:00', closes: '23:00' },
            { days: ['Sunday'], opens: '12:00', closes: '20:00' },
        ] satisfies OpeningHours[],
        closedDays: 'Closed Monday and Tuesday',
        priceRange: '$$',
        founded: 2016,
        /** The building's own date, cast into its lintel. */
        built: 1888,
        /** A square raster image of at least 112px; search engines ignore SVG logos. */
        logo: '/logo.png',
        /** Profiles elsewhere: Google Business Profile, Instagram, beer-rating apps... */
        sameAs: [] as string[],
    },

    /**
     * The age policy, said plainly wherever drinking is: the header ticker,
     * the footer, the tap list, the taproom and the private hire form.
     */
    agePolicy: {
        short: '21+ to drink. ID checked at the bar, every time.',
        long: 'You must be 21 or over, with a valid photo ID, to be served. We check everyone, every time, whatever you look like. Under-21s are welcome with an adult until 8pm, and are never served alcohol, not even a taster.',
    },

    /** The link preview used by any page that does not choose its own (1200x630). */
    defaultImage: { src: '/og-default.png', alt: 'Ironwood Brewing Co.: small-batch beer brewed in an old iron foundry in Wrenford' },

    /** The blog's own name and description, for its index and its feed. */
    blog: {
        title: 'Brewing notes',
        description: 'Notes from the brewhouse floor: how our beers are made, what is in the tanks, and how to get the best out of a pint at home.',
        /** Who a post is by when it does not say. */
        defaultAuthor: 'The Ironwood brewers',
    },

    /**
     * Pages kept out of search results and out of the sitemap. The audit
     * fails a page here that robots may index, and a page not here that
     * they may not (docs/seo.md, 6).
     */
    noindex: ['/404', '/contact/thanks/', '/credits/'],
};

/** The address on one line, as it should appear everywhere. */
export const addressLine = (() => {
    const { street, city, region, postalCode } = site.business.address;

    return `${street}, ${city}, ${region} ${postalCode}`;
})();

/** "Wed–Thu", "Fri": a run of days, short. */
export const dayRange = (days: readonly string[]) =>
    days.length === 1 ? (days[0] ?? '').slice(0, 3) : `${(days[0] ?? '').slice(0, 3)}–${(days[days.length - 1] ?? '').slice(0, 3)}`;

/** "15:00" -> "3pm", "12:00" -> "noon", "22:30" -> "10:30pm". */
export const clock = (time: string) => {
    const [hours = 0, minutes = 0] = time.split(':').map(Number);

    if (hours === 12 && minutes === 0) {
        return 'noon';
    }

    const suffix = hours >= 12 ? 'pm' : 'am';
    const hour = hours % 12 === 0 ? 12 : hours % 12;

    return minutes === 0 ? `${hour}${suffix}` : `${hour}:${String(minutes).padStart(2, '0')}${suffix}`;
};
