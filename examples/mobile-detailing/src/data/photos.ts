/**
 * Every photograph on the site, with its alt text and its credit, in one
 * place. Pages ask for a photo by name; the build resizes it, converts it to
 * AVIF and WebP and gives it a width, a height and a srcset
 * (src/components/Photo.astro).
 *
 * The example photos are from Unsplash, free under the Unsplash License
 * (https://unsplash.com/license); attribution is not required but is given
 * on /credits/. They are NOT covered by this repository's MIT licence, and
 * they are not Gloss Theory's work: a real detailer's site should show its
 * own vans, crew and before-and-afters (PLAYBOOK.md, "The look").
 *
 * Alt text says what the photo shows, for people who cannot see it.
 */
import type { ImageMetadata } from 'astro';
import garageBlackCoupe from '../assets/photos/garage-black-coupe.jpg';
import polisherBlueHood from '../assets/photos/polisher-blue-hood.jpg';
import sedanSilhouette from '../assets/photos/sedan-silhouette.jpg';
import foamGreySuv from '../assets/photos/foam-grey-suv.jpg';
import tireBrush from '../assets/photos/tire-brush.jpg';
import quiltedInterior from '../assets/photos/quilted-interior.jpg';
import rinseSprayMono from '../assets/photos/rinse-spray-mono.jpg';
import polisherCloseup from '../assets/photos/polisher-closeup.jpg';
import dashboardBrush from '../assets/photos/dashboard-brush.jpg';
import silverNight from '../assets/photos/silver-night.jpg';
import handWaxGarage from '../assets/photos/hand-wax-garage.jpg';
import microfiberDarkHood from '../assets/photos/microfiber-dark-hood.jpg';
import microfiberBlueHood from '../assets/photos/microfiber-blue-hood.jpg';
import keysLeatherSeat from '../assets/photos/keys-leather-seat.jpg';
import whiteVanNight from '../assets/photos/white-van-night.jpg';
import vanOfficeEntrance from '../assets/photos/van-office-entrance.jpg';
import headlightDark from '../assets/photos/headlight-dark.jpg';
import sandingPaint from '../assets/photos/sanding-paint.jpg';
import redCoupeRain from '../assets/photos/red-coupe-rain.jpg';
import redBlackInterior from '../assets/photos/red-black-interior.jpg';

export interface Photo {
    src: ImageMetadata;
    alt: string;
    /** Who took it and where it came from, for /credits/. */
    credit: { name: string; url: string };
}

const unsplash = (name: string, id: string) => ({ name, url: `https://unsplash.com/photos/${id}` });

