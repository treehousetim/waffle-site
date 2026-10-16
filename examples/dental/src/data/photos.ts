/**
 * Every photograph on the site, with its alt text and its credit, in one
 * place. Pages ask for a photo by name; the build resizes it, converts it to
 * AVIF and WebP and gives it a width, a height and a srcset
 * (src/components/Photo.astro).
 *
 * The example photos are from Unsplash, free under the Unsplash License
 * (https://unsplash.com/license), each checked on its unsplash.com/photos
 * page; attribution is not required but is given on /credits/. They are NOT
 * covered by this repository's MIT licence, and the people in them are
 * models, not the dentists named on this site. Replace them with photographs
 * of the real practice, its rooms and its team before launch.
 *
 * Alt text says what the photo shows, for people who cannot see it.
 */
import type { ImageMetadata } from 'astro';
import dentistChatting from '../assets/photos/dentist-chatting-with-patient.jpg';
import waitingRoom from '../assets/photos/waiting-room.jpg';
import coralChair from '../assets/photos/coral-dental-chair.jpg';
import treatmentRoom from '../assets/photos/bright-treatment-room.jpg';
import clearAligners from '../assets/photos/clear-aligners.jpg';
import implantModel from '../assets/photos/implant-model.jpg';
import xRays from '../assets/photos/dentist-reading-x-rays.jpg';
import boyCheckUp from '../assets/photos/boy-at-check-up.jpg';
import womanSmiling from '../assets/photos/woman-smiling.jpg';
import girlBrushing from '../assets/photos/girl-brushing-teeth.jpg';
import bambooBrushes from '../assets/photos/bamboo-toothbrushes.jpg';
import familyCouch from '../assets/photos/family-on-couch.jpg';
import checkUpMirror from '../assets/photos/check-up-mirror.jpg';
import headphones from '../assets/photos/woman-with-headphones.jpg';
import toothache from '../assets/photos/woman-with-toothache.jpg';
import meditating from '../assets/photos/woman-meditating.jpg';
import drWhitlock from '../assets/photos/dr-whitlock.jpg';
import drMarchetti from '../assets/photos/dr-marchetti.jpg';
import drLindqvist from '../assets/photos/dr-lindqvist.jpg';
import drCastellano from '../assets/photos/dr-castellano.jpg';

export interface Photo {
    src: ImageMetadata;
    alt: string;
    /** Who took it and where it came from, for /credits/. */
    credit: { name: string; url: string };
}

const unsplash = (name: string, id: string) => ({ name, url: `https://unsplash.com/photos/${id}` });

export const photos = {
    dentistChatting: {
        src: dentistChatting,
        alt: 'A smiling dentist sits beside a relaxed patient in the chair, chatting before a check-up in a bright room.',
        credit: unsplash('Harold Hisona', 'Bg81yWKZlMg'),
    },
    waitingRoom: {
        src: waitingRoom,
        alt: 'A calm waiting room with blue chairs, potted plants and a letter board sign on a white wall.',
        credit: unsplash('Amy Vosters', 'pxOQ-P97sA8'),
    },
    coralChair: {
        src: coralChair,
        alt: 'A treatment room with a coral dental chair, a sunny window and white cabinets.',
        credit: unsplash('Atikah Akhtar', 'XJptUS8nbhs'),
    },
    treatmentRoom: {
        src: treatmentRoom,
        alt: 'A bright, tidy treatment room with a teal dental chair, a plant and white cabinets.',
        credit: unsplash('Benyamin Bohlouli', 'e7MJLM5VGjY'),
    },
    clearAligners: {
        src: clearAligners,
        alt: 'Hands holding a pair of clear aligners, their small white case and a pen of whitening gel.',
        credit: unsplash('Candid', 'WFsNCIn8OF4'),
    },
    implantModel: {
        src: implantModel,
        alt: 'A teaching model showing a dental implant post and crown between two natural teeth.',
        credit: unsplash('Jonathan Borba', 'W9YEY6G8LVM'),
    },
    xRays: {
        src: xRays,
        alt: 'A dentist in glasses studying dental x-rays on a light box.',
        credit: unsplash('Jonathan Borba', 'v_2FRXEba94'),
    },
    boyCheckUp: {
        src: boyCheckUp,
        alt: 'A young boy lying back in a dental chair, looking at the camera while a dentist prepares his check-up.',
        credit: unsplash('Angels for Humanity', '66yynNM_Ft4'),
    },
    womanSmiling: {
        src: womanSmiling,
        alt: 'A woman with long dark hair laughing, with a wide, bright smile.',
        credit: unsplash('Lesly Juarez', '1AhGNGKuhR0'),
    },
    girlBrushing: {
        src: girlBrushing,
        alt: 'A smiling girl brushing her teeth with a red toothbrush in front of a yellow wall.',
        credit: unsplash('Diana Polekhina', 'MLJHxQ5qxxY'),
    },
    bambooBrushes: {
        src: bambooBrushes,
        alt: 'Two bamboo toothbrushes standing in a glass jar beside a green leaf.',
        credit: unsplash('Superkitina', 'rCT928GIboM'),
    },
    familyCouch: {
        src: familyCouch,
        alt: 'A mother, father and young son laughing together on a sofa at home.',
        credit: unsplash('Vitaly Gariev', '2xb1csEK8As'),
    },
    checkUpMirror: {
        src: checkUpMirror,
        alt: 'A close-up of a dental mirror and a scaler during a check-up of a patient’s front teeth.',
        credit: unsplash('Caroline LM', '8BkF0sTC6Uo'),
    },
    headphones: {
        src: headphones,
        alt: 'A woman with her eyes closed, smiling and listening to music on large white headphones.',
        credit: unsplash('Jair Medina Nossa', '-7Kkov230I0'),
    },
    toothache: {
        src: toothache,
        alt: 'A young person in glasses wincing and holding their jaw with both hands.',
        credit: unsplash('Fábio Lucas', '2QOMia2irCU'),
    },
    meditating: {
        src: meditating,
        alt: 'A woman sitting cross-legged on a sofa with headphones on and her eyes closed, breathing slowly.',
        credit: unsplash('Vitaly Gariev', 'kf_P2_M61WU'),
    },
    drWhitlock: {
        src: drWhitlock,
        alt: 'Portrait of a smiling woman in glasses and a pale blue shirt, standing outdoors.',
        credit: unsplash('Vitaly Gariev', 'r1sVDjf_Hxg'),
    },
    drMarchetti: {
        src: drMarchetti,
        alt: 'Portrait of a smiling woman with dark curly hair in teal scrubs, arms folded.',
        credit: unsplash('Ocho Artex Media', 'rm7rZYdl3rY'),
    },
    drLindqvist: {
        src: drLindqvist,
        alt: 'Portrait of a smiling grey-haired man in a white coat.',
        credit: unsplash('Vidak', '5vfc-1KQLtE'),
    },
    drCastellano: {
        src: drCastellano,
        alt: 'Portrait of a smiling bearded man in a dark clinic jacket, in a treatment room.',
        credit: unsplash('Filip Rankovic Grobgaard', '9_1Y_IKP4tY'),
    },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;
