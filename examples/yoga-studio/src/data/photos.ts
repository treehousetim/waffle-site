/**
 * Every photograph on the site, with its alt text and its credit, in one
 * place. Pages ask for a photo by name; the build resizes it, converts it to
 * AVIF and WebP and gives it a width, a height and a srcset
 * (src/components/Photo.astro).
 *
 * The example photos are from Unsplash, free under the Unsplash License
 * (https://unsplash.com/license): use them commercially or not, no
 * permission needed; attribution is not required but is given on /credits/.
 * They are NOT covered by this repository's MIT licence. The people in them
 * are not the studio's teachers: replace them with photographs of your own
 * room, your own teachers and your own classes before launch.
 *
 * Alt text says what the photo shows, for people who cannot see it. Write it
 * for the photo, not for search engines.
 */
import type { ImageMetadata } from 'astro';
import riverMist from '../assets/photos/river-mist.jpg';
import studioRoom from '../assets/photos/studio-room.jpg';
import vinyasaFlow from '../assets/photos/vinyasa-flow.jpg';
import yinPose from '../assets/photos/yin-pose.jpg';
import restorativeRest from '../assets/photos/restorative-rest.jpg';
import prenatalYoga from '../assets/photos/prenatal-yoga.jpg';
import beginnersClass from '../assets/photos/beginners-class.jpg';
import teacherIris from '../assets/photos/teacher-1.jpg';
import teacherTomas from '../assets/photos/teacher-2.jpg';
import teacherMaya from '../assets/photos/teacher-3.jpg';
import teacherHana from '../assets/photos/teacher-4.jpg';
import teacherNell from '../assets/photos/teacher-5.jpg';
import matsAndBlocks from '../assets/photos/mats-and-blocks.jpg';
import teaAndCandle from '../assets/photos/tea-and-candle.jpg';
import retreatForest from '../assets/photos/retreat-forest.jpg';
import stonesWater from '../assets/photos/stones-water.jpg';
import meditationSeated from '../assets/photos/meditation-seated.jpg';
import handsMudra from '../assets/photos/hands-mudra.jpg';

export interface Photo {
    src: ImageMetadata;
    alt: string;
    /** Who took it and where it came from, for /credits/. */
    credit: { name: string; url: string };
}

const unsplash = (name: string, id: string) => ({ name, url: `https://unsplash.com/photos/${id}` });

