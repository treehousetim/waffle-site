/**
 * The studio and the site as a whole: name, contact details, hours, the
 * places it works, navigation, and the pages kept out of search results.
 * Every page reads it through Base.astro; nothing here is per page.
 *
 * Name, address and phone must read the same everywhere (on this site, the
 * Google Business Profile, wedding directories): search engines match them
 * to decide that all of those are one business. Change them here and every
 * page follows.
 *
 * Juniper & Vale is fictional: an invented studio in an invented stretch of
 * coast. 555-01xx numbers are reserved for fiction. Replace every value
 * before launch (PLAYBOOK.md).
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
    /** The name people read, after every page title: "Packages — Juniper & Vale". Short, so titles fit. */
    name: 'Juniper & Vale',

    /** One line about the studio, used where a page has nothing better. */
    tagline: 'Wedding, elopement and portrait photographers on the Saltgrass Coast',

    /** The site's own description, for the home page and the WebSite node. */
    description:
        'Juniper & Vale is a two-person photography studio on the Saltgrass Coast: weddings, elopements and portraits, told as quiet, honest picture stories.',

    lang: 'en',
    locale: 'en_US',

    /** The header's links, in order. Paths end in / (docs/pages.md). */
    nav: [
        { label: 'Stories', href: '/stories/' },
        { label: 'Portfolio', href: '/portfolio/' },
        { label: 'Packages', href: '/packages/' },
        { label: 'Experience', href: '/experience/' },
        { label: 'Journal', href: '/journal/' },
        { label: 'About', href: '/about/' },
    ] satisfies NavLink[],

    /** The header's call to action. */
    cta: { label: 'Enquire', href: '/enquire/' } satisfies NavLink,

    /** The footer's links, in columns. */
    footer: [
        {
            heading: 'The work',
            links: [
                { label: 'Weddings', href: '/portfolio/weddings/' },
                { label: 'Elopements', href: '/portfolio/elopements/' },
                { label: 'Portraits', href: '/portfolio/portraits/' },
                { label: 'All stories', href: '/stories/' },
            ],
        },
        {
            heading: 'Working together',
            links: [
                { label: 'Packages & pricing', href: '/packages/' },
                { label: 'The experience', href: '/experience/' },
                { label: 'Questions', href: '/faq/' },
                { label: 'Enquire', href: '/enquire/' },
            ],
        },
        {
            heading: 'The studio',
            links: [
                { label: 'About us', href: '/about/' },
                { label: 'Journal', href: '/journal/' },
                { label: 'Privacy', href: '/privacy/' },
                { label: 'Photo credits', href: '/credits/' },
            ],
        },
    ] satisfies { heading: string; links: NavLink[] }[],

    /**
     * The studio, for people and for search engines (JSON-LD
     * ProfessionalService, a kind of LocalBusiness). Example details only.
     */
    business: {
        /** schema.org type: ProfessionalService suits a studio that comes to you. */
        type: 'ProfessionalService',
        name: 'Juniper & Vale',
        legalName: 'Juniper & Vale Photography LLC',
        /** How it is written on the page; `phoneE164` is how it is dialled. */
        phone: '(541) 555-0163',
        phoneE164: '+15415550163',
        email: 'studio@example.com',
        address: {
            street: '22 Tidewater Row, Studio 3',
            city: 'Port Alder',
            region: 'OR',
            postalCode: '97000',
            country: 'US',
        },
        geo: { latitude: 44.02, longitude: -124.1 },
        /** The studio is open by appointment; shoots happen wherever the day is. */
        hours: [{ days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '10:00', closes: '17:00' }] satisfies OpeningHours[],
        priceRange: '$$$',
        founded: 2014,
        /** A square raster image of at least 112px; search engines ignore SVG logos. */
        logo: '/logo.png',
        /** Profiles elsewhere: Google Business Profile, Instagram, wedding directories... */
        sameAs: [] as string[],
    },

    /** The towns and places the studio works in most, for areaServed. */
    areas: ['Port Alder', 'Wrenmouth', 'Calder Ridge', 'Saltgrass Hollow', 'Larkhaven', 'Fennick Bay'],

    /** The two photographers, in the order they sign things. */
    people: ['Juniper Ashby', 'Theo Vale'],

    /** The link preview used by any page that does not choose its own (1200x630). */
    defaultImage: { src: '/og-default.png', alt: 'Juniper & Vale: wedding, elopement and portrait photography on the Saltgrass Coast' },

    /** The journal (the blog): its name and description, for its index and its feed. */
    blog: {
        title: 'The Journal',
        description: 'Planning notes from two wedding photographers: timelines, light, venues, elopements, portraits and what we would tell a friend getting married.',
        /** Who a post is by when it does not say. */
        defaultAuthor: 'Juniper Ashby',
        /** Where it lives. */
        path: '/journal/',
    },

    /**
     * Pages kept out of search results and out of the sitemap. The audit
     * fails a page here that robots may index, and a page not here that
     * they may not (docs/seo.md, 6).
     */
    noindex: ['/404', '/enquire/thanks/', '/credits/'],
};

/** The studio's address on one line, as it should appear everywhere. */
export const addressLine = (() => {
    const { street, city, region, postalCode } = site.business.address;

    return `${street}, ${city}, ${region} ${postalCode}`;
})();
