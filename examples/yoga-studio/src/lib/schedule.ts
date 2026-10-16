/**
 * The weekly timetable, as the waffle app describes it at
 * /api/site/schedule (docs/waffle-api.md). The front desk keeps the
 * timetable in the app; the site shows it as of the last build.
 *
 * Everything is checked here before a page renders it. A field in the wrong
 * shape fails the build with the field and the endpoint named, rather than
 * shipping a schedule with a blank time or a class nobody can find. A class
 * style or teacher the site has no page for fails it too: the app and
 * src/data/ must agree on the slugs (resolveSchedule).
 *
 * The answer's `data`:
 *
 *   {
 *     "updated": "YYYY-MM-DD",
 *     "classes": [
 *       { "day": "monday", "start": "07:00", "duration": 60, "style": "vinyasa",
 *         "teacher": "maya-lindqvist", "level": "all", "spacesLeft": 6 }
 *     ]
 *   }
 */

export const ENDPOINT = '/api/site/schedule';

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type Day = (typeof DAYS)[number];

/** Who a class is pitched at, and how the site says so. */
export const LEVELS = {
    beginner: 'Beginners',
    all: 'All levels',
    gentle: 'Gentle',
    intermediate: 'Some experience',
} as const;
export type Level = keyof typeof LEVELS;

export interface ScheduledClass {
    day: Day;
    /** 24-hour "HH:MM", studio time. */
    start: string;
    /** Minutes. */
    duration: number;
    /** A slug from src/data/classes.ts. */
    style: string;
    /** A slug from src/data/teachers.ts. */
    teacher: string;
    level: Level;
    /** 0 means the class is full. */
    spacesLeft: number;
}

export interface Schedule {
    /** YYYY-MM-DD: when the desk last changed the timetable. */
    updated: string;
    classes: ScheduledClass[];
}

const FIELDS = ['day', 'start', 'duration', 'style', 'teacher', 'level', 'spacesLeft'];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(where: string, problem: string): never {
    throw new Error(`${ENDPOINT}: ${where}: ${problem}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Checks every field of the app's answer, and refuses anything else. */
export function parseSchedule(data: unknown): Schedule {
    if (!isRecord(data)) {
        fail('data', 'expected {"updated": "YYYY-MM-DD", "classes": [...]}.');
    }

    for (const key of Object.keys(data)) {
        if (key !== 'updated' && key !== 'classes') {
            fail(`data.${key}`, 'is not a field this site knows.');
        }
    }

    const { updated, classes } = data;

    if (typeof updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(updated) || Number.isNaN(Date.parse(updated))) {
        fail('data.updated', 'expected a date, YYYY-MM-DD.');
    }

    if (!Array.isArray(classes) || classes.length === 0) {
        fail('data.classes', 'expected a non-empty list.');
    }

    const parsed = classes.map((raw, index) => parseClass(raw, `data.classes[${index}]`));
    const seen = new Set<string>();

    for (const [index, item] of parsed.entries()) {
        const key = `${item.day} ${item.start} ${item.style}`;

        if (seen.has(key)) {
            fail(`data.classes[${index}]`, `two classes are listed as ${key}.`);
        }

        seen.add(key);
    }

    return {
        updated,
        classes: parsed.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start)),
    };
}

function parseClass(raw: unknown, where: string): ScheduledClass {
    if (!isRecord(raw)) {
        fail(where, 'expected an object.');
    }

    for (const key of Object.keys(raw)) {
        if (!FIELDS.includes(key)) {
            fail(`${where}.${key}`, 'is not a field this site knows.');
        }
    }

    const { day, start, duration, style, teacher, level, spacesLeft } = raw;

    if (typeof day !== 'string' || !(DAYS as readonly string[]).includes(day)) {
        fail(`${where}.day`, `expected one of ${DAYS.join(', ')}.`);
    }

    if (typeof start !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(start)) {
        fail(`${where}.start`, 'expected a 24-hour time, HH:MM.');
    }

    if (typeof duration !== 'number' || !Number.isInteger(duration) || duration < 15 || duration > 240) {
        fail(`${where}.duration`, 'expected whole minutes, 15 to 240.');
    }

    if (typeof style !== 'string' || !SLUG.test(style)) {
        fail(`${where}.style`, 'expected a class style slug.');
    }

    if (typeof teacher !== 'string' || !SLUG.test(teacher)) {
        fail(`${where}.teacher`, 'expected a teacher slug.');
    }

    if (typeof level !== 'string' || !(level in LEVELS)) {
        fail(`${where}.level`, `expected one of ${Object.keys(LEVELS).join(', ')}.`);
    }

    if (typeof spacesLeft !== 'number' || !Number.isInteger(spacesLeft) || spacesLeft < 0 || spacesLeft > 200) {
        fail(`${where}.spacesLeft`, 'expected a whole number of spaces, 0 or more.');
    }

    return { day: day as Day, start, duration, style, teacher, level: level as Level, spacesLeft };
}

/**
 * Fails the build when the app lists a class style or teacher the site has
 * no page for: every class on the schedule links to both.
 */
export function resolveSchedule(schedule: Schedule, styles: readonly string[], teachers: readonly string[]): Schedule {
    for (const [index, item] of schedule.classes.entries()) {
        if (!styles.includes(item.style)) {
            fail(`data.classes[${index}].style`, `'${item.style}' has no page in src/data/classes.ts.`);
        }

        if (!teachers.includes(item.teacher)) {
            fail(`data.classes[${index}].teacher`, `'${item.teacher}' has no page in src/data/teachers.ts.`);
        }
    }

    return schedule;
}

/** "07:00" + 75 -> "08:15". */
export function endTime(start: string, duration: number): string {
    const [hours = 0, minutes = 0] = start.split(':').map(Number);
    const total = hours * 60 + minutes + duration;

    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** "18:30" -> "6:30 pm", the way the desk says it. */
export function clock(time: string): string {
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    const suffix = hours < 12 ? 'am' : 'pm';
    const twelve = hours % 12 === 0 ? 12 : hours % 12;

    return `${twelve}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export const dayName = (day: Day) => day.charAt(0).toUpperCase() + day.slice(1);

/** The space left in a class, said plainly. */
export function spacesLabel(spacesLeft: number): string {
    if (spacesLeft === 0) {
        return 'Full, waitlist open';
    }

    return spacesLeft === 1 ? '1 space left' : `${spacesLeft} spaces left`;
}

/** The week in day order, each day with its classes (possibly none). */
export function byDay(classes: readonly ScheduledClass[]): { day: Day; classes: ScheduledClass[] }[] {
    return DAYS.map((day) => ({ day, classes: classes.filter((item) => item.day === day) }));
}
