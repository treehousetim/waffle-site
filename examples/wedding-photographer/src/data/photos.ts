/**
 * Every photograph on the site, with its alt text and its credit, in one
 * place. Pages ask for a photo by name; the build resizes it, converts it to
 * AVIF and WebP and gives it a width, a height and a srcset
 * (src/components/Photo.astro).
 *
 * The example photos are from Unsplash, free under the Unsplash License
 * (https://unsplash.com/license); attribution is not required but is given
 * on /credits/ and in each story's structured data. They are NOT covered by
 * this repository's MIT licence, and they are not Juniper & Vale's work:
 * a real studio's site shows its own photographs and nothing else
 * (PLAYBOOK.md, "The work").
 *
 * Alt text says what the photo shows, for people who cannot see it.
 */
import type { ImageMetadata } from 'astro';
import coastSeaStacksWalk from '../assets/photos/coast-sea-stacks-walk.jpg';
import coastHeadlandEmbrace from '../assets/photos/coast-headland-embrace.jpg';
import ridgeSunrise from '../assets/photos/ridge-sunrise.jpg';
import redwoodsMist from '../assets/photos/redwoods-mist.jpg';
import redwoodsBoardwalk from '../assets/photos/redwoods-boardwalk.jpg';
import estateLawnKiss from '../assets/photos/estate-lawn-kiss.jpg';
import estateLawnRun from '../assets/photos/estate-lawn-run.jpg';
import receptionTable from '../assets/photos/reception-table.jpg';
import firstDance from '../assets/photos/first-dance.jpg';
import goldenHands from '../assets/photos/golden-hands.jpg';
import goldenLane from '../assets/photos/golden-lane.jpg';
import goldenSilhouette from '../assets/photos/golden-silhouette.jpg';
import ringsOnVows from '../assets/photos/rings-on-vows.jpg';
import familyOrchardLaughing from '../assets/photos/family-orchard-laughing.jpg';
import familyOrchardWalk from '../assets/photos/family-orchard-walk.jpg';
import anniversaryRoad from '../assets/photos/anniversary-road.jpg';
import anniversarySunset from '../assets/photos/anniversary-sunset.jpg';
import juniperWithCamera from '../assets/photos/juniper-with-camera.jpg';
import theoWithCamera from '../assets/photos/theo-with-camera.jpg';
import coastalHills from '../assets/photos/coastal-hills.jpg';

export interface Photo {
    src: ImageMetadata;
    alt: string;
    /** Who took it and where it came from, for /credits/. */
    credit: { name: string; url: string };
}

const unsplash = (name: string, id: string) => ({ name, url: `https://unsplash.com/photos/${id}` });

