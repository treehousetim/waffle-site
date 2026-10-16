/**
 * The vets, nurses and front desk, for /team/ and the home page. Every
 * person here is invented, and so are their pets: the photos are of the
 * pets (Unsplash stand-ins), never of a person given a made-up name.
 *
 * Replace with the real team, with each person's permission, and photos of
 * their own animals (or of them, if they would rather).
 */
import type { PhotoName } from './photos';

export interface TeamMember {
    name: string;
    role: string;
    group: 'vets' | 'nurses' | 'front';
    /** Letters after the name, if any. */
    credentials?: string;
    bio: string;
    /** Ask them about: what they light up talking about. */
    askMe: string;
    pet: { name: string; kind: string; photo: PhotoName };
}

export const team: TeamMember[] = [
    {
        name: 'Dr. Imogen Achebe',
        role: 'Founder and lead vet',
        group: 'vets',
        credentials: 'DVM',
        bio: 'Opened Paws & Whiskers in 2011 in a former bakery on Kettle Lane. Still sees patients four days a week and still keeps biscuits in every coat pocket.',
        askMe: 'Itchy skin and allergies',
        pet: { name: 'Mochi', kind: 'a pug with opinions', photo: 'pug' },
    },
    {
        name: 'Dr. Tomás Whitfield',
        role: 'Vet and surgeon',
        group: 'vets',
        credentials: 'DVM',
        bio: 'Does most of our surgery and all of our bad puns. Spends Saturdays coaching a junior football team who have never once listened to him.',
        askMe: 'What happens on surgery day',
        pet: { name: 'Barnaby', kind: 'a scruffy rescue terrier', photo: 'beardedDog' },
    },
    {
        name: 'Dr. Priya Nandakumar',
        role: 'Vet with a special interest in exotics',
        group: 'vets',
        credentials: 'BVSc',
        bio: 'Sees our rabbits, guinea pigs, birds and reptiles, and has a tortoise who is older than the building. Fluent in the quiet language of prey animals.',
        askMe: 'Rabbit teeth and tortoise winters',
        pet: { name: 'Kiwi', kind: 'a very chatty budgie', photo: 'budgie' },
    },
    {
        name: 'Hal Brightwater',
        role: 'Head nurse',
        group: 'nurses',
        credentials: 'CVT',
        bio: 'Runs the wards, the anaesthetic monitoring and the treat drawer. The calmest pair of hands in Bramblewick for a nervous cat.',
        askMe: 'Getting a cat into a carrier',
        pet: { name: 'Ziggy', kind: 'a cat who wears it well', photo: 'catSunglasses' },
    },
    {
        name: 'Juniper Okafor',
        role: 'Veterinary nurse',
        group: 'nurses',
        credentials: 'CVT',
        bio: 'Runs our puppy and kitten clinics and the nurse weigh-in mornings. Will happily spend twenty minutes teaching your puppy to love the scales.',
        askMe: 'Puppy socialising',
        pet: { name: 'Pip', kind: 'a corgi who is mostly ears', photo: 'puppyOrange' },
    },
    {
        name: 'Mags Pemberton',
        role: 'Front desk and practice manager',
        group: 'front',
        bio: 'The voice on the phone, the keeper of the calendar and the person who remembers every patient’s name (and most owners’).',
        askMe: 'Wellness plans and insurance claims',
        pet: { name: 'Cloud', kind: 'a Samoyed who sheds for two', photo: 'samoyed' },
    },
];
