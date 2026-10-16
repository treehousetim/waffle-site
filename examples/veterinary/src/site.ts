/**
 * The animal hospital and the site as a whole: name, contact details, hours,
 * the after-hours partner, the towns served, navigation, and the pages kept
 * out of search results. Every page reads it through Base.astro; nothing
 * here is per page.
 *
 * Name, address and phone must read the same everywhere (on this site, the
 * Google Business Profile, directories): search engines match them to decide
 * that all of those are one business. Change them here and every page follows.
 *
 * Everything below is fiction: Bramblewick is not a real town, 555-01xx
 * numbers are reserved for fiction, and example.com takes no mail.
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
    /** The name people read, after every page title: "Dental care — Paws & Whiskers". Short on purpose. */
    name: 'Paws & Whiskers',

    /** One line about the business, used where a page has nothing better. */
    tagline: 'The neighbourhood animal hospital in Bramblewick',

    /** The site's own description, for the home page and the WebSite node. */
    description:
        'A friendly neighbourhood animal hospital in Bramblewick: checkups, vaccines, dental care, surgery and same-day urgent visits for dogs, cats and exotics.',

    lang: 'en',
    locale: 'en_US',

    /** The header's links, in order. Paths end in / (docs/pages.md). */
    nav: [
        { label: 'Services', href: '/services/' },
        { label: 'Wellness plans', href: '/wellness-plans/' },
        { label: 'Our team', href: '/team/' },
        { label: 'New clients', href: '/new-clients/' },
        { label: 'Pet resources', href: '/resources/' },
        { label: 'Blog', href: '/blog/' },
    ] satisfies NavLink[],

    /** The header's button. */
    cta: { label: 'Book a visit', href: '/book/' } satisfies NavLink,

    /** The footer's links, in columns. */
    footer: [
        {
            heading: 'Care',
            links: [
                { label: 'Wellness exams & vaccines', href: '/services/wellness-exams-vaccines/' },
                { label: 'Dental care', href: '/services/dental-care/' },
                { label: 'Surgery', href: '/services/surgery/' },
                { label: 'Urgent care', href: '/services/urgent-care/' },
                { label: 'All services', href: '/services/' },
            ],
        },
        {
            heading: 'Visiting',
            links: [
                { label: 'Book a visit', href: '/book/' },
                { label: 'New clients', href: '/new-clients/' },
                { label: 'Wellness plans', href: '/wellness-plans/' },
                { label: 'Find us', href: '/contact/' },
                { label: 'FAQ', href: '/faq/' },
            ],
        },
        {
            heading: 'About',
            links: [
                { label: 'Our story', href: '/about/' },
                { label: 'Our team', href: '/team/' },
                { label: 'Pet resources', href: '/resources/' },
                { label: 'Blog', href: '/blog/' },
                { label: 'Privacy', href: '/privacy/' },
            ],
        },
    ] satisfies { heading: string; links: NavLink[] }[],

    /**
     * The business, for people and for search engines (JSON-LD VeterinaryCare,
     * a kind of LocalBusiness). Example details only. Replace every one
     * before launch.
     */
    business: {
        /** schema.org type: VeterinaryCare. */
        type: 'VeterinaryCare',
        name: 'Paws & Whiskers Animal Hospital',
        legalName: 'Paws & Whiskers Animal Hospital LLC',
        /** How it is written on the page; `phoneE164` is how it is dialled. */
        phone: '(503) 555-0147',
        phoneE164: '+15035550147',
        email: 'hello@example.com',
        address: {
            street: '18 Kettle Lane',
            city: 'Bramblewick',
            region: 'OR',
            postalCode: '97999',
            country: 'US',
        },
        geo: { latitude: 45.2101, longitude: -122.9034 },
        hours: [
            { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '19:00' },
            { days: ['Saturday'], opens: '09:00', closes: '14:00' },
        ] satisfies OpeningHours[],
        /** The hours as people read them, in the order above. */
        hoursText: [
            { days: 'Monday to Friday', time: '8 am to 7 pm' },
            { days: 'Saturday', time: '9 am to 2 pm' },
            { days: 'Sunday', time: 'Closed: see after-hours care' },
        ],
        priceRange: '$$',
        licence: 'Oregon veterinary premises registration VP-0000 (example)',
        founded: 2011,
        /** A square raster image of at least 112px; search engines ignore SVG logos. */
        logo: '/logo.png',
        /** Profiles elsewhere: Google Business Profile, Facebook, Instagram... */
        sameAs: [] as string[],
    },

    /**
     * Where to go when the hospital is closed: an emergency hospital the
     * team refers to. Fictional, like everything here.
     */
    afterHours: {
        name: 'Lantern Hill Animal Emergency',
        phone: '(503) 555-0188',
        phoneE164: '+15035550188',
        address: '400 Lantern Hill Road, Larkfield',
        note: 'Open every night, weekends and holidays. They send us notes the next morning.',
    },

    /** The towns the hospital sees most of its patients from. */
    areas: ['Bramblewick', 'Larkfield', 'Otter Bend', 'Hollins Cross', 'Mossgate'],

    /** The link preview used by any page that does not choose its own (1200x630). */
    defaultImage: { src: '/og-default.png', alt: 'Paws & Whiskers Animal Hospital: the neighbourhood vet in Bramblewick' },

    /** The blog's own name and description, for its index and its feed. */
    blog: {
        title: 'Pet-health advice',
        description: 'Practical pet-health advice from the vets and nurses at Paws & Whiskers: vaccines, teeth, safety, older pets, exotics and calmer vet visits.',
        /** Who a post is by when it does not say. */
        defaultAuthor: 'The Paws & Whiskers team',
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
