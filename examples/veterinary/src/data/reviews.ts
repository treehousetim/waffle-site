/**
 * What clients say, shown as text. Invented for the example: replace with
 * real reviews quoted with permission, and never mark them up as structured
 * data (a business marking up its own reviews breaks search engines' rules).
 */
export interface Review {
    quote: string;
    name: string;
    pet: string;
}

export const reviews: Review[] = [
    {
        quote: 'Biscuit used to shake in the car park. Now she drags me through the door because she knows Hal has the good treats.',
        name: 'Rosa M.',
        pet: 'Biscuit, beagle',
    },
    {
        quote: 'They saw our rabbit the same afternoon I called, explained gut stasis on a whiteboard, and phoned that evening to check on her.',
        name: 'Daniel K.',
        pet: 'Clover, lionhead rabbit',
    },
    {
        quote: 'Clear prices before anything happened, and a vet who sat on the floor with our old boy for his last few checkups. We will not go anywhere else.',
        name: 'The Abernathy family',
        pet: 'Duke, labrador, 14',
    },
    {
        quote: 'The puppy plan paid for itself by month four. The nurse clinics alone are worth it for first-time owners like us.',
        name: 'Sam & Lee',
        pet: 'Noodle, cockapoo',
    },
];
