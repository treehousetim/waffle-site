/**
 * The services, for the lists that show them all: the home page's sticker
 * sheet, /services/, the appointment form's reasons and the footer. Each
 * service also has its own page, src/pages/services/<slug>.astro, written by
 * hand; the structure test fails if a slug here has no page.
 *
 * `tone` picks the sticker's colour; `plans` says which wellness plans from
 * the waffle app the service's page shows (src/lib/wellness-plans.ts).
 * Urgent care is `calm`: it never wobbles, bounces or tilts.
 */
import type { IconName } from '../components/Icon.astro';
import type { PhotoName } from './photos';
import type { PlanFilter } from '../lib/wellness-plans';

export interface Service {
    slug: string;
    name: string;
    /** One sentence, for a sticker. */
    summary: string;
    icon: IconName;
    photo: PhotoName;
    tone: 'sun' | 'mint' | 'tomato' | 'cream' | 'calm';
    plans: PlanFilter | null;
}

export const services: Service[] = [
    {
        slug: 'wellness-exams-vaccines',
        name: 'Wellness exams & vaccines',
        summary: 'A nose-to-tail check every year, the vaccines your pet actually needs, and time for every question.',
        icon: 'stethoscope',
        photo: 'vetExaminingDachshund',
        tone: 'sun',
        plans: { lifeStage: 'adult' },
    },
    {
        slug: 'dental-care',
        name: 'Dental care',
        summary: 'Cleanings under anaesthetic, dental X-rays and gentle extractions, so mealtimes stop hurting.',
        icon: 'tooth',
        photo: 'vetCheckingTeeth',
        tone: 'mint',
        plans: null,
    },
    {
        slug: 'surgery',
        name: 'Surgery',
        summary: 'Spays, neuters, lump removals and soft-tissue surgery, with a nurse watching every breath.',
        icon: 'bandage',
        photo: 'vetUltrasound',
        tone: 'cream',
        plans: null,
    },
    {
        slug: 'urgent-care',
        name: 'Urgent care',
        summary: 'Same-day appointments held back every day for pets who are sick or hurt and cannot wait.',
        icon: 'firstAid',
        photo: 'whiteCatExam',
        tone: 'calm',
        plans: null,
    },
    {
        slug: 'puppy-kitten-care',
        name: 'Puppy & kitten care',
        summary: 'Vaccine courses, microchips, worming and a lot of treats: the first year, done properly.',
        icon: 'ball',
        photo: 'kittenCheckup',
        tone: 'tomato',
        plans: { lifeStage: 'young' },
    },
    {
        slug: 'senior-pets',
        name: 'Senior pets',
        summary: 'Twice-yearly checks, blood work and pain care that keeps older friends comfortable and curious.',
        icon: 'heart',
        photo: 'seniorLabrador',
        tone: 'mint',
        plans: { lifeStage: 'senior' },
    },
    {
        slug: 'exotic-pets',
        name: 'Exotic pets',
        summary: 'Rabbits, guinea pigs, budgies, tortoises and more, seen by a vet who loves them.',
        icon: 'feather',
        photo: 'rabbit',
        tone: 'sun',
        plans: { species: 'rabbit' },
    },
];

export const serviceUrl = (slug: string) => `/services/${slug}/`;

export function serviceBySlug(slug: string): Service {
    const found = services.find((item) => item.slug === slug);

    if (found === undefined) {
        throw new Error(`No service '${slug}' in src/data/services.ts.`);
    }

    return found;
}
