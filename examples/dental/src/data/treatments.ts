/**
 * The treatments, for the lists that show them all: the home page,
 * /treatments/, the booking form's reasons and the footer. Each also has its
 * own page, src/pages/treatments/<slug>.astro, written by hand; the structure
 * test fails if a slug here has no page.
 *
 * `procedureType` is schema.org's MedicalProcedureType for the treatment's
 * structured data; the pages describe what happens in general terms only and
 * make no promise about results (a dentist decides what suits a patient).
 */
import type { IconName } from '../components/Icon.astro';
import type { PhotoName } from './photos';

export interface Treatment {
    slug: string;
    name: string;
    /** One sentence, for a card. */
    summary: string;
    icon: IconName;
    photo: PhotoName;
    /** How long a typical appointment takes, in words. */
    time: string;
    /** The soft colour its card and page wear. */
    tone: 'mint' | 'coral' | 'butter';
    procedureType: 'NoninvasiveProcedure' | 'SurgicalProcedure';
}

export const treatments: Treatment[] = [
    {
        slug: 'checkups-and-cleanings',
        name: 'Check-ups & cleanings',
        summary: 'An unhurried look at your teeth and gums, a gentle clean, and a plain-English chat about what we saw.',
        icon: 'tooth',
        photo: 'checkUpMirror',
        time: 'About 45 minutes',
        tone: 'mint',
        procedureType: 'NoninvasiveProcedure',
    },
    {
        slug: 'childrens-dentistry',
        name: 'Children’s dentistry',
        summary: 'Happy first visits, ride-in-the-chair check-ups and sealants, from the first tooth to the teenage years.',
        icon: 'balloon',
        photo: 'boyCheckUp',
        time: 'About 30 minutes',
        tone: 'butter',
        procedureType: 'NoninvasiveProcedure',
    },
    {
        slug: 'whitening',
        name: 'Teeth whitening',
        summary: 'Custom trays you wear at home, or one longer visit in the chair, after a check that whitening suits you.',
        icon: 'sparkle',
        photo: 'womanSmiling',
        time: 'Two short visits',
        tone: 'coral',
        procedureType: 'NoninvasiveProcedure',
    },
    {
        slug: 'clear-aligners',
        name: 'Clear aligners',
        summary: 'Nearly invisible trays that move teeth a little at a time, planned on a 3D scan instead of goopy impressions.',
        icon: 'aligner',
        photo: 'clearAligners',
        time: 'Check-ins every 6–10 weeks',
        tone: 'mint',
        procedureType: 'NoninvasiveProcedure',
    },
    {
        slug: 'implants',
        name: 'Dental implants',
        summary: 'A steady, natural-looking replacement for a missing tooth, planned carefully and placed in stages.',
        icon: 'implant',
        photo: 'implantModel',
        time: 'A few visits over several months',
        tone: 'butter',
        procedureType: 'SurgicalProcedure',
    },
    {
        slug: 'emergency-dental-care',
        name: 'Emergency dental care',
        summary: 'Toothache, a broken tooth or a knocked-out one: call first thing and we keep same-day slots for you.',
        icon: 'heart',
        photo: 'toothache',
        time: 'Same day, when you call by 10 am',
        tone: 'coral',
        procedureType: 'NoninvasiveProcedure',
    },
];

export const treatmentUrl = (slug: string) => `/treatments/${slug}/`;
