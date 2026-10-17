/**
 * The firm's attorneys, each with a page in src/pages/attorneys/<slug>.astro
 * (the structure test checks), built on layouts/AttorneyPage.astro.
 *
 * EVERYTHING HERE IS FICTION. These people do not exist; their bar
 * admissions and schools are invented and labelled as such on every page.
 * A real firm replaces each entry with the attorney's own, checked against
 * the bar's public record, and never publishes a credential it cannot prove.
 */
export interface Attorney {
    slug: string;
    name: string;
    /** For the monogram roundel that stands in for a portrait. */
    initials: string;
    role: string;
    /** Practice areas by slug (src/data/practice.ts), the main one first. */
    practices: string[];
    /** The year they joined the firm. */
    joined: number;
    /** Fictional admissions, written so no one could mistake them for real ones. */
    admissions: { court: string; year: number }[];
    education: string[];
    /** The short line under the name in lists. */
    focus: string;
    bio: string[];
    /** A sentence in their own voice, set as a pull quote. */
    quote: string;
    /** Outside the office: memberships, teaching, the county. */
    community: string[];
    email: string;
}

export const attorneys = [
    {
        slug: 'eleanor-hale',
        name: 'Eleanor Hale',
        initials: 'EH',
        role: 'Founding partner',
        practices: ['business-formation-contracts', 'commercial-real-estate', 'estate-planning-probate'],
        joined: 1998,
        admissions: [
            { court: 'State bar (fictional admission)', year: 1994 },
            { court: 'Federal district court (fictional admission)', year: 1996 },
        ],
        education: ['Law degree, Ostrey State School of Law (fictional), 1994', 'B.A. in history, Calder College (fictional), 1991'],
        focus: 'Business formation, contracts and closely held companies',
        bio: [
            'Eleanor founded the firm with Daniel Morrow in 1998, in two rooms above what was then the Court Square pharmacy. She had spent four years at a larger firm drafting contracts for companies that never met their lawyers, and wanted to practice the other way: for owners she could sit across a table from.',
            'Her work is the legal life of small and family companies: choosing the entity, writing the agreements between the people who own it, and the contracts it signs every week. She is at her best in the conversations nobody wants to have early, about what happens when a partner leaves or a founder retires.',
            'Clients describe her drafts as short. She regards that as the highest compliment a contract can be paid.',
        ],
        quote: 'A good agreement is the conversation you had while everyone still liked each other, written down.',
        community: ['Board member, Harrowmere Main Street Association (fictional)', 'Teaches a spring evening course on contracts for small business owners'],
        email: 'ehale@example.com',
    },
    {
        slug: 'daniel-morrow',
        name: 'Daniel Morrow',
        initials: 'DM',
        role: 'Founding partner',
        practices: ['estate-planning-probate'],
        joined: 1998,
        admissions: [
            { court: 'State bar (fictional admission)', year: 1992 },
            { court: 'State court of appeals (fictional admission)', year: 1995 },
        ],
        education: ['Law degree, Ostrey State School of Law (fictional), 1992', 'B.S. in accounting, Wenlow University (fictional), 1988'],
        focus: 'Wills, trusts, probate and planning for family businesses',
        bio: [
            'Daniel has written wills for three generations of some Ostrey County families, and settled the estates of more than a few of their grandparents. Before law school he was an accountant, which shows in the way he reads a family’s finances: patiently, and all the way to the bottom of the page.',
            'He leads the firm’s estate planning and probate practice. Most of his clients are ordinary families with a house, some savings and children they would like not to argue; a good number own a business or farm that has to keep running when ownership passes.',
            'Executors who come to him are usually grieving and overwhelmed. His first meeting with them is unhurried, and ends with a written list of what happens next.',
        ],
        quote: 'Most estate plans fail for a simple reason: they were never finished. We finish them.',
        community: ['Volunteer, county senior center legal clinic (fictional)', 'Past president, Ostrey County Bar Association (fictional)'],
        email: 'dmorrow@example.com',
    },
    {
        slug: 'margaret-okafor',
        name: 'Margaret Okafor',
        initials: 'MO',
        role: 'Partner',
        practices: ['employment-law', 'business-formation-contracts'],
        joined: 2009,
        admissions: [
            { court: 'State bar (fictional admission)', year: 2006 },
            { court: 'Federal district court (fictional admission)', year: 2007 },
        ],
        education: ['Law degree, Pryor University School of Law (fictional), 2006', 'B.A. in economics, Calder College (fictional), 2002'],
        focus: 'Advice for employers: handbooks, hiring, classification and terminations',
        bio: [
            'Margaret joined Hale & Morrow in 2009 after three years defending employment claims for a regional firm, and decided she would rather prevent them. She advises small and mid-sized employers, from a six-person machine shop to a county-wide home health agency, on the everyday law of having employees.',
            'Her clients call her before the difficult conversation, not after it. She writes handbooks people read, reviews offer letters and restrictive covenants, and, when a dispute does arrive, works to resolve it quickly and quietly.',
            'She became a partner in 2015.',
        ],
        quote: 'The cheapest employment lawsuit is the one that was a phone call instead.',
        community: ['Speaker, Ostrey County Chamber of Commerce employer breakfasts (fictional)', 'Mentor, Pryor University law school mentoring program (fictional)'],
        email: 'mokafor@example.com',
    },
    {
        slug: 'samuel-whitcomb',
        name: 'Samuel Whitcomb',
        initials: 'SW',
        role: 'Partner',
        practices: ['commercial-real-estate', 'business-formation-contracts'],
        joined: 2014,
        admissions: [
            { court: 'State bar (fictional admission)', year: 2012 },
        ],
        education: ['Law degree, Ostrey State School of Law (fictional), 2012', 'B.A. in geography, Wenlow University (fictional), 2009'],
        focus: 'Commercial leases, purchases, title and closings',
        bio: [
            'Samuel handles the firm’s commercial real estate work: leases for the shops and offices around Court Square, purchases of warehouses and farmland, and the title, survey and zoning questions that come with them.',
            'He studied geography before law, and still reads a survey before he reads the contract. Clients appreciate a due diligence calendar that arrives on the first day and is kept to the last.',
            'He also works with Eleanor Hale on the purchase and sale of small businesses, where the real estate is often most of what is being bought. He became a partner in 2021.',
        ],
        quote: 'Every property comes with a history. My job is to read it before you own it.',
        community: ['Member, county planning commission citizens’ advisory panel (fictional)', 'Coaches the Harrowmere High School mock trial team'],
        email: 'swhitcomb@example.com',
    },
] satisfies Attorney[];

export const attorneyUrl = (slug: string) => `/attorneys/${slug}/`;

export function attorneyBySlug(slug: string): Attorney {
    const attorney = attorneys.find((item) => item.slug === slug);

    if (attorney === undefined) {
        throw new Error(`No attorney '${slug}' in src/data/attorneys.ts.`);
    }

    return attorney;
}
