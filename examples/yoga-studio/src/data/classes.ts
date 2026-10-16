/**
 * The class styles the studio teaches. Each has its own page at
 * /classes/<slug>/ (src/pages/classes/[slug].astro), and the waffle app's
 * schedule names classes by these slugs: a slug the app uses that is not
 * here fails the build (src/lib/schedule.ts, resolveSchedule).
 */
import type { PhotoName } from './photos';

export interface ClassStyle {
    slug: string;
    name: string;
    /** The page's <title>, under ~50 characters. */
    title: string;
    /** The page's meta description, 50-160 characters. */
    description: string;
    /** A few words, on cards and in the schedule. */
    line: string;
    /** The page's opening paragraph. */
    lead: string;
    /** How it moves: one to three, slow to strong. */
    pace: 1 | 2 | 3;
    paceLabel: string;
    photo: PhotoName;
    /** Paragraphs about the practice. */
    about: string[];
    /** A class, from the door to the end. */
    arc: { label: string; text: string }[];
    goodFor: string[];
    bring: string;
    faqs: { question: string; answer: string }[];
}

export const classes: ClassStyle[] = [
    {
        slug: 'vinyasa',
        name: 'Vinyasa',
        title: 'Vinyasa flow classes',
        description: 'Vinyasa flow at Still Water Yoga in Alderwick: breath-led sequences that build warmth and strength, then slow right down. Morning, lunch and evening.',
        line: 'Breath-led flow that warms, then settles',
        lead: 'One breath, one movement. Our vinyasa classes build a steady warmth through linked sequences, then come all the way down to stillness before you leave.',
        pace: 3,
        paceLabel: 'Flowing',
        photo: 'vinyasaFlow',
        about: [
            'Vinyasa means placing something in a special way. In practice it is a class where movement follows the breath: you reach up as you inhale, fold as you exhale, and the poses are linked into sequences rather than held one at a time.',
            'Our vinyasa is unhurried for a flow class. Teachers repeat a sequence enough times that you can stop reading the room and start feeling it, and every class spends its last fifteen minutes on the floor. Strength comes, quietly, from showing up.',
            'Early classes are a little brisker, to wake you up; evening classes are slower and longer, with more time in hips and hamstrings after a day of sitting.',
        ],
        arc: [
            { label: 'Arrive', text: 'A few minutes lying down while the room fills and the river does its thing outside.' },
            { label: 'Warm', text: 'Gentle spinal movement and sun salutations, slow at first, finding the breath.' },
            { label: 'Flow', text: 'A standing sequence built over three or four rounds: lunges, twists, balances.' },
            { label: 'Settle', text: 'Floor work, a long hold or two, and a full rest at the end. Nobody rushes out.' },
        ],
        goodFor: [
            'People who like to move and want to sweat a little',
            'Runners, cyclists and paddlers who need the mobility',
            'Anyone who finds stillness easier after effort',
        ],
        bring: 'Comfortable clothes you can move in and a water bottle. Mats, blocks and straps are here.',
        faqs: [
            { question: 'Do I need to know the poses?', answer: 'It helps to have done a few classes. If you have not, start with Beginners or the Monday lunchtime 45, where teachers name every shape.' },
            { question: 'Is the room heated?', answer: 'No. The studio is kept comfortably warm, never hot. You build your own heat.' },
            { question: 'What does "some experience" mean on the schedule?', answer: 'Those classes include arm balances and a longer flow. If you have practised regularly for a few months, you are ready.' },
        ],
    },
    {
        slug: 'yin',
        name: 'Yin',
        title: 'Yin yoga classes',
        description: 'Yin yoga in Alderwick: long, quiet floor-based holds for hips, spine and a busy mind. Props for everyone, no experience needed. Evenings and weekends.',
        line: 'Long, quiet holds on the floor',
        lead: 'Yin asks very little of your muscles and a lot of your patience. Poses are held on the floor for three to five minutes, supported by props, while the deeper tissues slowly let go.',
        pace: 1,
        paceLabel: 'Slow',
        photo: 'yinPose',
        about: [
            'Most movement works the muscles. Yin works the connective tissue around the joints, which responds to gentle, sustained load rather than effort. That is why the poses are held for minutes, and why you are asked to soften rather than push.',
            'A yin class has perhaps eight poses in it. Between them you lie still and notice what has changed. Many people find the stillness harder than the stretching at first. That is the practice.',
            'Teachers talk a little during the holds: about the breath, about where to soften, sometimes a short reading. Then the room is quiet again, apart from the water under the floor.',
        ],
        arc: [
            { label: 'Arrive', text: 'Gather two blocks, a bolster and a blanket. You will use all of them.' },
            { label: 'Settle', text: 'A few minutes of breath on your back to bring the day down a notch.' },
            { label: 'Hold', text: 'Six to eight floor poses, each three to five minutes, with a rebound between.' },
            { label: 'Rest', text: 'A long final rest, a blanket over you, the lights low.' },
        ],
        goodFor: [
            'Tight hips, a stiff lower back, long days at a desk',
            'Anyone who wants to practise slowing down',
            'Balancing a strong practice, a training block or a hard week',
        ],
        bring: 'Warm layers and socks: you will cool down while you are still. Everything else is here.',
        faqs: [
            { question: 'Is yin the same as restorative?', answer: 'They look alike from the doorway. In yin there is a gentle stretch you stay with; in restorative the props hold you so completely that there is no stretch at all.' },
            { question: 'Should it hurt?', answer: 'No. A dull, spreading sensation is the aim. Sharp, hot or pinching sensation means come out a little, and the teacher will help you prop it differently.' },
            { question: 'I cannot sit still. Is it for me?', answer: 'Probably more than anyone. Everyone fidgets at first. By the third or fourth class most people notice the minutes go quicker.' },
        ],
    },
    {
        slug: 'restorative',
        name: 'Restorative',
        title: 'Restorative yoga classes',
        description: 'Restorative yoga at Still Water: fully supported rest on bolsters and blankets to calm the nervous system. Gentle, candlelit on Fridays, open to every body.',
        line: 'Supported rest, nothing to achieve',
        lead: 'Five or six poses in an hour and a quarter, every one held up by bolsters, blankets and blocks. Restorative is the closest thing to being put to bed that a yoga class can offer.',
        pace: 1,
        paceLabel: 'Still',
        photo: 'restorativeRest',
        about: [
            'In a restorative class nothing is stretched or strengthened on purpose. The props are arranged so that every part of you is supported, and then you stay, often for ten minutes or more, while your breathing slows by itself.',
            'It is the class we recommend most often to people recovering from illness or injury, people going through a hard time, and people who simply have not rested in a while. It is also, quietly, the class our strongest students never miss.',
            'Friday evening restorative is candlelit and runs for ninety minutes. Bring nothing but yourself; we have more blankets than anyone could need.',
        ],
        arc: [
            { label: 'Arrive', text: 'The teacher helps you build your first shape. Take the time it takes.' },
            { label: 'Land', text: 'A few minutes of breath and a body scan to arrive properly.' },
            { label: 'Rest', text: 'Five or six fully supported poses, each held for eight to twelve minutes.' },
            { label: 'Return', text: 'A slow, gentle return to sitting, and tea afterwards for anyone who wants it.' },
        ],
        goodFor: [
            'Stress, poor sleep and a mind that will not switch off',
            'Recovery after illness, injury or a hard season',
            'Anyone at all; nobody is not flexible enough for this',
        ],
        bring: 'Warm, loose clothes and socks. An eye pillow if you have a favourite; we have spares.',
        faqs: [
            { question: 'Will I fall asleep?', answer: 'Some people do, and that is fine. The teacher will make sure you are awake before the end.' },
            { question: 'Can I come with an injury?', answer: 'Usually, yes. Tell the teacher before class and they will prop around it. If you are in acute pain or have just had surgery, check with your doctor first.' },
            { question: 'Why are Friday classes longer?', answer: 'It is the end of the week and nobody is in a rush. Ninety minutes gives each pose the time it really wants.' },
        ],
    },
    {
        slug: 'prenatal',
        name: 'Prenatal',
        title: 'Prenatal yoga classes',
        description: 'Prenatal yoga in Alderwick with a doula-trained teacher: gentle movement, breathing for labour and a calm hour among other parents-to-be. From 14 weeks.',
        line: 'Gentle practice for pregnancy, from 14 weeks',
        lead: 'An hour for you and the baby: gentle movement for a changing body, breathing you can take into labour, and a room full of people who know exactly how you feel.',
        pace: 2,
        paceLabel: 'Gentle',
        photo: 'prenatalYoga',
        about: [
            'Prenatal classes are taught by Hana Mori, who is a trained doula as well as a yoga teacher. Every pose is chosen for pregnancy: room for the belly, support for the pelvis, and nothing lying flat on the back after the first trimester.',
            'Classes run from fourteen weeks until whenever you feel ready to stop, which for many people is the week the baby comes. Each one ends with breathing practices and positions that are useful in labour, and a long rest on your side.',
            'There is always ten minutes at the start for everyone to say how they are. Friendships made in this room tend to carry on into the baby years.',
        ],
        arc: [
            { label: 'Arrive', text: 'A circle on cushions: weeks, names, how this week has been.' },
            { label: 'Move', text: 'Gentle standing and kneeling work for the hips, back and legs.' },
            { label: 'Breathe', text: 'Breath practices and positions for labour, practised together.' },
            { label: 'Rest', text: 'A long side-lying rest, propped exactly how you need it.' },
        ],
        goodFor: [
            'Anyone pregnant, from fourteen weeks, with or without yoga experience',
            'Back, hip and pelvic discomfort in pregnancy',
            'Meeting other people due around the same time',
        ],
        bring: 'Water, a snack if you get hungry, and your midwife or doctor\'s go-ahead if your pregnancy is complicated.',
        faqs: [
            { question: 'When can I start?', answer: 'From fourteen weeks. If you practised yoga before pregnancy and want to keep going earlier, talk to Hana first.' },
            { question: 'Is there a course, or do I drop in?', answer: 'Both. Drop in to any prenatal class on a pass, or take the six-week course, which saves a little and keeps your place.' },
            { question: 'Can my partner come?', answer: 'Once a season Hana teaches a Saturday partners workshop on breath, touch and positions for labour. Check workshops and retreats for the next one.' },
        ],
    },
    {
        slug: 'beginners',
        name: 'Beginners',
        title: 'Yoga for beginners',
        description: 'Beginners yoga in Alderwick: small, slow classes where every pose is named, shown and adapted. The best first step, and part of the $40 intro offer.',
        line: 'The basics, slowly, with time for questions',
        lead: 'If you have never done yoga, or not for years, start here. Small classes, every pose shown and named, plenty of props and plenty of time to ask questions.',
        pace: 2,
        paceLabel: 'Steady',
        photo: 'beginnersClass',
        about: [
            'Beginners classes are capped at twelve so the teacher can get to everyone. Each week focuses on one family of poses (standing, seated, twists, rest) and builds on the last, so by the end of a month you will recognise most of what comes up in any class here.',
            'Nothing is assumed. You will learn where to put your mat, what the blocks are for, how to come out of a pose as well as into it, and how to breathe while you do it. Questions are welcome during class, not just after.',
            'Most people take beginners classes for four to six weeks and then start mixing in vinyasa, yin and restorative. Some never stop coming, and that is fine too.',
        ],
        arc: [
            { label: 'Arrive', text: 'A hello from the teacher, who will ask about anything you need them to know.' },
            { label: 'Learn', text: 'The week\'s poses, broken down and shown, with options for every body.' },
            { label: 'Practise', text: 'A short, simple sequence putting those poses together.' },
            { label: 'Rest', text: 'Ten minutes of rest at the end, which many people say is the best part.' },
        ],
        goodFor: [
            'Complete beginners, and people returning after a long break',
            'Anyone who feels stiff, unfit or unsure; that is everyone at first',
            'Older bodies, bigger bodies, healing bodies',
        ],
        bring: 'Clothes you can move in. Bare feet on the mat; mats and props are here.',
        faqs: [
            { question: 'I am not flexible. Can I still come?', answer: 'Yes. Flexibility is something yoga gives you, not something you need to begin. Blocks bring the floor closer.' },
            { question: 'Do I have to start at week one?', answer: 'No. Each week stands on its own, so start whenever suits you. The cycle repeats every four weeks.' },
            { question: 'How does the intro offer work?', answer: 'Three weeks of unlimited classes for $40, including every beginners class. Claim it on the new students page and come to any class.' },
        ],
    },
];

export const classUrl = (slug: string) => `/classes/${slug}/`;

export const classBySlug = (slug: string) => {
    const found = classes.find((item) => item.slug === slug);

    if (found === undefined) {
        throw new Error(`No class style '${slug}' in src/data/classes.ts.`);
    }

    return found;
};
