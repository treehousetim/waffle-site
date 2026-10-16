/**
 * The rooms that can be hired, for /private-hire/ and the private event
 * form's choices. `id` is what the form sends to the waffle app, so change
 * it there too if you change it here.
 */
import type { PhotoName } from './photos';

export interface Space {
    id: string;
    name: string;
    capacity: string;
    seated: number;
    standing: number;
    summary: string;
    details: string[];
    photo: PhotoName;
}

export const spaces: Space[] = [
    {
        id: 'pattern-shop',
        name: 'The Pattern Shop',
        capacity: 'Up to 40',
        seated: 32,
        standing: 40,
        summary: 'The room where the foundry’s wooden patterns were carved, now a private bar with its own four taps and a long oak table.',
        details: ['Its own bar and bartender', 'Long oak table, or cocktail rounds', 'Screen and speaker for toasts and slides', 'Door to the loading dock'],
        photo: 'hopTasters',
    },
    {
        id: 'loading-dock',
        name: 'The Loading Dock',
        capacity: 'Up to 60',
        seated: 44,
        standing: 60,
        summary: 'Our covered riverside patio, under the old crane rail, with heaters for the cold months and string lights for the long evenings.',
        details: ['Covered, heated, open-sided', 'Views over the Tamsen River', 'Food trucks park alongside', 'Dogs welcome'],
        photo: 'cheers',
    },
    {
        id: 'foundry-floor',
        name: 'The Foundry Floor',
        capacity: 'Up to 150',
        seated: 110,
        standing: 150,
        summary: 'The whole taproom, under the steel trusses and the gantry, beside the tanks. For weddings, launches and the big birthdays.',
        details: ['The whole taproom and all twelve taps', 'Stage and sound system', 'Brewhouse tours for your guests', 'Monday and Tuesday, or after 8pm Sunday'],
        photo: 'taproomTanks',
    },
];

/** What the form offers as the kind of event, value first. */
export const eventTypes = [
    ['birthday', 'Birthday'],
    ['work', 'Work party or team night'],
    ['rehearsal', 'Rehearsal dinner'],
    ['wedding', 'Wedding or reception'],
    ['fundraiser', 'Fundraiser or club night'],
    ['group-tour', 'Group tour and tasting'],
    ['other', 'Something else'],
] as const;
