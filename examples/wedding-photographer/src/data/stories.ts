/**
 * The stories: one wedding, elopement or portrait day each, told as a
 * gallery with captions. Each has its page at /stories/<slug>/
 * (src/pages/stories/[slug].astro) with ImageGallery structured data, and
 * appears in its category's portfolio page.
 *
 * Every couple, family and venue here is invented, and the photographs are
 * Unsplash stand-ins (src/data/photos.ts). A real studio replaces them with
 * its own stories, published with each couple's permission.
 *
 * Adding a story: add it here, then give its slug a view-transition-name in
 * src/styles/motion.css ("Story photos morph"), so its card's photograph
 * becomes its page's hero.
 */
import type { PhotoName } from './photos';

export type CategorySlug = 'weddings' | 'elopements' | 'portraits';

export interface Frame {
    photo: PhotoName;
    /** Printed under the photograph, like a magazine caption. */
    caption: string;
    /** How the spread lays it out: across the page, a wide plate, or a tall one beside the next. */
    layout: 'bleed' | 'wide' | 'tall';
}

export interface Story {
    slug: string;
    /** Who it is about, as they would write it. */
    names: string;
    /** The headline: under 40 characters, so the title fits a search result. */
    title: string;
    category: CategorySlug;
    place: string;
    /** ISO date of the day itself. */
    date: string;
    guests: number | null;
    /** The package they booked, as the packages page names it. */
    booked: string;
    /** For search results and cards: 50-160 characters. */
    summary: string;
    /** The story, in paragraphs, in the photographers' voice. */
    text: string[];
    /** A line from the couple or family (fictional). */
    quote: { text: string; by: string };
    /** The first frame is the hero and the card's picture. */
    frames: Frame[];
}

export const stories = [
    {
        slug: 'ines-and-callum',
        names: 'Ines & Callum',
        title: 'Sea stacks to the redwoods',
        category: 'elopements',
        place: 'Gull Rock Beach, Hallow Point and the Cathedral Grove',
        date: '2026-05-16',
        guests: 2,
        booked: 'The Elopement Weekend',
        summary: 'A two-day elopement for two: vows at low tide below the sea stacks, sunrise on the ridge, and a quiet walk through the redwoods the morning after.',
        text: [
            'Ines and Callum wrote to us in January with one line that we still have pinned above the desk: "We want it to feel like a long walk, not a production." No guests, no schedule beyond the tides, and no reason to rush.',
            'We met them on Gull Rock Beach an hour before sunset, when the haze softens the sea stacks into layers of grey. They read their vows to each other with their shoes in their hands. Then we walked the headland trail as the cove turned turquoise below us, and nobody looked at a watch.',
            'At five the next morning we drove up to Hallow Point for first light on the ridge, and finished in the Cathedral Grove, where the redwoods make the whole world quiet. Two days, three places, one very long walk.',
        ],
        quote: { text: 'It never once felt like being photographed. It felt like being accompanied.', by: 'Ines' },
        frames: [
            { photo: 'coastSeaStacksWalk', caption: 'Low tide at Gull Rock, the evening of the vows. The haze did most of the work.', layout: 'bleed' },
            { photo: 'coastHeadlandEmbrace', caption: 'The headland trail, twenty minutes after. The cove goes this colour for about a quarter of an hour.', layout: 'wide' },
            { photo: 'ridgeSunrise', caption: 'Hallow Point, 5:52 a.m. Callum chose the suit for this exact light.', layout: 'wide' },
            { photo: 'redwoodsMist', caption: 'The Cathedral Grove. We stood well back: the trees are the guests here.', layout: 'wide' },
            { photo: 'redwoodsBoardwalk', caption: 'The last frame of the weekend, on the boardwalk out.', layout: 'bleed' },
        ],
    },
    {
        slug: 'margot-and-dev',
        names: 'Margot & Dev',
        title: 'A long summer day at Ashcombe House',
        category: 'weddings',
        place: 'Ashcombe House, Calder Ridge',
        date: '2026-07-11',
        guests: 140,
        booked: 'The Full Day',
        summary: 'Margot and Dev’s wedding at Ashcombe House: 140 guests, a lawn full of petals, a candlelit supper under the vines and a dance floor that never emptied.',
        text: [
            'Ashcombe House is all honey-coloured stone and lawns that run to the tree line, and Margot and Dev filled every inch of it. Dev’s family flew in from three continents; Margot’s grandmother made the first toast and the last speech.',
            'We worked as a pair, as we always do on a full day. Theo stayed with the ceremony and the families while Juniper slipped away with the two of them for ten minutes on the lawn, before the light went from white to gold. Petals everywhere, nobody posing.',
            'Supper was laid under a canopy of greenery with more candles than we could count. Then the band started, the lights came on, and the dance floor filled and stayed full until the last song at midnight.',
        ],
        quote: { text: 'We have watched the slideshow more times than we have watched the wedding video. That says it all.', by: 'Dev' },
        frames: [
            { photo: 'estateLawnKiss', caption: 'The east lawn, four in the afternoon. The petals were a flower girl’s idea.', layout: 'tall' },
            { photo: 'estateLawnRun', caption: 'Margot asked for one photograph of them running. We took eleven.', layout: 'tall' },
            { photo: 'receptionTable', caption: 'Supper under the vines, set by the Ashcombe team before the guests came in.', layout: 'bleed' },
            { photo: 'firstDance', caption: 'Eleven-forty. The band played the first song again by request.', layout: 'wide' },
        ],
    },
    {
        slug: 'saoirse-and-jun',
        names: 'Saoirse & Jun',
        title: 'Golden hour in Wrenmouth',
        category: 'weddings',
        place: 'The Old Net Loft, Wrenmouth',
        date: '2026-09-05',
        guests: 38,
        booked: 'The Gathering',
        summary: 'A small harbour wedding for 38 in Wrenmouth: handwritten vows, supper in an old net loft, and a walk through the village lanes as the sun went down.',
        text: [
            'Saoirse and Jun wanted a wedding small enough to talk to everyone, and they got it: 38 guests in the Old Net Loft above Wrenmouth harbour, long tables, a fiddle player and a cake from the bakery across the lane.',
            'They wrote their vows by hand the week before and left them on the windowsill with the rings while they dressed. We photographed both before anyone else was up, which is our favourite quiet hour of any wedding day.',
            'After supper we stole them for twenty minutes. The sun drops behind the hill above the harbour in September, and for a few minutes everything in Wrenmouth turns the colour of honey. They walked, we followed, and that was that.',
        ],
        quote: { text: 'You found the light in our village that we had walked past for years.', by: 'Saoirse' },
        frames: [
            { photo: 'goldenLane', caption: 'Harbour Lane, 7:20 p.m. Jun is still carrying the bouquet; nobody asked him to.', layout: 'bleed' },
            { photo: 'ringsOnVows', caption: 'The vows and the rings on the windowsill, eight in the morning.', layout: 'tall' },
            { photo: 'goldenHands', caption: 'The hill above the harbour, in the tall grass.', layout: 'tall' },
            { photo: 'goldenSilhouette', caption: 'The last of the sun, from the bottom of the hill.', layout: 'wide' },
        ],
    },
    {
        slug: 'autumn-sittings',
        names: 'The Harlow family, and Rosa & Ben',
        title: 'Autumn sittings at Calder Orchard',
        category: 'portraits',
        place: 'Calder Orchard and the old mill wall',
        date: '2026-10-03',
        guests: null,
        booked: 'The Sitting',
        summary: 'One October day, two portrait sittings: three generations of the Harlow family waiting for a new baby, and Rosa and Ben marking twenty years together.',
        text: [
            'Every October we keep one Saturday at Calder Orchard for portraits, when the trees turn and the light comes in low across the grass. This year it held two sittings, and they could not have been more different.',
            'The Harlows came in the morning, all eleven of them, three generations waiting for the newest one. There is no posing a family that size; we asked them to stand closer, and then closer again, and let them laugh at each other until it was right.',
            'In the afternoon Rosa and Ben walked down to the old mill wall to mark twenty years together. They had not been photographed as a couple since their wedding. They talked, we listened, and we only spoke to say "stay there".',
        ],
        quote: { text: 'Twenty years, and these are the first pictures of us we actually like.', by: 'Rosa' },
        frames: [
            { photo: 'familyOrchardLaughing', caption: 'The Harlows, three generations and one on the way.', layout: 'bleed' },
            { photo: 'familyOrchardWalk', caption: 'The youngest Harlows, in front, as negotiated.', layout: 'tall' },
            { photo: 'anniversaryRoad', caption: 'Rosa and Ben at the old mill wall. She was laughing at something he did not mean to be funny.', layout: 'wide' },
            { photo: 'anniversarySunset', caption: 'Twenty years, in the last light of the afternoon.', layout: 'wide' },
        ],
    },
] satisfies Story[];

