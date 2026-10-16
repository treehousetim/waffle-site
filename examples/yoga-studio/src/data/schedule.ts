/**
 * The week's schedule, from the waffle app, checked and matched to the
 * class and teacher pages. waffle.get() fetches the endpoint once per build
 * however many pages ask (docs/waffle-api.md).
 */
import { waffle } from '@core/settings';
import { ENDPOINT, parseSchedule, resolveSchedule, type Schedule } from '../lib/schedule';
import { classes } from './classes';
import { teachers } from './teachers';

export async function loadSchedule(): Promise<Schedule> {
    return resolveSchedule(
        parseSchedule(await waffle.get(ENDPOINT)),
        classes.map((item) => item.slug),
        teachers.map((teacher) => teacher.slug),
    );
}
