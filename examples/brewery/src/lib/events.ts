/**
 * What is coming up in the taproom, as the waffle app describes it at
 * /api/site/events. The app sends upcoming events only, soonest first; the
 * site shows them as of the last build (/events/ and the home page).
 *
 * Ways the answer can be wrong, each refused with the field named:
 *   1. Not an object with `events`, or with fields we do not know.
 *   2. An event without an id that is a slug, or two with the same id.
 *   3. A date that is not YYYY-MM-DD, or not a real day (2026-02-30).
 *   4. A time that is not HH:MM, 24-hour (null means all day).
 *   5. A title or description that is empty, too long, or carries markup.
 *   6. A kind this site does not know how to label.
 */
import { date, list, object, oneOf, slug, text, time, unique } from './check';

const WHERE = '/api/site/events';

export const KINDS = ['music', 'trivia', 'release', 'food', 'market', 'class', 'community'] as const;

export type EventKind = (typeof KINDS)[number];

export const kindLabels: Record<EventKind, string> = {
    music: 'Live music',
    trivia: 'Trivia',
    release: 'Beer release',
    food: 'Food',
    market: 'Market',
    class: 'Class',
    community: 'Community',
};

export interface TaproomEvent {
    id: string;
    date: string;
    /** HH:MM, or null for all day. */
    time: string | null;
    title: string;
    description: string;
    kind: EventKind;
}

export function parseEvents(data: unknown): TaproomEvent[] {
    const root = object(data, WHERE, ['events']);
    const events = list(root.events, `${WHERE}.events`, { min: 0, max: 100 }).map((raw, index) => parseEvent(raw, `${WHERE}.events[${index}]`));

    unique(events, (event) => event.id, WHERE, 'events with the id');

    return [...events].sort((a, b) => `${a.date} ${a.time ?? '00:00'}`.localeCompare(`${b.date} ${b.time ?? '00:00'}`));
}

function parseEvent(raw: unknown, where: string): TaproomEvent {
    const event = object(raw, where, ['id', 'date', 'time', 'title', 'description', 'kind']);

    return {
        id: slug(event.id, `${where}.id`),
        date: date(event.date, `${where}.date`),
        time: event.time === null ? null : time(event.time, `${where}.time`),
        title: text(event.title, `${where}.title`, 80),
        description: text(event.description, `${where}.description`, 400),
        kind: oneOf(event.kind, `${where}.kind`, KINDS),
    };
}

/** The parts of an event's date, for the ticket stub: "SAT", "17", "OCT". */
export function dateParts(value: string) {
    const day = new Date(`${value}T12:00:00Z`);
    const part = (options: Intl.DateTimeFormatOptions) => day.toLocaleDateString('en-US', { ...options, timeZone: 'UTC' });

    return { weekday: part({ weekday: 'short' }), day: part({ day: 'numeric' }), month: part({ month: 'short' }), long: part({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) };
}
