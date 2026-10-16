/**
 * The wellness plans, as the waffle app describes them at
 * GET /api/site/wellness-plans. The practice manager keeps plans and prices
 * in the app; the site shows them as of the last build.
 *
 * Every field is checked before a page renders it: anything unexpected (a
 * missing price, an unknown species, a field the site does not know) fails
 * the build with the endpoint and the field named, rather than shipping a
 * plan card with a blank price.
 *
 * The app's answer, inside the {"success": true, "data": ...} envelope:
 *
 *   {
 *     "updated": "YYYY-MM-DD",
 *     "currency": "USD",
 *     "plans": [{
 *       "id": "dog-adult", "name": "Adult Dog", "species": "dog",
 *       "lifeStage": "adult", "ages": "1 to 7 years",
 *       "monthlyPrice": 3400,            // cents, a whole number
 *       "popular": true,
 *       "inclusions": ["Two exams with a vet a year", ...]
 *     }]
 *   }
 */
import { formatPrice } from '@core/lib/prices.js';

const ENDPOINT = '/api/site/wellness-plans';

export const SPECIES = ['dog', 'cat', 'rabbit'] as const;
export const LIFE_STAGES = ['young', 'adult', 'senior'] as const;

export type Species = (typeof SPECIES)[number];
export type LifeStage = (typeof LIFE_STAGES)[number];

export interface WellnessPlan {
    id: string;
    name: string;
    species: Species;
    lifeStage: LifeStage;
    ages: string;
    /** Cents a month. */
    monthlyPrice: number;
    popular: boolean;
    inclusions: string[];
}

export interface WellnessPlans {
    /** YYYY-MM-DD: when the practice last changed them. */
    updated: string;
    /** ISO 4217, e.g. USD. */
    currency: string;
    plans: WellnessPlan[];
}

/** Which plans a page shows: by species, by life stage, or both. */
export interface PlanFilter {
    species?: Species;
    lifeStage?: LifeStage;
}

const PLAN_FIELDS = ['id', 'name', 'species', 'lifeStage', 'ages', 'monthlyPrice', 'popular', 'inclusions'];
const TOP_FIELDS = ['updated', 'currency', 'plans'];

function fail(field: string, expected: string): never {
    throw new Error(`${ENDPOINT}: ${field}: expected ${expected}.`);
}

function record(value: unknown, field: string, fields: string[]): Record<string, unknown> {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        fail(field, 'an object');
    }

    const object = value as Record<string, unknown>;

    for (const key of Object.keys(object)) {
        if (!fields.includes(key)) {
            fail(`${field}.${key}`, `no such field (the site knows ${fields.join(', ')})`);
        }
    }

    return object;
}

function text(value: unknown, field: string, max: number): string {
    if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
        fail(field, `text of 1 to ${max} characters`);
    }

    return value.trim();
}

function oneOf<T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
    if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
        fail(field, `one of ${allowed.join(', ')}`);
    }

    return value as T;
}

function parsePlan(raw: unknown, field: string): WellnessPlan {
    const plan = record(raw, field, PLAN_FIELDS);
    const id = plan.id;

    if (typeof id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
        fail(`${field}.id`, 'a slug: lowercase letters, digits and dashes');
    }

    const price = plan.monthlyPrice;

    if (typeof price !== 'number' || !Number.isInteger(price) || price <= 0 || price > 1_000_000) {
        fail(`${field}.monthlyPrice`, 'a whole number of cents above 0');
    }

    if (typeof plan.popular !== 'boolean') {
        fail(`${field}.popular`, 'true or false');
    }

    if (!Array.isArray(plan.inclusions) || plan.inclusions.length === 0 || plan.inclusions.length > 12) {
        fail(`${field}.inclusions`, 'a list of 1 to 12 lines');
    }

    return {
        id,
        name: text(plan.name, `${field}.name`, 40),
        species: oneOf(plan.species, `${field}.species`, SPECIES),
        lifeStage: oneOf(plan.lifeStage, `${field}.lifeStage`, LIFE_STAGES),
        ages: text(plan.ages, `${field}.ages`, 40),
        monthlyPrice: price,
        popular: plan.popular,
        inclusions: plan.inclusions.map((line, index) => text(line, `${field}.inclusions[${index}]`, 80)),
    };
}

/** Checks the app's answer and returns the plans, or throws naming the field. */
export function parseWellnessPlans(data: unknown): WellnessPlans {
    const top = record(data, 'data', TOP_FIELDS);
    const updated = top.updated;

    if (typeof updated !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(updated) || Number.isNaN(Date.parse(updated))) {
        fail('updated', 'a date, YYYY-MM-DD');
    }

    const currency = top.currency;

    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) {
        fail('currency', 'an ISO 4217 code such as USD');
    }

    if (!Array.isArray(top.plans) || top.plans.length === 0) {
        fail('plans', 'a non-empty list');
    }

    const plans = top.plans.map((raw, index) => parsePlan(raw, `plans[${index}]`));
    const seen = new Set<string>();

    for (const plan of plans) {
        const slot = `${plan.species}/${plan.lifeStage}`;

        if (seen.has(plan.id) || seen.has(slot)) {
            fail('plans', `one plan per id and per species and life stage (twice: ${seen.has(plan.id) ? plan.id : slot})`);
        }

        seen.add(plan.id);
        seen.add(slot);
    }

    return { updated, currency, plans };
}

/** The plans a filter picks, youngest first within each species. */
export function plansFor(all: WellnessPlans, filter: PlanFilter): WellnessPlan[] {
    return all.plans
        .filter((plan) => (filter.species === undefined || plan.species === filter.species) && (filter.lifeStage === undefined || plan.lifeStage === filter.lifeStage))
        .sort((a, b) => SPECIES.indexOf(a.species) - SPECIES.indexOf(b.species) || LIFE_STAGES.indexOf(a.lifeStage) - LIFE_STAGES.indexOf(b.lifeStage));
}

/** The species that have plans, in a fixed order, with their cheapest monthly price. */
export function speciesSummary(all: WellnessPlans): { species: Species; from: number; count: number }[] {
    return SPECIES.map((species) => {
        const own = all.plans.filter((plan) => plan.species === species);

        return { species, from: Math.min(...own.map((plan) => plan.monthlyPrice)), count: own.length };
    }).filter((entry) => entry.count > 0);
}

/** "$34" a month, for people. */
export const monthly = (plan: Pick<WellnessPlan, 'monthlyPrice'>, currency: string) => formatPrice(plan.monthlyPrice, currency);

export const speciesNames: Record<Species, { one: string; many: string }> = {
    dog: { one: 'Dog', many: 'Dogs' },
    cat: { one: 'Cat', many: 'Cats' },
    rabbit: { one: 'Rabbit', many: 'Rabbits' },
};

/** What each life stage is called for each species. */
export function stageName(species: Species, stage: LifeStage): string {
    if (stage === 'young') {
        return { dog: 'Puppy', cat: 'Kitten', rabbit: 'Young rabbit' }[species];
    }

    return stage === 'adult' ? 'Adult' : 'Senior';
}

/** The date, for people: "October 1, 2026". */
export const updatedOn = (all: WellnessPlans) =>
    new Date(all.updated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
