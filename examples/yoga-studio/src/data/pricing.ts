/**
 * Passes and memberships. Example prices: set the studio's own. They are
 * written here rather than read from the waffle app because they change
 * once a year, not once a week.
 */

export interface Plan {
    name: string;
    price: string;
    per: string;
    note: string;
    includes: string[];
    /** The one to draw the eye to. */
    featured?: boolean;
}

export const introOffer = {
    name: 'Intro offer',
    price: '$40',
    per: 'three weeks, unlimited',
    note: 'For your first visit to the studio. Every class style, as often as you like, for three weeks from your first class.',
};

export const memberships: Plan[] = [
    {
        name: 'Monthly unlimited',
        price: '$135',
        per: 'a month',
        note: 'Rolling, cancel with a month\'s notice.',
        includes: ['Every class on the schedule', 'Members\' rate on workshops', 'Freeze up to two months a year'],
        featured: true,
    },
    {
        name: 'Annual',
        price: '$1,350',
        per: 'a year',
        note: 'Two months free, against monthly.',
        includes: ['Every class on the schedule', 'Members\' rate on workshops and retreats', 'Bring a friend free, once a month'],
    },
    {
        name: 'Twice a week',
        price: '$95',
        per: 'a month',
        note: 'Eight classes a month; unused classes roll over once.',
        includes: ['Any eight classes a month', 'Members\' rate on workshops'],
    },
];

export const passes: Plan[] = [
    { name: 'Drop-in', price: '$24', per: 'one class', note: 'Pay at the desk or ahead by phone.', includes: [] },
    { name: 'Five classes', price: '$105', per: '$21 a class', note: 'Valid for three months.', includes: [] },
    { name: 'Ten classes', price: '$195', per: '$19.50 a class', note: 'Valid for six months; shareable with one other person.', includes: [] },
    { name: 'Prenatal course', price: '$120', per: 'six weeks', note: 'One prenatal class a week, your place kept.', includes: [] },
];

export const concessions = [
    'Students, over-65s and anyone on benefits: 25% off any pass or membership, no questions asked.',
    'Sunday 11 am restorative is pay what you can, from $5.',
    'Mat rental is free. Always.',
];