export const photos = {
    coastSeaStacksWalk: {
        src: coastSeaStacksWalk,
        alt: 'A couple in wedding clothes walking hand in hand along a wet beach at sunset, sea stacks behind them in the haze.',
        credit: unsplash('Brianna Parks', 'BdNI_ZsJCyQ'),
    },
    coastHeadlandEmbrace: {
        src: coastHeadlandEmbrace,
        alt: 'A bride and groom embracing on a grassy headland above a turquoise cove dotted with rocky islands.',
        credit: unsplash('Brianna Parks', 'gFMpIh1CbQ4'),
    },
    ridgeSunrise: {
        src: ridgeSunrise,
        alt: 'A groom in a dark red suit and a bride in white standing on a rocky outcrop above layered blue mountain ridges.',
        credit: unsplash('Brianna Parks', 'MCsIqFetqgA'),
    },
    redwoodsMist: {
        src: redwoodsMist,
        alt: 'A tiny couple in wedding clothes walking a trail between enormous redwood trunks and ferns.',
        credit: unsplash('Brianna Parks', 'OkiElXd_EDQ'),
    },
    redwoodsBoardwalk: {
        src: redwoodsBoardwalk,
        alt: 'A bride and groom seen from behind on a wooden boardwalk, sunbeams slanting through the redwoods.',
        credit: unsplash('Brianna Parks', '5TuubcjRLzQ'),
    },
    estateLawnKiss: {
        src: estateLawnKiss,
        alt: 'A groom kissing his bride on the cheek on a lawn scattered with petals, a grand stone house behind them.',
        credit: unsplash('Ben Atkins', 'B4qVLPOvZzc'),
    },
    estateLawnRun: {
        src: estateLawnRun,
        alt: 'A bride and groom laughing as they run hand in hand across a lawn, trees behind them.',
        credit: unsplash('Ben Atkins', 'D36BWP11w0Y'),
    },
    receptionTable: {
        src: receptionTable,
        alt: 'Long reception tables set with white flowers, candles and green napkins under a canopy of greenery.',
        credit: unsplash('Jonathan Borba', '2IxNtgbd2R8'),
    },
    firstDance: {
        src: firstDance,
        alt: 'A bride with her arm raised on a crowded dance floor under strings of warm lights.',
        credit: unsplash('Sarah Noltner', 'q5FNF6EEE30'),
    },
    goldenHands: {
        src: goldenHands,
        alt: 'Close up of a bride and groom holding hands in tall grass, the low sun glowing behind them.',
        credit: unsplash('Jaakko Perälä', '71BLG9XJtHk'),
    },
    goldenLane: {
        src: goldenLane,
        alt: 'A bride and groom walking away arm in arm down a village lane into the evening sun.',
        credit: unsplash('Jaakko Perälä', '7Hy6grhmRLQ'),
    },
    goldenSilhouette: {
        src: goldenSilhouette,
        alt: 'The silhouettes of a bride and groom holding hands on a hilltop against an amber sunset sky.',
        credit: unsplash('Jaakko Perälä', 'l_ecNnA4xp0'),
    },
    ringsOnVows: {
        src: ringsOnVows,
        alt: 'Two gold wedding rings resting on a sheet of handwritten vows in soft window light.',
        credit: unsplash('Andres Molina', 'V_GVvZFKSYE'),
    },
    familyOrchardLaughing: {
        src: familyOrchardLaughing,
        alt: 'A big family laughing on an autumn lawn, hands on the bump of the mother-to-be at the centre, a newborn in one father\'s arms.',
        credit: unsplash('Jennifer Kalenberg', 'FEWg2B2o2wY'),
    },
    familyOrchardWalk: {
        src: familyOrchardWalk,
        alt: 'A family of four standing close together among autumn trees, the children in front.',
        credit: unsplash('Jennifer Kalenberg', 'HDeKrDcXUwg'),
    },
    anniversaryRoad: {
        src: anniversaryRoad,
        alt: 'A laughing woman in a floral dress cupping her partner\'s face beside an old stone wall.',
        credit: unsplash('David Goldman', 'P2ucvsaxKM4'),
    },
    anniversarySunset: {
        src: anniversarySunset,
        alt: 'A woman in a floral dress smiling up at her partner in warm evening light.',
        credit: unsplash('David Goldman', 'd4sKkQsuJ-o'),
    },
    juniperWithCamera: {
        src: juniperWithCamera,
        alt: 'A photographer in a white blouse raising a camera to her eye, warm lights blurred behind her.',
        credit: unsplash('Noémi Macavei-Katócz', 'zrk7WirlxgM'),
    },
    theoWithCamera: {
        src: theoWithCamera,
        alt: 'A bearded photographer in a cap shooting with a camera in the middle of a busy street.',
        credit: unsplash('Jakob Owens', 'DQPP9rVLYGQ'),
    },
    coastalHills: {
        src: coastalHills,
        alt: 'Rolling golden hills falling to a calm blue bay, a wooded headland and distant mountains beyond.',
        credit: unsplash('Petra Reid', 'h99uHuiOw3M'),
    },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;

/** A journal post's picture when it has no cover of its own: its first tag's. */
export const topicPhotos: Record<string, PhotoName> = {
    'planning': 'ringsOnVows',
    'timelines': 'goldenLane',
    'light': 'goldenSilhouette',
    'elopements': 'ridgeSunrise',
    'portraits': 'familyOrchardWalk',
    'venues': 'estateLawnRun',
    'family': 'familyOrchardLaughing',
    'weather': 'redwoodsMist',
    'details': 'receptionTable',
};

export const defaultPostPhoto: PhotoName = 'coastalHills';
