/**
 * What customers have said, shown as text and never marked up as reviews
 * (a business marking up its own reviews breaks search engines' rules).
 *
 * These are fictional, written for the example. Replace them with real
 * reviews the customer has agreed you may quote, and say where each came
 * from. Never invent one for a real business.
 */
export interface Review {
    quote: string;
    name: string;
    detail: string;
}

export const reviews: Review[] = [
    {
        quote: 'I came out of a two-hour meeting and my car was parked exactly where I left it, cleaner than the day I bought it. I did not even hear the van.',
        name: 'Priya N.',
        detail: 'Full detail · Northgate',
    },
    {
        quote: 'They measured the paint before they touched it and showed me the readings. My black car finally looks black in the sun, not grey.',
        name: 'Marcus O.',
        detail: 'Paint correction · Cinder Hill',
    },
    {
        quote: 'Two kids, one dog, one very tired SUV. It smells of nothing now, which is the nicest thing a car has ever smelled of.',
        name: 'Hannah L.',
        detail: 'Interior deep clean · Fenwick Park',
    },
    {
        quote: 'They laid a mat under the car and pumped every drop back into the van. Our HOA manager came out to watch and left impressed.',
        name: 'Doug and Elena R.',
        detail: 'Ceramic coating · Brightwater',
    },
];
