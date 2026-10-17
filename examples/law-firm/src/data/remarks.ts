/**
 * What clients have said, shown as text only: never marked up as reviews
 * (AGENTS.md §4). THESE ARE FICTIONAL, written for the example. A real firm
 * quotes real clients only with their written permission, and checks its
 * state's advertising rules on testimonials first; many require a
 * disclaimer beside them, which the pages carry.
 */
export interface Remark {
    text: string;
    who: string;
    context: string;
}

export const remarks = [
    {
        text: 'They told us what it would cost before they started, and it cost exactly that. For a family business, that alone was worth the drive into town.',
        who: 'A family business owner',
        context: 'Operating agreement and succession plan (fictional)',
    },
    {
        text: 'When my father died I had a folder of papers and no idea where to begin. Mr. Morrow gave me a list, and then he worked through it with me, one line at a time.',
        who: 'An executor',
        context: 'Estate administration (fictional)',
    },
    {
        text: 'We call Margaret before we do anything we are unsure about. It is the best money we spend all year.',
        who: 'An operations manager, 40 employees',
        context: 'Employment advice on retainer (fictional)',
    },
] satisfies Remark[];
