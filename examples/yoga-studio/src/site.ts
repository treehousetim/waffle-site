/**
 * The studio and the site as a whole: name, contact details, hours,
 * navigation, and the pages kept out of search results. Every page reads it
 * through Base.astro; nothing here is per page.
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
    /** The name people read, after every page title: "Yin yoga — Still Water Yoga". */
    name: 'Still Water Yoga',

    /** One line about the studio, used where a page has nothing better. */
    tagline: 'An unhurried yoga studio on the river in Alderwick',

    /** The site's own description, for the home page and the WebSite node. */
    description:
        'Still Water Yoga is an independent studio on the River Alder in Alderwick: vinyasa, yin, restorative, prenatal and beginners classes, seven days a week.',

    lang: 'en',
    locale: 'en_US',

    /** The header's links, in order. Paths end in / (docs/pages.md). */
    nav: [
        { label: 'Classes', href: '/classes/' },
        { label: 'Schedule', href: '/schedule/' },
        { label: 'Teachers', href: '/teachers/' },
        { label: 'Pricing', href: '/pricing/' },
        { label: 'Workshops', href: '/workshops/' },
        { label: 'Journal', href: '/blog/' },
    ] satisfies NavLink[],

    /** The header's invitation. */
    cta: { label: 'New here? Start for $40', href: '/new-students/' } satisfies NavLink,

    /** The footer's links, in columns. */
    footer: [
        {
            heading: 'Practise',
            links: [
                { label: 'Vinyasa', href: '/classes/vinyasa/' },
                { label: 'Yin', href: '/classes/yin/' },
                { label: 'Restorative', href: '/classes/restorative/' },
                { label: 'Prenatal', href: '/classes/prenatal/' },
                { label: 'Beginners', href: '/classes/beginners/' },
            ],
        },
        {
            heading: 'The studio',
            links: [
                { label: 'About the studio', href: '/about/' },
                { label: 'Teachers', href: '/teachers/' },
                { label: 'Workshops & retreats', href: '/workshops/' },
                { label: 'Journal', href: '/blog/' },
            ],
        },
        {
            heading: 'Visit',
            links: [
                { label: 'New students', href: '/new-students/' },
                { label: 'Weekly schedule', href: '/schedule/' },
                { label: 'Pricing', href: '/pricing/' },
                { label: 'Questions', href: '/faq/' },
                { label: 'Contact', href: '/contact/' },
            ],
        },
    ] satisfies { heading: string; links: NavLink[] }[],

    /**
     * The studio, for people and for search engines (JSON-LD
     * SportsActivityLocation, a kind of LocalBusiness). Example details:
     * Alderwick is invented and 555-01xx numbers are reserved for fiction.
     * Replace every one before launch.
     */
    business: {
        /** schema.org type: SportsActivityLocation, ExerciseGym, HealthClub... */
        type: 'SportsActivityLocation',
        name: 'Still Water Yoga',
        legalName: 'Still Water Yoga LLC',
        /** How it is written on the page; `phoneE164` is how it is dialled. */
        phone: '(541) 555-0137',
        phoneE164: '+15415550137',
        email: 'hello@example.com',
        address: {
            street: '3 Ferry Lane, The Old Boathouse',
            city: 'Alderwick',
            region: 'OR',
            postalCode: '97099',
            country: 'US',
        },
        geo: { latitude: 44.0121, longitude: -122.9874 },
        hours: [
            { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '06:30', closes: '21:00' },
            { days: ['Saturday', 'Sunday'], opens: '08:00', closes: '18:00' },
        ] satisfies OpeningHours[],
        /** A line beside the hours. */
        note: 'Doors open twenty minutes before every class.',
        priceRange: '$$',
        founded: 2016,
        /** A square raster image of at least 112px; search engines ignore SVG logos. */
        logo: '/logo.png',
        /** Profiles elsewhere: Google Business Profile, Instagram... */
        sameAs: [] as string[],
    },

    /** The link preview used by any page that does not choose its own (1200x630). */
    defaultImage: { src: '/og-default.png', alt: 'Still Water Yoga: an unhurried yoga studio on the river in Alderwick' },

    /** The journal's own name and description, for its index and its feed. */
    blog: {
        title: 'The journal',
        description: 'Notes from the studio on the river: practice, rest, breath, pregnancy, beginning yoga and looking after yourself between classes.',
        /** Who a post is by when it does not say. */
        defaultAuthor: 'Maya Lindqvist',
    },

    /**
     * Pages kept out of search results and out of the sitemap. The audit
     * fails a page here that robots may index, and a page not here that
     * they may not (docs/seo.md, 6).
     */
    noindex: ['/404', '/contact/thanks/', '/credits/'],
};

/** The studio's address on one line, as it should appear everywhere. */
export const addressLine = (() => {
    const { street, city, region, postalCode } = site.business.address;

    return `${street}, ${city}, ${region} ${postalCode}`;
})();

/** Where the studio's people come from, for the business node's areaServed. */
export const areasServed = ['Alderwick', 'Lower Ferry', 'Hollins Bend'];
