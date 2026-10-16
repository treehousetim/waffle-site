/**
 * What neighbours say, shown as handwritten notes pinned to the board.
 * Fictional, like the bakery; shown as text and never marked up as reviews
 * (a business marking up its own reviews breaks search engines' rules).
 * Replace them with real ones, quoted with permission.
 */
export interface Note {
    text: string;
    who: string;
}

export const notes: Note[] = [
    { text: 'We plan our Saturday around the porridge loaf. Get there before ten or it’s gone.', who: 'Rosa, Cooper’s Row' },
    { text: 'Priya made our wedding cake with figs from my aunt’s tree. People still talk about it.', who: 'Danny & Mei, Ashcombe' },
    { text: 'The only place my kids will eat rye bread. I don’t ask questions.', who: 'Owen, Fallow Bridge' },
    { text: 'The chai is worth the walk in February. Twice.', who: 'Bea, Millrace' },
];
