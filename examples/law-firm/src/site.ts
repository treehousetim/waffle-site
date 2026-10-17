/**
 * The firm and the site as a whole: name, contact details, hours, the
 * places it serves, navigation, the footer's links and notices, and the pages
 * kept out of search results. Every page reads it through Base.astro; nothing
 * here is per page.
 *
 * Name, address and phone must read the same everywhere (on this site, the
 * Google Business Profile, the bar directory): search engines match them to
 * decide that all of those are one firm. Change them here and every page
 * follows.
 *
 * Everything below is fiction: Hale & Morrow, Harrowmere and Ostrey County do
 * not exist, 555-01xx numbers are reserved for fiction, and the attorneys'
 * bar admissions (src/data/attorneys.ts) are invented. Replace every value
 * with the real firm's before launch, and have the firm check the
 * advertising notice against its state's rules of professional conduct.
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
    /** The name people read, after every page title: "Estate planning — Hale & Morrow". */
    name: 'Hale & Morrow',

    /** One line about the firm, used where a page has nothing better. */
    tagline: 'Attorneys for small businesses and families',

    /** The site's own description, for the home page and the WebSite node. */
    description:
        'A four-attorney firm on Court Square in Harrowmere: business formation and contracts, estate planning and probate, employment law and commercial real estate.',

    lang: 'en',
    locale: 'en_US',

    /** The header's links, in order. Paths end in / (docs/pages.md). */
    nav: [
        { label: 'Practice', href: '/practice/' },
        { label: 'Attorneys', href: '/attorneys/' },
        { label: 'Fees', href: '/how-we-work/' },
        { label: 'Insights', href: '/insights/' },
        { label: 'About', href: '/about/' },
    ] satisfies NavLink[],

    /** The header's call to action. */
    cta: { label: 'Request a consultation', href: '/consultation/' } satisfies NavLink,

    /** The footer's links, in columns. */
    footer: [
        {
            heading: 'Practice',
            links: [
                { label: 'Business formation & contracts', href: '/practice/business-formation-contracts/' },
                { label: 'Estate planning & probate', href: '/practice/estate-planning-probate/' },
                { label: 'Employment law', href: '/practice/employment-law/' },
                { label: 'Commercial real estate', href: '/practice/commercial-real-estate/' },
            ],
        },
        {
            heading: 'The firm',
            links: [
                { label: 'Attorneys', href: '/attorneys/' },
                { label: 'About the firm', href: '/about/' },
                { label: 'How we work & fees', href: '/how-we-work/' },
                { label: 'Insights', href: '/insights/' },
            ],
        },
        {
            heading: 'Clients',
            links: [
                { label: 'Request a consultation', href: '/consultation/' },
                { label: 'Questions', href: '/faq/' },
                { label: 'Attorney advertising', href: '/disclaimer/' },
                { label: 'Privacy', href: '/privacy/' },
            ],
        },
    ] satisfies { heading: string; links: NavLink[] }[],

    /**
     * The firm, for people and for search engines (JSON-LD LegalService, a
     * kind of LocalBusiness). Example details: replace every one.
     */
    business: {
        /** schema.org type: LegalService (or Attorney, which schema.org now discourages). */
        type: 'LegalService',
        name: 'Hale & Morrow',
        legalName: 'Hale & Morrow, PLLC',
        /** How it is written on the page; `phoneE164` is how it is dialled. */
        phone: '(540) 555-0137',
        phoneE164: '+15405550137',
        email: 'counsel@example.com',
        address: {
            street: '9 Court Square, Second Floor',
            city: 'Harrowmere',
            region: 'VA',
            postalCode: '24199',
            country: 'US',
        },
        geo: { latitude: 37.3021, longitude: -79.1287 },
        hours: [{ days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:30', closes: '17:30' }] satisfies OpeningHours[],
        /** Shown beside the hours. */
        appointments: 'Evening and Saturday meetings by appointment.',
        priceRange: '$$',
        county: 'Ostrey County',
        founded: 1998,
        /** A square raster image of at least 112px; search engines ignore SVG logos. */
        logo: '/logo.png',
        /** Profiles elsewhere: Google Business Profile, the state bar directory, LinkedIn... */
        sameAs: [] as string[],
    },

    /** The towns the firm's clients come from (the county seat first). */
    areas: ['Harrowmere', 'Ostrey Mills', 'Calder Gap', 'Wenlow', 'Pryor’s Ford'],

    /**
     * The notices a law firm's site carries. Wording varies by state; the
     * firm's own rules of professional conduct decide what it must say.
     */
    notices: {
        advertising:
            'Attorney advertising. This website is for general information and is not legal advice. Prior results do not guarantee a similar outcome.',
        noRelationship:
            'Contacting the firm, by this form or otherwise, does not create an attorney-client relationship. Please do not send confidential information until we have confirmed that we can represent you.',
        fiction:
            'Hale & Morrow is a fictional firm on an example website. Its attorneys, credentials and clients are invented.',
    },

    /** The link preview used by any page that does not choose its own (1200x630). */
    defaultImage: { src: '/og-default.png', alt: 'Hale & Morrow, attorneys at law, Court Square, Harrowmere' },

    /** The blog's own name and description, for its index and its feed. */
    blog: {
        title: 'Insights',
        description:
            'Plain-language explainers from the attorneys at Hale & Morrow: business formation, contracts, wills, probate, employment and commercial property.',
        /** Who a post is by when it does not say. */
        defaultAuthor: 'The attorneys of Hale & Morrow',
    },

    /**
     * Pages kept out of search results and out of the sitemap. The audit
     * fails a page here that robots may index, and a page not here that
     * they may not (docs/seo.md, 6).
     */
    noindex: ['/404', '/consultation/thanks/', '/credits/'],
};

/** The firm's address on one line, as it should appear everywhere. */
export const addressLine = (() => {
    const { street, city, region, postalCode } = site.business.address;

    return `${street}, ${city}, ${region} ${postalCode}`;
})();
