/**
 * Workshops (an afternoon) and retreats (a few days away). Example events,
 * with invented dates and places. Past events drop off the page by
 * themselves at the next build (src/pages/workshops.astro).
 */
import type { PhotoName } from './photos';

export interface Gathering {
    slug: string;
    kind: 'Workshop' | 'Course' | 'Retreat';
    name: string;
    /** YYYY-MM-DD, the first day. */
    date: string;
    /** As people say it: "Saturday 2–5 pm", "Friday to Sunday". */
    when: string;
    where: string;
    price: string;
    teacher: string;
    text: string;
    photo?: PhotoName;
}

export const gatherings: Gathering[] = [
    {
        slug: 'slow-saturday',
        kind: 'Workshop',
        name: 'Slow Saturday: yin and sound',
        date: '2026-11-07',
        when: 'Saturday, 2–4:30 pm',
        where: 'The studio',
        price: '$45 · members $35',
        teacher: 'iris-okonkwo',
        text: 'Two and a half hours of long yin holds with live singing bowls and the river for company. Tea and something sweet afterwards.',
    },
    {
        slug: 'breath-course',
        kind: 'Course',
        name: 'Breath: a three-week course',
        date: '2026-11-12',
        when: 'Thursdays, 7:30–8:45 pm, three weeks',
        where: 'The studio',
        price: '$90 · members $70',
        teacher: 'nell-ashby',
        text: 'Simple breathing practices for sleep, nerves and focus, learned slowly and practised together. No yoga experience needed.',
    },
    {
        slug: 'partners-birth',
        kind: 'Workshop',
        name: 'Birth partners workshop',
        date: '2026-11-21',
        when: 'Saturday, 1–4 pm',
        where: 'The studio',
        price: '$80 per couple',
        teacher: 'hana-mori',
        text: 'For pregnant people and whoever will be with them in labour: breath, touch, positions and what to say (and not).',
    },
    {
        slug: 'solstice-restorative',
        kind: 'Workshop',
        name: 'Winter solstice by candlelight',
        date: '2026-12-21',
        when: 'Monday, 7–9 pm',
        where: 'The studio',
        price: '$35 · members $25',
        teacher: 'iris-okonkwo',
        text: 'The longest night of the year, spent lying very still under blankets in a room full of candles. A short reading, then silence.',
    },
    {
        slug: 'weekend-on-the-alder',
        kind: 'Retreat',
        name: 'A weekend on the Alder',
        date: '2027-04-16',
        when: 'Friday evening to Sunday afternoon',
        where: 'Hollins Bend Lodge, 20 minutes upriver',
        price: 'From $420, shared room, all meals',
        teacher: 'maya-lindqvist',
        text: 'Morning vinyasa on the deck, afternoons free for walking and paddling, yin before supper. Two nights in a timber lodge on the water.',
        photo: 'retreatForest',
    },
    {
        slug: 'five-days-in-the-hills',
        kind: 'Retreat',
        name: 'Five days in the hills',
        date: '2027-06-14',
        when: 'Monday to Friday',
        where: 'Cedar Fold, in the hills above Alderwick',
        price: 'From $1,150, single room, all meals',
        teacher: 'maya-lindqvist',
        text: 'A small group, a long table and two practices a day: vinyasa in the morning, restorative at dusk. Time to read, sleep and do very little.',
        photo: 'stonesWater',
    },
];

/** "2026-11-07" -> "November 7, 2026". */
export const longDate = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Day and month, short, for a date stamp: ["7", "Nov"]. */
export const dateStamp = (iso: string) => {
    const date = new Date(`${iso}T12:00:00Z`);

    return [String(date.getUTCDate()), date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })];
};
