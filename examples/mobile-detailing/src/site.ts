/**
 * The business and the site as a whole: name, contact details, hours,
 * navigation, and the pages kept out of search results. Every page reads it
 * through Base.astro; nothing here is per page.
 *
 * Gloss Theory is fictional: a mobile detailing crew in the made-up city of
 * Port Alder. The 555-01xx number is reserved for fiction and the address is
 * invented. Replace every value before launch (PLAYBOOK.md).
 *
 * Name, address and phone must read the same everywhere (this site, the
 * Google Business Profile, directories). A mobile business still lists the
 * yard it works from; the zones it drives to are in src/data/zones.ts.
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
    /** The name people read, after every page title: "Paint correction — Gloss Theory". */
    name: 'Gloss Theory',

    /** One line about the business, used where a page has nothing better. */
    tagline: 'Mobile car detailing that comes to your driveway or office lot',

    /** The site's own description, for the home page and the WebSite node. */
    description:
        'Gloss Theory is a fully mobile detailing crew in Port Alder: hand washes, full details, interiors, paint correction and ceramic coating, at your home or office.',

    lang: 'en',
    locale: 'en_US',

    /** The header's links, in order. Paths end in / (docs/pages.md). */
    nav: [
        { label: 'Packages', href: '/packages/' },
        { label: 'Zones', href: '/zones/' },
        { label: 'Fleet', href: '/fleet/' },
        { label: 'How it works', href: '/how-it-works/' },
        { label: 'Gallery', href: '/gallery/' },
        { label: 'Journal', href: '/blog/' },
    ] satisfies NavLink[],

    /** The header's button. */
    cta: { label: 'Book a detail', href: '/book/' } satisfies NavLink,

    /** The footer's links, in columns. */
    footer: [
        {
            heading: 'Packages',
            links: [
                { label: 'Express wash', href: '/packages/express-wash/' },
                { label: 'Full detail', href: '/packages/full-detail/' },
                { label: 'Interior deep clean', href: '/packages/interior-deep-clean/' },
                { label: 'Paint correction', href: '/packages/paint-correction/' },
                { label: 'Ceramic coating', href: '/packages/ceramic-coating/' },
            ],
        },
        {
            heading: 'Crew',
            links: [
                { label: 'About us', href: '/about/' },
                { label: 'How it works', href: '/how-it-works/' },
                { label: 'Fleet accounts', href: '/fleet/' },
                { label: 'Gallery', href: '/gallery/' },
                { label: 'Journal', href: '/blog/' },
            ],
        },
        {
            heading: 'Help',
            links: [
                { label: 'Book a detail', href: '/book/' },
                { label: 'Service zones', href: '/zones/' },
                { label: 'FAQ', href: '/faq/' },
                { label: 'Contact', href: '/contact/' },
                { label: 'Privacy', href: '/privacy/' },
            ],
        },
    ] satisfies { heading: string; links: NavLink[] }[],

    /**
     * The business, for people and for search engines (JSON-LD AutoWash, a
     * kind of LocalBusiness). Fictional details; replace every one.
     */
    business: {
        /** schema.org type: AutoWash covers detailing as well as washing. */
        type: 'AutoWash',
        name: 'Gloss Theory',
        legalName: 'Gloss Theory Mobile Detailing LLC',
        /** How it is written on the page; `phoneE164` is how it is dialled. */
        phone: '(541) 555-0174',
        phoneE164: '+15415550174',
        email: 'crew@example.com',
        /** The yard the vans leave from each morning. Customers are not seen here. */
        address: {
            street: '41 Foundry Lane, Unit 3',
            city: 'Port Alder',
            region: 'OR',
            postalCode: '97999',
            country: 'US',
        },
        geo: { latitude: 44.0, longitude: -123.0 },
        hours: [
            { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:00', closes: '19:00' },
            { days: ['Saturday'], opens: '08:00', closes: '17:00' },
        ] satisfies OpeningHours[],
        /** What the hours mean for a business that drives to you. */
        hoursNote: 'Hours are when the vans are out. Bookings by form any time.',
        priceRange: '$$',
        /** Credentials worth a line in the footer. Example text. */
        licence: 'Port Alder business licence BL-0000 (example) · Fully insured',
        founded: 2019,
        /** A square raster image of at least 112px; search engines ignore SVG logos. */
        logo: '/logo.png',
        /** Profiles elsewhere: Google Business Profile, Instagram, Yelp... */
        sameAs: [] as string[],
    },

    /** The link preview used by any page that does not choose its own (1200x630). */
    defaultImage: { src: '/og-default.png', alt: 'Gloss Theory: mobile car detailing in Port Alder' },

    /** The blog's own name and description, for its index and its feed. */
    blog: {
        title: 'The Gloss Journal',
        description: 'Car-care advice from a mobile detailing crew: scratch-free washing, interiors, paint correction, coatings and gloss that lasts between visits.',
        /** Who a post is by when it does not say. */
        defaultAuthor: 'The Gloss Theory crew',
    },

    /**
     * Pages kept out of search results and out of the sitemap. The audit
     * fails a page here that robots may index, and a page not here that
     * they may not (docs/seo.md, 6).
     */
    noindex: ['/404', '/book/thanks/', '/credits/'],
};

/** The business's address on one line, as it should appear everywhere. */
export const addressLine = (() => {
    const { street, city, region, postalCode } = site.business.address;

    return `${street}, ${city}, ${region} ${postalCode}`;
})();
