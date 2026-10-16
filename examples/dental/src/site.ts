/**
 * The practice and the site as a whole: name, contact details, hours, the
 * neighbourhoods it serves, navigation, and the pages kept out of search
 * results. Every page reads it through Base.astro; nothing here is per page.
 *
 * Name, address and phone must read the same everywhere (on this site, the
 * Google Business Profile, directories, insurers' provider lists): search
 * engines match them to decide that all of those are one practice. Change
 * them here and every page follows.
 *
 * Everything below is fictional: Thistlewood is not a real town, and 555-01xx
 * numbers are reserved for fiction. Replace every value before launch.
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
    /**
     * The name people read, after every page title: "Clear aligners — Brightside Dental".
     * Short on purpose: the audit warns past 65 characters for the whole title.
     * The practice's full name is `business.name`.
     */
    name: 'Brightside Dental',

    /** One line about the practice, used where a page has nothing better. */
    tagline: 'Gentle, unhurried dentistry for the whole family',

    /** The site's own description, for the home page and the WebSite node. */
    description:
        'A friendly family dental practice in Thistlewood: check-ups, children’s dentistry, whitening, aligners, implants and same-day emergencies, at a calmer pace.',

    lang: 'en',
    locale: 'en_US',

    /** The header's links, in order. Paths end in / (docs/pages.md). */
    nav: [
        { label: 'Treatments', href: '/treatments/' },
        { label: 'New patients', href: '/new-patients/' },
        { label: 'Nervous?', href: '/nervous-patients/' },
        { label: 'Insurance', href: '/insurance/' },
        { label: 'Our team', href: '/team/' },
        { label: 'Advice', href: '/blog/' },
    ] satisfies NavLink[],

    /** The header's button. */
    cta: { label: 'Book a visit', href: '/book/' } satisfies NavLink,

    /** The footer's links, in columns. */
    footer: [
        {
            heading: 'Treatments',
            links: [
                { label: 'Check-ups & cleanings', href: '/treatments/checkups-and-cleanings/' },
                { label: 'Children’s dentistry', href: '/treatments/childrens-dentistry/' },
                { label: 'Clear aligners', href: '/treatments/clear-aligners/' },
                { label: 'Dental implants', href: '/treatments/implants/' },
                { label: 'Emergency care', href: '/treatments/emergency-dental-care/' },
            ],
        },
        {
            heading: 'Visiting us',
            links: [
                { label: 'New patients', href: '/new-patients/' },
                { label: 'Nervous patients', href: '/nervous-patients/' },
                { label: 'Insurance & payment', href: '/insurance/' },
                { label: 'Find us', href: '/contact/' },
                { label: 'Questions', href: '/faq/' },
            ],
        },
        {
            heading: 'The practice',
            links: [
                { label: 'About Brightside', href: '/about/' },
                { label: 'Our dentists', href: '/team/' },
                { label: 'Oral health advice', href: '/blog/' },
                { label: 'Privacy', href: '/privacy/' },
            ],
        },
    ] satisfies { heading: string; links: NavLink[] }[],

    /**
     * The practice, for people and for search engines (JSON-LD Dentist, a
     * kind of LocalBusiness). Example details only.
     */
    business: {
        /** schema.org type. */
        type: 'Dentist',
        name: 'Brightside Family Dental',
        legalName: 'Brightside Family Dental, PLLC',
        /** How it is written on the page; `phoneE164` is how it is dialled. */
        phone: '(503) 555-0134',
        phoneE164: '+15035550134',
        email: 'smile@example.com',
        address: {
            street: '212 Honeysuckle Lane',
            city: 'Thistlewood',
            region: 'OR',
            postalCode: '97999',
            country: 'US',
        },
        geo: { latitude: 45.1203, longitude: -122.5871 },
        hours: [
            { days: ['Monday', 'Tuesday', 'Thursday'], opens: '07:30', closes: '17:30' },
            { days: ['Wednesday'], opens: '10:00', closes: '19:00' },
            { days: ['Friday'], opens: '08:00', closes: '14:00' },
            { days: ['Saturday'], opens: '08:00', closes: '12:00' },
        ] satisfies OpeningHours[],
        /** Shown next to the hours. */
        emergency: 'Same-day emergency appointments, every weekday we are open.',
        priceRange: '$$',
        licence: 'Practice registration OR-DEN-000000 (example)',
        founded: 2011,
        /** A square raster image of at least 112px; search engines ignore SVG logos. */
        logo: '/logo.png',
        /** Profiles elsewhere: Google Business Profile, Facebook, Yelp... */
        sameAs: [] as string[],
    },

    /** The neighbourhoods patients come from, for the structured data and the contact page. */
    areas: ['Thistlewood', 'Alder Bend', 'Pennyroyal', 'North Fallow'],

    /** The link preview used by any page that does not choose its own (1200x630). */
    defaultImage: { src: '/og-default.png', alt: 'Brightside Family Dental: gentle family dentistry in Thistlewood' },

    /** The blog's own name and description, for its index and its feed. */
    blog: {
        title: 'Oral health advice',
        description: 'Plain, kind advice from the Brightside dentists: brushing, children’s teeth, whitening, aligners, sensitive teeth and feeling calmer in the chair.',
        /** Who a post is by when it does not say. */
        defaultAuthor: 'The Brightside team',
    },

    /**
     * Pages kept out of search results and out of the sitemap. The audit
     * fails a page here that robots may index, and a page not here that
     * they may not (docs/seo.md, 6).
     */
    noindex: ['/404', '/book/thanks/', '/credits/'],
};

/** The practice's address on one line, as it should appear everywhere. */
export const addressLine = (() => {
    const { street, city, region, postalCode } = site.business.address;

    return `${street}, ${city}, ${region} ${postalCode}`;
})();

/** "Mon, Tue, Thu" or "Wednesday": a short, readable day list. */
export const dayList = (days: readonly string[]) => (days.length === 1 ? (days[0] ?? '') : days.map((day) => day.slice(0, 3)).join(', '));

/** "07:30" -> "7:30 am", "17:30" -> "5:30 pm". */
export const clock = (time: string) => {
    const [h = 0, m = 0] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    const hour = h % 12 === 0 ? 12 : h % 12;

    return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
};
