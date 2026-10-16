/**
 * Every photograph on the site, with its alt text and its credit, in one
 * place. Pages ask for a photo by name; the build resizes it, converts it to
 * AVIF and WebP and gives it a width, a height and a srcset
 * (src/components/Photo.astro).
 *
 * The example photos are from Unsplash, free under the Unsplash License
 * (https://unsplash.com/license); attribution is not required but is given
 * on /credits/. They are NOT covered by this repository's MIT licence, and
 * they are not this brewery: replace them with photographs of your own
 * brewhouse, taproom, people and beer before launch.
 *
 * Alt text says what the photo shows, for people who cannot see it.
 */
import type { ImageMetadata } from 'astro';
import taproomTanks from '../assets/photos/taproom-tanks.jpg';
import tankHall from '../assets/photos/tank-hall.jpg';
import copperBrewhouse from '../assets/photos/copper-brewhouse.jpg';
import brewhouseKettles from '../assets/photos/brewhouse-kettles.jpg';
import brewersTasting from '../assets/photos/brewers-tasting.jpg';
import foamClose from '../assets/photos/foam-close.jpg';
import goldenPour from '../assets/photos/golden-pour.jpg';
import tapPour from '../assets/photos/tap-pour.jpg';
import busyBar from '../assets/photos/busy-bar.jpg';
import cheers from '../assets/photos/cheers.jpg';
import hopCones from '../assets/photos/hop-cones.jpg';
import hopBine from '../assets/photos/hop-bine.jpg';
import hopTasters from '../assets/photos/hop-tasters.jpg';
import maltGrain from '../assets/photos/malt-grain.jpg';
import brickMill from '../assets/photos/brick-mill.jpg';
import riverFactory from '../assets/photos/river-factory.jpg';
import flightSteel from '../assets/photos/flight-steel.jpg';
import hazyFlight from '../assets/photos/hazy-flight.jpg';
import foodTruckNight from '../assets/photos/food-truck-night.jpg';
import barDog from '../assets/photos/bar-dog.jpg';

export interface Photo {
    src: ImageMetadata;
    alt: string;
    /** Who took it and where it came from, for /credits/. */
    credit: { name: string; url: string };
}

const unsplash = (name: string, id: string) => ({ name, url: `https://unsplash.com/photos/${id}` });

export const photos = {
    taproomTanks: {
        src: taproomTanks,
        alt: 'A long taproom with wooden tables below a mezzanine of gleaming steel brewing tanks.',
        credit: unsplash('Lens Fables', 'iYqVcIoVf0o'),
    },
    tankHall: {
        src: tankHall,
        alt: 'A row of tall stainless steel fermentation tanks on a polished concrete floor, with stacked boxes in the aisle.',
        credit: unsplash('Roberta keiko Kitahara Santana', 'RfL3l-I1zhc'),
    },
    copperBrewhouse: {
        src: copperBrewhouse,
        alt: 'Brass and copper brewing vessels with pipes, gauges and a ladder, lit warm under a high ceiling.',
        credit: unsplash('Yassine Khalfalli', 'G1-H9Pby5yE'),
    },
    brewhouseKettles: {
        src: brewhouseKettles,
        alt: 'A stainless brewhouse with a mash tun, kettle and a steel stair, in front of tall factory windows.',
        credit: unsplash('Keith Tanner', 'eEpdd4xGzeo'),
    },
    brewersTasting: {
        src: brewersTasting,
        alt: 'Two brewers holding small glasses up to the light between tall fermentation tanks.',
        credit: unsplash('Elevate', 'Cdq3ziSoeGY'),
    },
    foamClose: {
        src: foamClose,
        alt: 'Close up of a golden beer with a thick white head and drops of condensation on the glass.',
        credit: unsplash('Timothy Dykes', 'Lq1rOaigDoY'),
    },
    goldenPour: {
        src: goldenPour,
        alt: 'A golden beer pouring from a tap into a tilted glass, foam rising.',
        credit: unsplash('Wenceslao Moya grondona de luca', '6qVXypBghyg'),
    },
    tapPour: {
        src: tapPour,
        alt: 'A hand holding a glass under a row of chrome taps as a pale beer pours.',
        credit: unsplash('Travis Fish', 'p_Z7UOqYrlA'),
    },
    busyBar: {
        src: busyBar,
        alt: 'A bartender pulling a tap handle on a busy evening, glasses lined up on the bar.',
        credit: unsplash('Louis Hansel', 'WCm4dFvZnMM'),
    },
    cheers: {
        src: cheers,
        alt: 'Friends raising glasses of pale, amber and dark beer together outdoors.',
        credit: unsplash('Markus Spiske', 'SXZnW6YZtV0'),
    },
    hopCones: {
        src: hopCones,
        alt: 'A pile of fresh green hop cones on weathered wood.',
        credit: unsplash('Markus Spiske', 'qn5iDwvOZgo'),
    },
    hopBine: {
        src: hopBine,
        alt: 'Young hop cones hanging from a bine against a blue sky.',
        credit: unsplash('Jan Piatkowski', 'D6yRJ7YXf9g'),
    },
    hopTasters: {
        src: hopTasters,
        alt: 'Three tasting glasses of dark, amber and pale beer seen from above, scattered with hop cones.',
        credit: unsplash('Missy Fant', 'OMIgwm1i_NY'),
    },
    maltGrain: {
        src: maltGrain,
        alt: 'Close up of pale grains of barley with a single ear lying across them.',
        credit: unsplash('Sâjjâď Ašghâr', 'k2NZd1mKwPA'),
    },
    brickMill: {
        src: brickMill,
        alt: 'A tall old brick industrial building with rows of arched windows and a rusted fire escape.',
        credit: unsplash('Jonathan Mabey', 'Ug7HDvhvKFM'),
    },
    riverFactory: {
        src: riverFactory,
        alt: 'A long red brick factory with a water tower on the far bank of a wide river at dusk.',
        credit: unsplash('Manuwan Peramunugama', '42fuHfLTZc8'),
    },
    flightSteel: {
        src: flightSteel,
        alt: 'A wooden paddle of five tasters, from pale gold to near black, on a steel bar top.',
        credit: unsplash('Bohdan Stocek', 'vt0O0Av96R4'),
    },
    hazyFlight: {
        src: hazyFlight,
        alt: 'A flight of beers in stemmed glasses, a cloudy pale one in front, on a wooden board.',
        credit: unsplash('Bhuwan Bansal', 'hCIqvqcEqGA'),
    },
    foodTruckNight: {
        src: foodTruckNight,
        alt: 'A green vintage food truck lit up at night, a cook at the serving hatch.',
        credit: unsplash('Xavi Cabrera', '8BOfKQ0qUb0'),
    },
    barDog: {
        src: barDog,
        alt: 'A French bulldog in a patterned shirt sitting up at a wooden table indoors.',
        credit: unsplash('Hyory Liu', '59C3uU2tOkw'),
    },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;

/** A blog post's picture when it has no cover of its own: its first tag's. */
export const topicPhotos: Record<string, PhotoName> = {
    'lager': 'goldenPour',
    'brewhouse': 'copperBrewhouse',
    'hops': 'hopCones',
    'malt': 'maltGrain',
    'water': 'riverFactory',
    'taproom': 'busyBar',
    'serving': 'foamClose',
    'at-home': 'hopTasters',
    'history': 'brickMill',
    'food': 'foodTruckNight',
    'yeast': 'tankHall',
    'homebrewing': 'brewhouseKettles',
};

export const defaultPostPhoto: PhotoName = 'brewersTasting';
