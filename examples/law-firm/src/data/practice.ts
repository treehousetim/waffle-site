/**
 * The firm's four practice areas, in the order the site lists them. Each
 * has its page in src/pages/practice/<slug>.astro (the structure test checks),
 * built on layouts/PracticePage.astro from the entry here.
 */
import type { PhotoName } from './photos';

export interface Practice {
    slug: string;
    /** The section numeral the site sets it under: I, II, III, IV. */
    numeral: string;
    name: string;
    /** Under ten words, for the table of contents. */
    short: string;
    /** One or two sentences: who it is for and what it covers. */
    summary: string;
    photo: PhotoName;
    /** The matters it covers, each with a line on what that means. */
    matters: { title: string; text: string }[];
    /** How it is usually billed (the fees page has the detail). */
    fees: string;
    /** The attorneys who lead it, by slug (src/data/attorneys.ts). */
    attorneys: string[];
    /** The Insights tag whose posts it lists. */
    tag: string;
    faq: { question: string; answer: string }[];
}

export const practices = [
    {
        slug: 'business-formation-contracts',
        numeral: 'I',
        name: 'Business formation & contracts',
        short: 'Entities, agreements and the paperwork of growing',
        summary:
            'For owners starting, buying or reorganizing a business: the right entity, an operating or shareholder agreement that fits the people in it, and contracts that say what everyone thinks they say.',
        photo: 'brickStorefront',
        matters: [
            { title: 'Choosing and forming the entity', text: 'LLC, corporation or partnership, chosen with your accountant, and formed with the state.' },
            { title: 'Operating and shareholder agreements', text: 'Who decides, who pays in, and what happens when an owner leaves, dies or wants out.' },
            { title: 'Customer and vendor contracts', text: 'Terms of service, supply agreements and the one-page contract your sales team will actually use.' },
            { title: 'Buying or selling a small business', text: 'Letters of intent, due diligence, the purchase agreement and the closing.' },
            { title: 'Succession and partner exits', text: 'Buy-sell agreements, valuations and a plan for the day the founder steps back.' },
        ],
        fees: 'Formation packages and most contracts at a flat fee quoted in writing; negotiations and transactions hourly, with an estimate.',
        attorneys: ['eleanor-hale', 'samuel-whitcomb'],
        tag: 'Business',
        faq: [
            { question: 'Do I need a lawyer to form an LLC?', answer: 'The state will accept the filing without one. What a lawyer adds is the operating agreement, the tax conversation with your accountant and the decisions about ownership that are expensive to undo later.' },
            { question: 'Can you review a contract someone else wrote?', answer: 'Yes, and it is most of what we do. We return a marked-up copy with a short memo on what matters and what does not, usually within five working days, for a flat fee agreed beforehand.' },
            { question: 'We already have a business. Is it too late to fix the paperwork?', answer: 'Rarely. Many of our clients come to us five or ten years in. We start by reading what exists and tell you plainly what is worth fixing.' },
        ],
    },
    {
        slug: 'estate-planning-probate',
        numeral: 'II',
        name: 'Estate planning & probate',
        short: 'Wills, trusts and settling an estate',
        summary:
            'For families who want their wishes written down properly, and for executors and heirs who have been handed an estate to settle: wills, trusts, powers of attorney and probate administration.',
        photo: 'fountainPenLetter',
        matters: [
            { title: 'Wills and revocable trusts', text: 'Which one you need, and why many families need both.' },
            { title: 'Powers of attorney and health care directives', text: 'The documents that matter while you are alive, and are most often missing.' },
            { title: 'Planning for a family business or farm', text: 'Keeping it running, and keeping the peace, when ownership passes.' },
            { title: 'Probate and estate administration', text: 'Guiding executors through the court, the inventory, creditors and the final accounting.' },
            { title: 'Special needs and blended families', text: 'Trusts that protect benefits, and plans that are fair to everyone at the table.' },
        ],
        fees: 'Estate plans at a flat fee for the whole plan, including signing; probate hourly, or a flat fee for simpler estates.',
        attorneys: ['daniel-morrow', 'eleanor-hale'],
        tag: 'Estate planning',
        faq: [
            { question: 'How long does an estate plan take?', answer: 'Usually three to five weeks from the first meeting to signing: a meeting to listen, a draft to review at home, a call to adjust it, and a signing meeting with witnesses and a notary.' },
            { question: 'Do we have to come to the office to sign?', answer: 'Signing needs witnesses and a notary, so most clients come to Court Square. For clients who cannot travel, we arrange a signing at home or in a care facility.' },
            { question: 'I have been named executor. What do I do first?', answer: 'Find the original will, secure the house and any valuables, and do not pay debts or distribute anything yet. Then call us; the first meeting about an estate is often the most useful hour of the whole process.' },
        ],
    },
    {
        slug: 'employment-law',
        numeral: 'III',
        name: 'Employment law',
        short: 'Advice for employers, before the dispute',
        summary:
            'For small employers who would rather get it right than defend it later: hiring, handbooks, classification, discipline and terminations, and a calm second opinion when an employee relationship goes wrong.',
        photo: 'caseFiles',
        matters: [
            { title: 'Handbooks and policies', text: 'Written for your business, in language your managers will follow.' },
            { title: 'Employee or contractor', text: 'Getting classification right before an audit or a claim does it for you.' },
            { title: 'Offer letters and restrictive covenants', text: 'Confidentiality, non-solicitation and what a court will actually enforce.' },
            { title: 'Discipline and termination', text: 'Advice before the hard conversation, and the documents for after it.' },
            { title: 'Agency charges and demand letters', text: 'Responding to a complaint, a charge or a lawyer’s letter, and resolving it where we can.' },
        ],
        fees: 'Handbooks and agreements at a flat fee; advice hourly, or on a modest monthly retainer for employers who call often.',
        attorneys: ['margaret-okafor'],
        tag: 'Employment',
        faq: [
            { question: 'Do you represent employees?', answer: 'Our employment practice advises employers. If you are an employee with a claim, we will tell you so at the first call and, where we can, point you to a lawyer who represents employees.' },
            { question: 'Is a handbook really necessary for a business of twelve people?', answer: 'Not a long one. A short, accurate handbook is one of the cheapest protections a small employer can buy; a long, copied one can do more harm than none.' },
            { question: 'An employee has hired a lawyer. Should I respond?', answer: 'Not yourself, and not yet. Keep every document, say nothing to the employee about the dispute, and call us the same day.' },
        ],
    },
    {
        slug: 'commercial-real-estate',
        numeral: 'IV',
        name: 'Commercial real estate',
        short: 'Leases, purchases, title and closings',
        summary:
            'For businesses and investors buying, selling, leasing or financing commercial property: the purchase contract, due diligence, title and survey, the lease, and the closing.',
        photo: 'keysAtDoor',
        matters: [
            { title: 'Commercial leases', text: 'For tenants and landlords: rent, repairs, renewal, assignment and what happens if the business fails.' },
            { title: 'Purchases and sales', text: 'Contracts, contingencies and a due diligence calendar that is actually kept.' },
            { title: 'Title, survey and zoning', text: 'Reading the title commitment and the survey, and asking the county the right questions.' },
            { title: 'Financing and closings', text: 'Reviewing loan documents and running the closing so nothing surprises you at the table.' },
            { title: 'Easements and boundary questions', text: 'Shared driveways, access rights and the fence that is not where the deed says.' },
        ],
        fees: 'Lease reviews at a flat fee by lease length; purchases at a flat fee by price band, with hourly work only for disputes.',
        attorneys: ['samuel-whitcomb', 'eleanor-hale'],
        tag: 'Real estate',
        faq: [
            { question: 'Do I need a lawyer for a commercial lease?', answer: 'A commercial lease has none of the protections of a residential one, and it often runs five or ten years. A review costs a fraction of one month’s rent on most leases we see.' },
            { question: 'When should I call you about a purchase?', answer: 'Before you sign the purchase contract, not after. The contract sets the deadlines for everything else, and the best time to shape it is before it binds you.' },
            { question: 'Do you handle residential closings?', answer: 'Only for existing clients, and only alongside their other work with us. For a home purchase on its own, a residential settlement firm is usually the better and cheaper choice.' },
        ],
    },
] satisfies Practice[];

export const practiceUrl = (slug: string) => `/practice/${slug}/`;

export function practiceBySlug(slug: string): Practice {
    const practice = practices.find((item) => item.slug === slug);

    if (practice === undefined) {
        throw new Error(`No practice area '${slug}' in src/data/practice.ts.`);
    }

    return practice;
}
