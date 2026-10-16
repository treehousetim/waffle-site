/**
 * The dentists, one page each at /team/<slug>/ (src/pages/team/[slug].astro
 * builds them from this list). Fictional people: the photographs are of
 * Unsplash models, credited on /credits/. Replace every word with the real
 * team's own, and their own photographs, before launch; never invent a
 * qualification for a real person.
 */
import type { PhotoName } from './photos';

export interface Dentist {
    slug: string;
    name: string;
    /** Letters after the name, as the dentist writes them. */
    credentials: string;
    role: string;
    photo: PhotoName;
    /** One sentence, for a card. */
    summary: string;
    /** The page's paragraphs, in the dentist's own voice where it says "I". */
    bio: string[];
    /** Treatments (slugs in src/data/treatments.ts) they see most patients for. */
    treatments: string[];
    /** A few true, human details. */
    facts: { label: string; value: string }[];
    /** What they would say to a nervous patient: one or two sentences. */
    promise: string;
    languages: string[];
    /** Days they see patients. */
    days: string;
    /** For the page's description: 50-160 characters. */
    description: string;
}

export const team: Dentist[] = [
    {
        slug: 'hannah-whitlock',
        name: 'Dr. Hannah Whitlock',
        credentials: 'DMD',
        role: 'Founder and family dentist',
        photo: 'drWhitlock',
        summary: 'Opened Brightside in 2011 to be the dentist she wished she had had as an anxious teenager.',
        bio: [
            'Hannah grew up two streets from Honeysuckle Lane and was, in her own words, “the kid who hid in the car park” before every dental visit. A patient, funny dentist changed that, and she has been trying to be that dentist ever since.',
            'She trained in dentistry and then spent five years in a busy city practice before coming home to open Brightside. Most of her days are check-ups, fillings and long conversations with nervous adults who have not seen a dentist in years.',
            'She is the one who wrote the “raise your hand and we stop” rule on the wall of every room, and she still checks that everyone follows it.',
        ],
        treatments: ['checkups-and-cleanings', 'whitening', 'emergency-dental-care'],
        facts: [
            { label: 'At Brightside since', value: 'The first day, 2011' },
            { label: 'Quietly good at', value: 'Explaining x-rays with a coffee cup and a biscuit' },
            { label: 'Outside work', value: 'Sea swimming, all year, badly' },
        ],
        promise: 'Nothing happens until you understand it and say yes. If you want to stop, you raise a hand and we stop. Every time.',
        languages: ['English'],
        days: 'Monday to Thursday',
        description: 'Meet Dr. Hannah Whitlock, the founder of Brightside Family Dental: a family dentist with a soft spot for nervous patients.',
    },
    {
        slug: 'sofia-marchetti',
        name: 'Dr. Sofia Marchetti',
        credentials: 'DDS',
        role: 'Children’s dentist',
        photo: 'drMarchetti',
        summary: 'Sees most of our youngest patients, and knows the name of every cuddly toy that comes along.',
        bio: [
            'Sofia has a gift for turning a first visit into something a three-year-old talks about for a week, for the right reasons. She counts teeth out loud, lets children work the chair, and never says “this won’t hurt”.',
            'Before joining Brightside in 2016 she worked in a community clinic for families without a regular dentist. She still runs our free “first tooth” mornings for parents and toddlers every other Saturday.',
            'She sees adults too, and many of the parents who came in with their children have stayed with her.',
        ],
        treatments: ['childrens-dentistry', 'checkups-and-cleanings'],
        facts: [
            { label: 'At Brightside since', value: '2016' },
            { label: 'Signature move', value: 'The “tooth counting song”, in two languages' },
            { label: 'Outside work', value: 'Restoring an old canal boat, slowly' },
        ],
        promise: 'Children are allowed to be nervous here, and so are their grown-ups. We go at the pace of whoever is most worried.',
        languages: ['English', 'Italian', 'Spanish'],
        days: 'Tuesday to Saturday',
        description: 'Meet Dr. Sofia Marchetti, Brightside’s children’s dentist: gentle first visits, sealants and check-ups from the very first tooth.',
    },
    {
        slug: 'peter-lindqvist',
        name: 'Dr. Peter Lindqvist',
        credentials: 'DMD',
        role: 'Implants and restorative dentistry',
        photo: 'drLindqvist',
        summary: 'Plans implants, crowns and bridges with patience, a 3D scan and a lot of drawings on napkins.',
        bio: [
            'Peter spent the first part of his career on hospital dental teams before deciding he wanted to see the same people for years, not once. He joined Brightside in 2014 and looks after most of our implant and crown patients.',
            'He is careful by nature. Every implant plan starts with a long appointment that is mostly talking: what you want, what your mouth will allow, and the choices that are not an implant at all.',
            'Patients say he is the calmest person they have ever met. His colleagues say he simply has never been seen to hurry.',
        ],
        treatments: ['implants', 'emergency-dental-care', 'checkups-and-cleanings'],
        facts: [
            { label: 'At Brightside since', value: '2014' },
            { label: 'Always has', value: 'A pencil behind his ear and a model of your jaw' },
            { label: 'Outside work', value: 'Cross-country skiing and very strong coffee' },
        ],
        promise: 'You will see the whole plan, every step and every cost, before we begin. Changing your mind is always allowed.',
        languages: ['English', 'Swedish'],
        days: 'Monday, Wednesday and Friday',
        description: 'Meet Dr. Peter Lindqvist, who plans implants, crowns and bridges at Brightside Family Dental with patience and a lot of explaining.',
    },
    {
        slug: 'rafael-castellano',
        name: 'Dr. Rafael Castellano',
        credentials: 'DDS',
        role: 'Clear aligners and cosmetic dentistry',
        photo: 'drCastellano',
        summary: 'Straightens and brightens smiles, and talks people out of treatment they do not need.',
        bio: [
            'Rafael moved to Thistlewood in 2019 and brought our 3D scanner with him: no more trays of putty for aligner patients. He looks after clear aligners, whitening and the small cosmetic changes that make people smile with their mouth open again.',
            'He is honest about what is worth doing. A good share of his consultations end with “honestly, your teeth are fine”, and he is proud of that.',
            'On Wednesday evenings he runs our late clinic, so aligner check-ins fit around school and work.',
        ],
        treatments: ['clear-aligners', 'whitening', 'checkups-and-cleanings'],
        facts: [
            { label: 'At Brightside since', value: '2019' },
            { label: 'Proudest of', value: 'Talking a bride out of veneers she did not need' },
            { label: 'Outside work', value: 'Coaching under-9s football, loudly' },
        ],
        promise: 'I will show you your scan, tell you what I would do if it were my own mouth, and never rush you into deciding.',
        languages: ['English', 'Portuguese', 'Spanish'],
        days: 'Tuesday to Friday, Wednesday evenings',
        description: 'Meet Dr. Rafael Castellano, who looks after clear aligners, whitening and gentle cosmetic dentistry at Brightside Family Dental.',
    },
];

export const dentistUrl = (slug: string) => `/team/${slug}/`;