export type StorySlug = (typeof stories)[number]['slug'];

export const storyUrl = (slug: string) => `/stories/${slug}/`;

/** The portfolio's three rooms. Each has its page at /portfolio/<slug>/. */
export const categories = [
    {
        slug: 'weddings',
        name: 'Weddings',
        line: 'The whole day, from the quiet hour before to the last song.',
        summary: 'Wedding photography on the Saltgrass Coast: whole days told as picture stories, from getting ready to the last dance, by a two-photographer team.',
        cover: 'estateLawnRun',
        text: [
            'We photograph about twenty weddings a year, always the two of us, so that one of us can be with the families while the other is with the two of you. We plan the day with you around the light, not a shot list.',
            'What you get is the story of the day as it happened: the nerves, the people who travelled, the speeches, the dancing, and a few quiet minutes alone together in the best light of the afternoon.',
        ],
    },
    {
        slug: 'elopements',
        name: 'Elopements',
        line: 'Just the two of you, somewhere that matters, for as long as it takes.',
        summary: 'Elopement photography on the Saltgrass Coast and in the hills: small, unhurried days for two, planned around tides, trails and the best light.',
        cover: 'coastHeadlandEmbrace',
        text: [
            'An elopement is not a smaller wedding. It is a different kind of day: unhurried, built around a place and a time of day rather than a guest list. We help you choose both, and we know this coast well enough to say when the cove turns turquoise.',
            'We plan permits, tides, trails and backup spots with you, then come along quietly. Most elopements run four to eight hours; some run over two days.',
        ],
    },
    {
        slug: 'portraits',
        name: 'Portraits',
        line: 'Families, couples, anniversaries and the people you want to remember.',
        summary: 'Portrait sittings at Calder Orchard and along the coast: families, couples, anniversaries and engagements, in natural light, relaxed and unposed.',
        cover: 'familyOrchardWalk',
        text: [
            'Portrait sittings are an hour and a half, outdoors, in the last light of the day. We bring a blanket, a few prompts and a great deal of patience with small children and dogs.',
            'Engagements, anniversaries, new babies, three generations together for once: whatever the reason, the aim is the same. Pictures of you that look like you on a good day.',
        ],
    },
] as const satisfies readonly { slug: CategorySlug; name: string; line: string; summary: string; cover: PhotoName; text: string[] }[];

export const categoryUrl = (slug: CategorySlug) => `/portfolio/${slug}/`;

export const storiesIn = (slug: CategorySlug) => stories.filter((story) => story.category === slug);

/** "May 16, 2026": how a person reads a date. */
export const longDate = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
