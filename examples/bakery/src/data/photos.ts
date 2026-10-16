/**
 * Every photograph on the site, with its alt text and its credit, in one
 * place. Pages ask for a photo by name; the build resizes it, converts it to
 * AVIF and WebP and gives it a width, a height and a srcset
 * (src/components/Photo.astro).
 *
 * The example photos are from Unsplash, free under the Unsplash License
 * (https://unsplash.com/license): use them commercially or not, no
 * permission needed; attribution is not required but is given on /credits/.
 * They are NOT covered by this repository's MIT licence. Replace them with
 * photographs of the real bakery before launch: its own loaves, its own
 * counter, its own bakers at 5am. Nobody's mouth waters at a stock croissant.
 *
 * Alt text says what the photo shows, for people who cannot see it. Write it
 * for the photo, not for search engines.
 */
import type { ImageMetadata } from 'astro';
import sourdoughLoaves from '../assets/photos/sourdough-loaves.jpg';
import sourdoughCrumb from '../assets/photos/sourdough-crumb.jpg';
import bakerShaping from '../assets/photos/baker-shaping.jpg';
import flourHands from '../assets/photos/flour-hands.jpg';
import croissants from '../assets/photos/croissants.jpg';
import pastryCase from '../assets/photos/pastry-case.jpg';
import cinnamonBuns from '../assets/photos/cinnamon-buns.jpg';
import layerCake from '../assets/photos/layer-cake.jpg';
import weddingCake from '../assets/photos/wedding-cake.jpg';
import cakeSlice from '../assets/photos/cake-slice.jpg';
import latteArt from '../assets/photos/latte-art.jpg';
import pourOver from '../assets/photos/pour-over.jpg';
import cafeInterior from '../assets/photos/cafe-interior.jpg';
import breadOven from '../assets/photos/bread-oven.jpg';
import baguettes from '../assets/photos/baguettes.jpg';
import scone from '../assets/photos/scones-or-cookies.jpg';
import paperBagBread from '../assets/photos/paper-bag-bread.jpg';
import bakerPortrait from '../assets/photos/baker-portrait.jpg';

export interface Photo {
    src: ImageMetadata;
    alt: string;
    /** Who took it and where it came from, for /credits/. */
    credit: { name: string; url: string };
}

const unsplash = (name: string, id: string) => ({ name, url: `https://unsplash.com/photos/${id}` });

export const photos = {
    sourdoughLoaves: {
        src: sourdoughLoaves,
        alt: 'Six round sourdough loaves with deep golden, flour-dusted crusts and scored tops cooling on a wire rack in warm, low light.',
        credit: unsplash('Intrepid', '1l2qWh-W5AU'),
    },
    sourdoughCrumb: {
        src: sourdoughCrumb,
        alt: 'Two halves of a sourdough loaf on a cooling rack, showing an airy, open crumb with large irregular holes.',
        credit: unsplash('Rob Wicks', '-205xKTiEO4'),
    },
    bakerShaping: {
        src: bakerShaping,
        alt: 'A hand pressing a round of dough on a floured white bench, with a wooden rolling pin and a striped tea towel behind.',
        credit: unsplash('Nadya Spetnitskaya', 'tOYiQxF9-Ys'),
    },
    flourHands: {
        src: flourHands,
        alt: 'Flour falling from a hand onto a rough ball of dough on a floured wooden worktop.',
        credit: unsplash('Duncan Kidd', '2HMPWWifKrs'),
    },
    croissants: {
        src: croissants,
        alt: 'Rows of glossy, deep-golden croissants on baking parchment, seen from above.',
        credit: unsplash('Conor Brown', 'sqkXyyj4WdE'),
    },
    pastryCase: {
        src: pastryCase,
        alt: 'Chocolate-topped pastries, a sugar-dusted crumb cake, glazed buns and scones on a sunny bakery counter.',
        credit: unsplash('Kirsten Drew', 'n49BjsFf5dI'),
    },
    cinnamonBuns: {
        src: cinnamonBuns,
        alt: 'Cinnamon rolls cooling on a wire rack, the one in the middle topped with thick white icing running down its sides.',
        credit: unsplash('Rexi Pratama', 'qm7hrKF6lq0'),
    },
    layerCake: {
        src: layerCake,
        alt: 'A three-layer sponge cake filled with cream and strawberries, topped with whipped cream and fresh berries, on a white plate.',
        credit: unsplash('Summer Time', '7ourhaJ2sJc'),
    },
    weddingCake: {
        src: weddingCake,
        alt: 'A two-tier semi-naked wedding cake decorated with fresh figs, olive leaves, pistachios and rose petals, on a marble board.',
        credit: unsplash('Melissa Walker Horn', '4on47p0-bk4'),
    },
    cakeSlice: {
        src: cakeSlice,
        alt: 'A slice of layered honey cake with a fork beside a cappuccino and a bowl of sugar on a weathered wooden table.',
        credit: unsplash('Toa Heftiba', 'HPX4lhOoIDA'),
    },
    latteArt: {
        src: latteArt,
        alt: 'A flat white with a tulip pattern poured in the milk, in a white cup and saucer on a dark wooden table.',
        credit: unsplash('Robbie Down', 'LI8inyHnm_A'),
    },
    pourOver: {
        src: pourOver,
        alt: 'Freshly brewed black coffee being poured from a glass server into a white mug on a sunlit wooden counter.',
        credit: unsplash('Nathan Dumlao', 'N3btvQ51dL0'),
    },
    cafeInterior: {
        src: cafeInterior,
        alt: 'A quiet café corner with a small marble table, a bentwood chair, a posy of flowers and framed pictures on pine-panelled walls.',
        credit: unsplash('Maximilian Bungart', 'X9xhmK5WUlc'),
    },
    breadOven: {
        src: breadOven,
        alt: 'A baker sliding a scored loaf into a brick deck oven on a long wooden peel, with rows of floured loaves in front.',
        credit: unsplash('DDP', 'CceG6jpl19M'),
    },
    baguettes: {
        src: baguettes,
        alt: 'Five crusty baguettes with open, blistered scoring lying side by side.',
        credit: unsplash('Joost Crop', '6x0BG2emMuU'),
    },
    scone: {
        src: scone,
        alt: 'A golden scone on a white plate with small pots of strawberry jam and clotted cream on a weathered picnic table.',
        credit: unsplash('Alexander Schimmeck', 'K2nQUurKss8'),
    },
    paperBagBread: {
        src: paperBagBread,
        alt: 'Seeded, white and wholemeal loaves and rolls standing upright in plain brown paper bags, ready to take away.',
        credit: unsplash('Victoria Nazaruk', 'ytxRXkY8QE4'),
    },
    bakerPortrait: {
        src: bakerPortrait,
        alt: 'A baker in a white apron sifting powdered sugar over a tray of madeleines on a kitchen counter.',
        credit: unsplash('Elevate', '5e-JfidWFH0'),
    },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;

/** A journal post's picture when it has no cover of its own: its first tag's. */
export const topicPhotos: Record<string, PhotoName> = {
    'sourdough': 'sourdoughCrumb',
    'recipes': 'bakerShaping',
    'pastry': 'croissants',
    'cakes': 'layerCake',
    'coffee': 'latteArt',
    'bakery-news': 'cafeInterior',
};

export const defaultPostPhoto: PhotoName = 'paperBagBread';
