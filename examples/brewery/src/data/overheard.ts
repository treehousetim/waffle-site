/**
 * Things people have said at the bar. Fictional, like the brewery: replace
 * them with real words from real customers, with their permission, before
 * launch. Shown as text only, never marked up as reviews (AGENTS.md §4).
 */
export interface Quote {
    text: string;
    who: string;
}

export const overheard: Quote[] = [
    { text: 'I came for one pint after the river clean-up and stayed for the quiz. We came second. We are coming back to win.', who: 'Dana, Wrenford' },
    { text: 'The pilsner tastes like the ones my grandfather talked about. I did not think anyone around here bothered any more.', who: 'Marek, across the river' },
    { text: 'Our dog has a regular table on the loading dock. The bartenders know her name before mine.', who: 'Priya and Biscuit' },
    { text: 'We had our rehearsal dinner in the Pattern Shop. Forty people, one long table, and a keg of saison that did not survive the night.', who: 'Sam and Theo' },
];
