/**
 * The teachers. Each has a page at /teachers/<slug>/; the waffle app's
 * schedule names a class's teacher by these slugs, and a slug the app uses
 * that is not here fails the build (src/lib/schedule.ts, resolveSchedule).
 *
 * Example people: invented names and stories, with Unsplash photographs
 * standing in. Replace them with the real teachers, their own words and
 * their own photographs.
 */
import type { PhotoName } from './photos';

export interface Teacher {
    slug: string;
    name: string;
    /** Short, beside the name. */
    role: string;
    /** The page's meta description, 50-160 characters. */
    description: string;
    /** Class style slugs, the ones they teach most. */
    styles: string[];
    teachingSince: number;
    photo: PhotoName;
    /** In their own words, one sentence. */
    quote: string;
    bio: string[];
    training: string[];
    offTheMat: string;
}

export const teachers: Teacher[] = [
    {
        slug: 'maya-lindqvist',
        name: 'Maya Lindqvist',
        role: 'Founder · vinyasa and yin',
        description: 'Maya Lindqvist founded Still Water Yoga in 2016. She teaches early-morning vinyasa and evening yin, and leads the studio\'s riverside retreats.',
        styles: ['vinyasa', 'yin'],
        teachingSince: 2009,
        photo: 'teacherMaya',
        quote: 'I want people to leave a little slower than they arrived.',
        bio: [
            'Maya came to yoga as a rower with a bad back, and stayed because it was the only hour of the week she was not in a hurry. She trained in vinyasa in 2009 and in yin a few years later, after a long winter of injury taught her what slowing down was for.',
            'She opened Still Water in the old boathouse in 2016, with eleven mats, a borrowed sound system and a lot of help from friends. She still teaches the six forty-five on Mondays, Wednesdays and Fridays, and still sweeps the floor after.',
            'Her classes are known for long, patient sequences, very precise cues and a final rest that nobody wants to end.',
        ],
        training: ['500-hour vinyasa teacher training', 'Yin yoga teacher training, 100 hours', 'Anatomy for movement teachers, 60 hours'],
        offTheMat: 'Still rows, badly, most Sunday mornings when the river is flat.',
    },
    {
        slug: 'tomas-reyes',
        name: 'Tomas Reyes',
        role: 'Vinyasa and beginners',
        description: 'Tomas Reyes teaches lunchtime and evening vinyasa and Thursday beginners at Still Water Yoga. Clear, warm, practical teaching with a sense of humour.',
        styles: ['vinyasa', 'beginners'],
        teachingSince: 2015,
        photo: 'teacherTomas',
        quote: 'The best pose is the one you can still breathe in.',
        bio: [
            'Tomas found yoga through physical therapy after a cycling accident, and spent the first year mostly lying on the floor. He says that year taught him more about teaching than any training since.',
            'He teaches the lunchtime 45s for people who have exactly an hour away from their desk, the Friday evening flow, and Thursday beginners, where his patience for questions is famous.',
            'His classes are strong but never showy, with plenty of options, plenty of laughter, and always a few minutes for the hips.',
        ],
        training: ['200-hour vinyasa teacher training', 'Yoga for back care, 30 hours', 'Trauma-informed teaching, 20 hours'],
        offTheMat: 'Rides the river path to the studio in every weather, and grows too many tomatoes.',
    },
    {
        slug: 'iris-okonkwo',
        name: 'Iris Okonkwo',
        role: 'Restorative and yin',
        description: 'Iris Okonkwo teaches restorative and yin at Still Water Yoga, including the candlelit Friday restorative. Calm, careful, a genius with a bolster.',
        styles: ['restorative', 'yin'],
        teachingSince: 2012,
        photo: 'teacherIris',
        quote: 'Rest is not a reward for finishing. It is part of the work.',
        bio: [
            'Iris worked for ten years as a hospice nurse, and came to restorative yoga looking for a way to rest that she could actually manage. She trained as a teacher so she could share it with colleagues.',
            'She teaches restorative and yin through the week, including the ninety-minute candlelit restorative on Friday evenings, which has had a waitlist since the week it began.',
            'Her classes are quiet, with very few words and exactly the right ones. She can make anyone comfortable on the floor, and will keep adjusting a blanket until you are.',
        ],
        training: ['Restorative yoga teacher training, 100 hours', 'Yin yoga teacher training, 50 hours', 'Registered nurse, retired'],
        offTheMat: 'Bakes bread on Sundays and reads poetry out loud to anyone who will sit still.',
    },
    {
        slug: 'hana-mori',
        name: 'Hana Mori',
        role: 'Prenatal and restorative',
        description: 'Hana Mori, a doula and yoga teacher, leads prenatal yoga and the six-week prenatal course at Still Water Yoga, plus weekday and Sunday restorative.',
        styles: ['prenatal', 'restorative'],
        teachingSince: 2014,
        photo: 'teacherHana',
        quote: 'Pregnancy asks you to listen. The mat is a good place to practise.',
        bio: [
            'Hana has been a birth doula for over a decade and a prenatal yoga teacher for nearly as long. She has supported more births than she can count and still cries at most of them.',
            'She teaches every prenatal class at the studio, the six-week prenatal course and the seasonal partners workshop, plus restorative on Wednesday mornings and Sunday afternoons.',
            'Her teaching is practical and kind: what will help your back this week, how to breathe through a long contraction, how to rest when sleep is hard to come by.',
        ],
        training: ['Prenatal yoga teacher training, 85 hours', 'Certified birth doula', '200-hour hatha teacher training'],
        offTheMat: 'Mother of two, keeper of a very old cat, swimmer in the river every summer.',
    },
    {
        slug: 'nell-ashby',
        name: 'Nell Ashby',
        role: 'Beginners, yin and meditation',
        description: 'Nell Ashby teaches beginners yoga, yin and the Sunday long yin at Still Water Yoga, with a background in mindfulness meditation and a gift for plain words.',
        styles: ['beginners', 'yin'],
        teachingSince: 2018,
        photo: 'teacherNell',
        quote: 'You do not have to be good at this. You only have to be here.',
        bio: [
            'Nell was a secondary school teacher for twelve years before training in yoga and mindfulness, and it shows: she can explain anything simply, and nobody leaves her class confused.',
            'She teaches most of the beginners classes, Wednesday evening yin and the Sunday ninety-minute yin, which ends with a short sitting meditation for anyone who wants to stay.',
            'Her classes are steady, clear and very welcoming. If it is your first time on a mat, she is the person we hope you meet.',
        ],
        training: ['200-hour hatha teacher training', 'Mindfulness-based stress reduction teacher', 'Yin yoga teacher training, 50 hours'],
        offTheMat: 'Walks the river path every morning and knows the name of every heron on it.',
    },
];

export const teacherUrl = (slug: string) => `/teachers/${slug}/`;

export const teacherBySlug = (slug: string) => {
    const found = teachers.find((teacher) => teacher.slug === slug);

    if (found === undefined) {
        throw new Error(`No teacher '${slug}' in src/data/teachers.ts.`);
    }

    return found;
};
