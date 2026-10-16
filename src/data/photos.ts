/**
 * Every photograph on the site, with its alt text and its credit, in one
 * place. Pages ask for a photo by name; the build resizes it, converts it to
 * WebP and gives it a width, a height and a srcset (src/components/Photo.astro).
 *
 * The example photos are from Unsplash, free under the Unsplash License
 * (https://unsplash.com/license): use them commercially or not, no
 * permission needed; attribution is not required but is given on /credits/.
 * They are NOT covered by this repository's MIT licence. Replace them with
 * photographs of your own work and team before launch: a real electrician's
 * site should show its own people, vans and jobs (docs/pages.md, "Photos").
 *
 * Alt text says what the photo shows, for people who cannot see it. Write it
 * for the photo, not for search engines.
 */
import type { ImageMetadata } from 'astro';
import electricianAtWork from '../assets/photos/electrician-at-work.jpg';
import electricianPortrait from '../assets/photos/electrician-portrait.jpg';
import electricianWithTools from '../assets/photos/electrician-with-tools.jpg';
import clampMeterAndTools from '../assets/photos/clamp-meter-and-tools.jpg';
import breakerPanel from '../assets/photos/breaker-panel.jpg';
import evChargingGarage from '../assets/photos/ev-charging-garage.jpg';
import evWallCharger from '../assets/photos/ev-wall-charger.jpg';
import oldWiring from '../assets/photos/old-wiring.jpg';
import kitchenLighting from '../assets/photos/kitchen-lighting.jpg';
import houseSnowPowerLines from '../assets/photos/house-snow-power-lines.jpg';
import panelTesting from '../assets/photos/panel-testing.jpg';
import networkCabling from '../assets/photos/network-cabling.jpg';
import lightningStorm from '../assets/photos/lightning-storm.jpg';
import electricianDrilling from '../assets/photos/electrician-drilling.jpg';
import wiresInHand from '../assets/photos/wires-in-hand.jpg';
import vintageBulbs from '../assets/photos/vintage-bulbs.jpg';
import lightBulb from '../assets/photos/light-bulb.jpg';
import smartLock from '../assets/photos/smart-lock.jpg';
import houseBlue from '../assets/photos/house-blue.jpg';
import houseWhitePorch from '../assets/photos/house-white-porch.jpg';
import houseGrayPorch from '../assets/photos/house-gray-porch.jpg';
import housePicketFence from '../assets/photos/house-picket-fence.jpg';
import houseTrees from '../assets/photos/house-trees.jpg';
import suburbAerial from '../assets/photos/suburb-aerial.jpg';

export interface Photo {
    src: ImageMetadata;
    alt: string;
    /** Who took it and where it came from, for /credits/. */
    credit: { name: string; url: string };
}

const unsplash = (name: string, id: string) => ({ name, url: `https://unsplash.com/photos/${id}` });