export const photos = {
    sedanSilhouette: {
        src: sedanSilhouette,
        alt: 'A black sedan in near darkness, only the light running along its roofline, doors and wheels picking it out.',
        credit: unsplash('Samuele Errico Piccarini', 'FMbWFDiVRPs'),
    },
    garageBlackCoupe: {
        src: garageBlackCoupe,
        alt: 'A black sports car facing the camera under rows of strip lights in a dark garage, the lights reflected in its hood.',
        credit: unsplash('Ville Kaisla', 'HNCSCpWrVJA'),
    },
    polisherBlueHood: {
        src: polisherBlueHood,
        alt: 'A gloved detailer running an orbital polisher with a yellow pad across the hood of a blue car.',
        credit: unsplash('Luay Barani', 'iXpjQNP__EQ'),
    },
    foamGreySuv: {
        src: foamGreySuv,
        alt: 'The front of a grey SUV covered in thick white snow foam, running down the grille and headlights.',
        credit: unsplash('mintosko', 'V4b2j7f1dfc'),
    },
    tireBrush: {
        src: tireBrush,
        alt: 'A hand in a black nitrile glove scrubbing a car tire sidewall with a soft detailing brush.',
        credit: unsplash('Zac Nielson', '8k_T1EwTySs'),
    },
    quiltedInterior: {
        src: quiltedInterior,
        alt: 'A dark car interior with diamond-quilted leather seats, the steering wheel and the center console.',
        credit: unsplash('Ján Vlačuha', 'U4IaoKF5aj4'),
    },
    rinseSprayMono: {
        src: rinseSprayMono,
        alt: 'Black and white: the rear of a sports car being rinsed, water spraying off the bodywork.',
        credit: unsplash('Clément M.', 'Ng3xrviPrhk'),
    },
    polisherCloseup: {
        src: polisherCloseup,
        alt: 'A red machine polisher working glossy black paint, green masking tape protecting the edge of the panel.',
        credit: unsplash('Neelabh Raj', 'cw1914zDHUs'),
    },
    dashboardBrush: {
        src: dashboardBrush,
        alt: 'A detailer in a black glove working a small brush along the wooden dashboard of a classic car.',
        credit: unsplash('Luay Barani', '5SmPnmCjwcU'),
    },
    silverNight: {
        src: silverNight,
        alt: 'The front of a silver car in a dim garage, its headlight lit and warm lamps reflected in the paint.',
        credit: unsplash('Aaron Burden', 'U4w7y0lowL8'),
    },
    handWaxGarage: {
        src: handWaxGarage,
        alt: 'A detailer in a cap and black gloves machine-polishing the glossy black flank of a car.',
        credit: unsplash('Zac Nielson', 'CsZjHjFN3N8'),
    },
    microfiberDarkHood: {
        src: microfiberDarkHood,
        alt: 'A thick grey microfiber towel folded on the glossy hood of a dark car above its headlight.',
        credit: unsplash('GoGoNano', 'Df9XCGX9Y2U'),
    },
    microfiberBlueHood: {
        src: microfiberBlueHood,
        alt: 'A tan microfiber cloth resting on the deep blue, mirror-glossy hood of a car.',
        credit: unsplash('GoGoNano', 'qy20XW0tSlw'),
    },
    keysLeatherSeat: {
        src: keysLeatherSeat,
        alt: 'Ribbed black leather front seats of a car, seen through the open driver’s door.',
        credit: unsplash('Igor Costa', 'x4HmVzzBPQc'),
    },
    whiteVanNight: {
        src: whiteVanNight,
        alt: 'A white compact van parked in an empty lot at night, its headlights on.',
        credit: unsplash('Ollie Walls', 'jDo2IZm-uFc'),
    },
    vanOfficeEntrance: {
        src: vanOfficeEntrance,
        alt: 'A blue and white van parked in the courtyard of a concrete office building.',
        credit: unsplash('Dan Begel', 'NruQlr9CBbc'),
    },
    headlightDark: {
        src: headlightDark,
        alt: 'A sports car headlight glowing gold in the dark, the black paint around it barely visible.',
        credit: unsplash('Mathew Antony', 'oqw8zg1wC78'),
    },
    sandingPaint: {
        src: sandingPaint,
        alt: 'Hands guiding a rotary polisher with a yellow foam pad across the panel of a white car.',
        credit: unsplash('Deniz Demirci', 'RnqhjxG9hMM'),
    },
    redCoupeRain: {
        src: redCoupeRain,
        alt: 'A red sports car with beads of rain sitting on its glossy paint and windshield.',
        credit: unsplash('Yuvraj Singh', 'tmAynVA_ihE'),
    },
    redBlackInterior: {
        src: redBlackInterior,
        alt: 'A black and red car interior: steering wheel, dashboard screen and red leather seats.',
        credit: unsplash('Viktor Theo', 'wWN4AiGPscM'),
    },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;

/** A blog post's picture when it has no cover of its own: its first tag's. */
export const topicPhotos: Record<string, PhotoName> = {
    'washing': 'foamGreySuv',
    'interiors': 'quiltedInterior',
    'paint': 'polisherBlueHood',
    'paint-correction': 'polisherCloseup',
    'ceramic-coating': 'microfiberBlueHood',
    'protection': 'microfiberDarkHood',
    'wheels': 'tireBrush',
    'fleet': 'vanOfficeEntrance',
    'seasonal': 'redCoupeRain',
    'mobile-detailing': 'whiteVanNight',
};

export const defaultPostPhoto: PhotoName = 'garageBlackCoupe';