export const photos = {
    riverMist: {
        src: riverMist,
        alt: 'A still river at dawn with low mist drifting between dark green trees under a pale sky.',
        credit: unsplash('Richard Burlton', 'IA8JqQLeI4E'),
    },
    studioRoom: {
        src: studioRoom,
        alt: 'An empty yoga studio with a wooden floor and beamed ceiling, rows of dark mats set out with blocks and folded blankets, lit by low warm sunlight from the windows.',
        credit: unsplash('Olga Pukhalskaya', 'dwka5DDrnY0'),
    },
    vinyasaFlow: {
        src: vinyasaFlow,
        alt: 'A woman in pale blue clothing holds a high crescent lunge with arms reaching overhead on a mat in a bright, minimal room.',
        credit: unsplash('Kira Severinova', '5nk1IVc0h5Y'),
    },
    yinPose: {
        src: yinPose,
        alt: 'A woman in a white vest and sage-green leggings sits on a cork mat, folding gently forward with her hands holding her feet, against a white wooden wall.',
        credit: unsplash('Margaret Young', 'EZlGYH-e93c'),
    },
    restorativeRest: {
        src: restorativeRest,
        alt: 'A man rests in a supported backbend over a grey bolster on the floor of a bright room, with a cushion beside him and a window ledge of small objects behind.',
        credit: unsplash('wee lee', 'HOSjS6qIGAs'),
    },
    prenatalYoga: {
        src: prenatalYoga,
        alt: 'A pregnant woman sits cross-legged on a smooth rock with her eyes lowered and her hands resting below her belly, in soft warm light.',
        credit: unsplash('Jonathan Borba', 'TBu18BeSM9A'),
    },
    beginnersClass: {
        src: beginnersClass,
        alt: 'Three people sit on mats in a sunlit studio, each folding forward over outstretched legs towards their feet.',
        credit: unsplash('Jaspinder Singh', 'vpVE1Xk1eR4'),
    },
    teacherIris: {
        src: teacherIris,
        alt: 'A woman with her hair tied back sits with eyes closed and palms pressed together at her chest, in soft dappled light against a pale wall.',
        credit: unsplash('madison lavern', '4gcqRf3-f2I'),
    },
    teacherTomas: {
        src: teacherTomas,
        alt: 'A man in a grey T-shirt and shorts sits on a sunlit wooden porch, folding forward over his legs in a seated stretch.',
        credit: unsplash('Scott Broome', 'cuOHHP5tx5g'),
    },
    teacherMaya: {
        src: teacherMaya,
        alt: 'An older person with short grey hair, dressed in black, holds a full backbend with hands and feet on a grey carpet in a plain room.',
        credit: unsplash('beautiful_movements for_inspiration', 'sKw4o3vewpU'),
    },
    teacherHana: {
        src: teacherHana,
        alt: 'A smiling woman with short dark hair sits cross-legged on a cork mat with her palms together, wearing a sage-green top and leggings in a bright room.',
        credit: unsplash('Look Studio', 'BPWTDYf7ICI'),
    },
    teacherNell: {
        src: teacherNell,
        alt: 'A woman in taupe leggings and a sports top holds chair pose, knees bent and arms raised, on a light wooden floor against a plain grey wall.',
        credit: unsplash('Heather Jacoby', '65Kfvb9p8Dg'),
    },
    matsAndBlocks: {
        src: matsAndBlocks,
        alt: 'Two cork yoga blocks lean together on a sage-green mat laid on a light wooden floor.',
        credit: unsplash('Samantha Sheppard', 'b8Q5fHBsyik'),
    },
    teaAndCandle: {
        src: teaAndCandle,
        alt: 'A lit cream pillar candle, a sage-green ceramic cup and a black cast-iron teapot on a rattan mat stand on a pale stone surface.',
        credit: unsplash('Miska Sage', '6J2OkpIo-qA'),
    },
    retreatForest: {
        src: retreatForest,
        alt: 'Mist rolls over a dark pine forest on a hillside, reflected in the still water of a lake below.',
        credit: unsplash('Sam Ferrara', 'iecJiKe_RNg'),
    },
    stonesWater: {
        src: stonesWater,
        alt: 'A small stack of dark, smooth stones balances on a wet log, mirrored in a pool of water, with a misty grey shore behind.',
        credit: unsplash('Karsten Winegeart', 'iqqHQCWU9OI'),
    },
    meditationSeated: {
        src: meditationSeated,
        alt: 'A woman sits cross-legged in meditation on a wooden deck, seen from behind as a silhouette against golden morning light and palm trees.',
        credit: unsplash('Jared Rice', 'NTyBbu66_SI'),
    },
    handsMudra: {
        src: handsMudra,
        alt: 'Close-up of a hand resting on a knee in a mudra, thumb and forefinger touching, with a wooden bead bracelet at the wrist and soft green foliage behind.',
        credit: unsplash('Ksenia Makagonova', 'V-TIPBoC_2M'),
    },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;

/** A journal post's picture when it has no cover of its own: its first tag's. */
export const topicPhotos: Record<string, PhotoName> = {
    'rest': 'restorativeRest',
    'breath': 'handsMudra',
    'beginners': 'beginnersClass',
    'pregnancy': 'prenatalYoga',
    'practice': 'matsAndBlocks',
    'yin': 'yinPose',
    'vinyasa': 'vinyasaFlow',
    'meditation': 'meditationSeated',
    'studio-life': 'studioRoom',
    'seasons': 'riverMist',
    'retreats': 'retreatForest',
};

export const defaultPostPhoto: PhotoName = 'teaAndCandle';
