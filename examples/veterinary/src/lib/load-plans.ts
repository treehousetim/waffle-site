/**
 * The wellness plans for a page, read from the waffle app while the site
 * builds (fixtures in development) and checked by parseWellnessPlans. The
 * waffle client fetches the path once per build however many pages ask.
 */
import { waffle } from '@core/settings';
import { parseWellnessPlans, type WellnessPlans } from './wellness-plans';

export async function loadWellnessPlans(): Promise<WellnessPlans> {
    return parseWellnessPlans(await waffle.get('/api/site/wellness-plans'));
}
