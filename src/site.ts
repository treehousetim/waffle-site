/**
 * The business and the site as a whole: name, contact details, hours, the
 * towns served, navigation, and the pages kept out of search results. Every
 * page reads it through Base.astro; nothing here is per page.
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
    /** The name people read, after every page title: "Panel upgrades — Waffle Site". */
    name: 'Waffle Site',

    /** One line about the business, used where a page has nothing better. */
    tagline: 'Licensed electricians for homes and small businesses',

    /** The site's own description, for the home page and the WebSite node. */
    description:
        'Licensed, insured electricians serving Springfield and nearby towns: repairs, panel upgrades, EV chargers and 24/7 emergency call-outs.',

    lang: 'en',
    locale: 'en_US',

    /** The header's links, in order. Paths end in / (docs/pages.md). */
    nav: [
        { label: 'Services', href: '/services/' },
        { label: 'Areas', href: '/areas/' },
        { label: 'Prices', href: '/prices/' },
        { label: 'Reviews', href: '/reviews/' },
        { label: 'Blog', href: '/blog/' },
        { label: 'About', href: '/about/' },
    ] satisfies NavLink[],

    /** The header's button. */
    cta: { label: 'Get a free quote', href: '/contact/' } satisfies NavLink,

    /** The footer's links, in columns. */
    footer: [
        {
            heading: 'Services',
            links: [
                { label: 'Panel upgrades', href: '/services/panel-upgrades/' },
                { label: 'EV chargers', href: '/services/ev-chargers/' },
                { label: 'Rewiring', href: '/services/rewiring/' },
                { label: 'Lighting', href: '/services/lighting/' },
                { label: 'All services', href: '/services/' },
            ],
        },
        {
            heading: 'Company',
            links: [
                { label: 'About us', href: '/about/' },
                { label: 'Reviews', href: '/reviews/' },
                { label: 'Prices', href: '/prices/' },
                { label: 'FAQ', href: '/faq/' },
                { label: 'Blog', href: '/blog/' },
            ],
        },
        {
            heading: 'Help',
            links: [
                { label: '24/7 emergency', href: '/emergency/' },
                { label: 'Get a quote', href: '/contact/' },
                { label: 'Areas we serve', href: '/areas/' },
                { label: 'Privacy', href: '/privacy/' },
            ],
        },
    ] satisfies { heading: string; links: NavLink[] }[],

    /**
     * The business, for people and for search engines (JSON-LD Electrician,
     * a kind of LocalBusiness). Example details: 555-01xx numbers are
     * reserved for fiction. Replace every one before launch.
     */
    business: {
        /** schema.org type: Electrician, Plumber, HVACBusiness, RoofingContractor... */
        type: 'Electrician',
        name: 'Waffle Site',
        legalName: 'Waffle Site LLC',
        /** How it is written on the page; `phoneE164` is how it is dialled. */
        phone: '(217) 555-0142',
        phoneE164: '+12175550142',
        email: 'hello@example.com',
        address: {
            street: '1200 Example Avenue, Suite 4',
            city: 'Springfield',
            region: 'IL',
            postalCode: '62701',
            country: 'US',
        },
        geo: { latitude: 39.7817, longitude: -89.6501 },
        hours: [
            { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:30', closes: '17:30' },
            { days: ['Saturday'], opens: '08:00', closes: '13:00' },
        ] satisfies OpeningHours[],
        /** Shown next to the hours: call-outs outside them are emergency work. */
        emergency: 'Emergency call-outs 24 hours a day, 7 days a week.',
        priceRange: '$$',
        licence: 'Illinois electrical contractor licence EC-000000 (example)',
        founded: 2009,
        /** A square raster image of at least 112px; search engines ignore SVG logos. */
        logo: '/logo.png',
        /** Profiles elsewhere: Google Business Profile, Facebook, Yelp, Angi... */
        sameAs: [] as string[],
    },

    /** The link preview used by any page that does not choose its own (1200x630). */
    defaultImage: { src: '/og-default.png', alt: 'Waffle Site: licensed electricians in Springfield' },

    /** The blog's own name and description, for its index and its feed. */
    blog: {
        title: 'Electrical advice',
        description: 'Plain-language advice from licensed electricians: safety, panels, EV charging, lighting, permits and keeping energy bills down.',
        /** Who a post is by when it does not say. */
        defaultAuthor: 'The Waffle Site team',
    },

    /**
     * Pages kept out of search results and out of the sitemap. The audit
     * fails a page here that robots may index, and a page not here that
     * they may not (docs/seo.md, 6).
     */
    noindex: ['/404', '/contact/thanks/', '/credits/'],
};

/** The business's address on one line, as it should appear everywhere. */
export const addressLine = (() => {
    const { street, city, region, postalCode } = site.business.address;

    return `${street}, ${city}, ${region} ${postalCode}`;
})();
