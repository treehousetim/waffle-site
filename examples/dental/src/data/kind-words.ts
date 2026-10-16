/**
 * Kind words from patients, shown as text only: never marked up as reviews
 * (a business marking up reviews of itself breaks search engines' rules).
 * Fictional, for the example. Replace with real patients' words, quoted with
 * their permission, and say where each came from.
 */
export interface KindWord {
    quote: string;
    name: string;
    detail: string;
}

export const kindWords: KindWord[] = [
    {
        quote: 'I hadn’t been to a dentist in eleven years. Dr. Whitlock showed me everything on a screen before she touched a thing, and I actually laughed in the chair. Who knew.',
        name: 'Marisol',
        detail: 'Patient since 2023',
    },
    {
        quote: 'Our four-year-old now asks when she can go back and “drive the chair”. That is all I need to say about Dr. Marchetti.',
        name: 'Ben and Ayesha',
        detail: 'Parents of two patients',
    },
    {
        quote: 'Cracked a tooth on a Saturday-morning bagel, called at nine on Monday, sorted by eleven. They even remembered my dog’s name.',
        name: 'Gordon',
        detail: 'Emergency visit, then stayed',
    },
    {
        quote: 'Dr. Castellano told me my teeth were fine and I didn’t need the aligners I came in for. Honest dentists are rarer than straight teeth.',
        name: 'Priyanka',
        detail: 'Patient since 2021',
    },
];