export const photos = {
    electricianAtWork: {
        src: electricianAtWork,
        alt: 'An electrician in a hard hat and safety glasses working on a meter box.',
        credit: unsplash('Emmanuel Ikwuegbu', '_2AlIm-F6pw'),
    },
    electricianPortrait: {
        src: electricianPortrait,
        alt: 'An electrician in a yellow hard hat and plaid shirt, arms folded, beside a meter box.',
        credit: unsplash('Emmanuel Ikwuegbu', 'zWOgsj3j0wA'),
    },
    electricianWithTools: {
        src: electricianWithTools,
        alt: 'An electrician in work gloves testing a meter box with a voltage tester.',
        credit: unsplash('Emmanuel Ikwuegbu', '-0-kl1BjvFc'),
    },
    clampMeterAndTools: {
        src: clampMeterAndTools,
        alt: 'A clamp meter, pliers and coils of cable on a workbench.',
        credit: unsplash('Hobi industri', 'NLBJ2I0lNr4'),
    },
    breakerPanel: {
        src: breakerPanel,
        alt: 'Rows of circuit breakers and neatly dressed wiring in an open panel.',
        credit: unsplash('mostafa mahmoudi', '47jO5Y8nsYo'),
    },
    evChargingGarage: {
        src: evChargingGarage,
        alt: 'A blue electric car charging from a wall charger in front of a garage.',
        credit: unsplash('Andersen EV', 'CRa_dWoilkg'),
    },
    evWallCharger: {
        src: evWallCharger,
        alt: 'A wall-mounted home EV charger connected to a parked car.',
        credit: unsplash('Zaptec', 'wLNqCa0TFIY'),
    },
    oldWiring: {
        src: oldWiring,
        alt: 'A tangle of old wiring and crumbling insulation inside an open wall.',
        credit: unsplash('Frames For Your Heart', 'iOLHAIaxpDA'),
    },
    kitchenLighting: {
        src: kitchenLighting,
        alt: 'A modern kitchen lit by recessed ceiling lights and three pendants over the island.',
        credit: unsplash('Lotus Design N Print', 'RwXneIyqxAw'),
    },
    houseSnowPowerLines: {
        src: houseSnowPowerLines,
        alt: 'A house at dusk after a snowstorm, with power lines overhead.',
        credit: unsplash('Samuel Fu', 'V6lCdEsXipE'),
    },
    panelTesting: {
        src: panelTesting,
        alt: 'A gloved hand testing connections in an electrical panel with a probe.',
        credit: unsplash('Toolmash Expo', 'PkHf7BUWbtk'),
    },
    networkCabling: {
        src: networkCabling,
        alt: 'Network cables plugged into a labelled patch panel.',
        credit: unsplash('Jordan Harrison', '40XgDxBfYXM'),
    },
    lightningStorm: {
        src: lightningStorm,
        alt: 'Lightning striking behind a transmission tower and trees at night.',
        credit: unsplash('American Public Power Association', 'bOehaMcbaaE'),
    },
    electricianDrilling: {
        src: electricianDrilling,
        alt: 'An electrician in a work vest drilling into the wall of a house.',
        credit: unsplash('Jimmy Nilsson Masth', 'UovTD1dG-lA'),
    },
    wiresInHand: {
        src: wiresInHand,
        alt: 'A gloved hand holding the stripped ends of an electrical cable.',
        credit: unsplash('Jimmy Nilsson Masth', 'U3GiK1u5j24'),
    },
    vintageBulbs: {
        src: vintageBulbs,
        alt: 'Rows of glowing filament light bulbs hanging against a brick wall.',
        credit: unsplash('Patrick Tomasso', '1NTFSnV-KLs'),
    },
    lightBulb: {
        src: lightBulb,
        alt: 'A single clear light bulb glowing against a dark background.',
        credit: unsplash('Anthony Indraus', 'Bb9jWuTMPUk'),
    },
    smartLock: {
        src: smartLock,
        alt: 'A hand holding a phone that controls a smart lock on a front door.',
        credit: unsplash('Sebastian Scholz (Nuki)', 'IJkSskfEqrM'),
    },
    houseBlue: {
        src: houseBlue,
        alt: 'A blue two-storey house with a white porch and a tree in the front yard.',
        credit: unsplash('Ian MacDonald', 'pmqTJDVbKdM'),
    },
    houseWhitePorch: {
        src: houseWhitePorch,
        alt: 'A white house with a wide covered porch, surrounded by trees.',
        credit: unsplash('Aubrey Odom', 'ITzfgP77DTg'),
    },
    houseGrayPorch: {
        src: houseGrayPorch,
        alt: 'A large gray shingled house with a wraparound porch and a green lawn.',
        credit: unsplash('todd kent', '178j8tJrNlc'),
    },
    housePicketFence: {
        src: housePicketFence,
        alt: 'A single-storey house behind a white picket fence.',
        credit: unsplash('Gustavo Zambelli', 'nEvzSXBIhiU'),
    },
    houseTrees: {
        src: houseTrees,
        alt: 'A white bungalow with a porch and pumpkins on the steps under autumn trees.',
        credit: unsplash('Phil Hearing', 'IYfp2Ixe9nM'),
    },
    suburbAerial: {
        src: suburbAerial,
        alt: 'An aerial view of a neighbourhood of closely spaced houses.',
        credit: unsplash('Breno Assis', 'r3WAWU5Fi5Q'),
    },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;

/** A blog post's picture when it has no cover of its own: its first tag's. */
export const topicPhotos: Record<string, PhotoName> = {
    'safety': 'panelTesting',
    'troubleshooting': 'clampMeterAndTools',
    'panels': 'breakerPanel',
    'ev-charging': 'evWallCharger',
    'wiring': 'wiresInHand',
    'buying-a-home': 'houseGrayPorch',
    'permits': 'electricianDrilling',
    'generators': 'houseSnowPowerLines',
    'storms': 'lightningStorm',
    'lighting': 'vintageBulbs',
    'energy-saving': 'lightBulb',
    'inspections': 'panelTesting',
    'smart-home': 'smartLock',
    'home-improvement': 'kitchenLighting',
};

export const defaultPostPhoto: PhotoName = 'electricianWithTools';
