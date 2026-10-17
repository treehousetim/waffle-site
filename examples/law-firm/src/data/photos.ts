/**
 * Every photograph on the site, with its alt text and its credit, in one
 * place. Pages ask for a photo by name; the build resizes it, converts it to
 * AVIF and WebP and gives it a width, a height and a srcset
 * (src/components/Photo.astro).
 *
 * The example photos are from Unsplash, free under the Unsplash License
 * (https://unsplash.com/license): attribution is not required but is given
 * on /credits/. They are NOT covered by this repository's MIT licence.
 * There are deliberately no faces posing as the firm's attorneys: a real
 * firm should show its own people, its own office and its own town.
 *
 * Alt text says what the photo shows, for people who cannot see it.
 */
import type { ImageMetadata } from 'astro';
import caseFiles from '../assets/photos/case-files.jpg';
import brickStorefront from '../assets/photos/brick-storefront.jpg';
import colonnadeShadows from '../assets/photos/colonnade-shadows.jpg';
import coupleSigning from '../assets/photos/couple-signing.jpg';
import courthouseClockTower from '../assets/photos/courthouse-clock-tower.jpg';
import oldEnvelopes from '../assets/photos/old-envelopes.jpg';
import fountainPenLetter from '../assets/photos/fountain-pen-letter.jpg';
import glassBookcase from '../assets/photos/glass-bookcase.jpg';
import keysAtDoor from '../assets/photos/keys-at-door.jpg';
import libraryLongRoom from '../assets/photos/library-long-room.jpg';
import libraryLadder from '../assets/photos/library-ladder.jpg';
import handsWriting from '../assets/photos/hands-writing.jpg';
import penNibHandwriting from '../assets/photos/pen-nib-handwriting.jpg';
import readingRoom from '../assets/photos/reading-room.jpg';
import reviewingDocuments from '../assets/photos/reviewing-documents.jpg';
import signingContract from '../assets/photos/signing-contract.jpg';
import skeletonKeys from '../assets/photos/skeleton-keys.jpg';
import stoneStairs from '../assets/photos/stone-stairs.jpg';

export interface Photo {
    src: ImageMetadata;
    alt: string;
    /** Who took it and where it came from, for /credits/. */
    credit: { name: string; url: string };
}

const unsplash = (name: string, id: string) => ({ name, url: `https://unsplash.com/photos/${id}` });

export const photos = {
    colonnadeShadows: {
        src: colonnadeShadows,
        alt: 'A long stone colonnade in black and white, its fluted columns throwing sharp shadows.',
        credit: unsplash('Sebastian Schuster', 'lCkHnqTnjXw'),
    },
    stoneStairs: {
        src: stoneStairs,
        alt: 'A pale stone staircase with balustrades rising between tall classical columns.',
        credit: unsplash('Nhan Hoang', '_NChq9Wlyds'),
    },
    courthouseClockTower: {
        src: courthouseClockTower,
        alt: 'A stone county courthouse with a clock tower and dome, cars parked along the street below.',
        credit: unsplash('angga', 'admOOOfvbBk'),
    },
    brickStorefront: {
        src: brickStorefront,
        alt: 'An old two-storey brick storefront with bay windows on a quiet small-town street.',
        credit: unsplash('Roger Starnes Sr', 'c-Jla3Ld2wU'),
    },
    libraryLongRoom: {
        src: libraryLongRoom,
        alt: 'Dark wooden bookcases of leather-bound volumes, with marble busts lining the aisle of a long library.',
        credit: unsplash('Giammarco Boscaro', 'zeH-ljawHtg'),
    },
    libraryLadder: {
        src: libraryLadder,
        alt: 'A wooden library ladder against floor-to-ceiling shelves of old books.',
        credit: unsplash('enrico bet', 'lc7xcWebECc'),
    },
    glassBookcase: {
        src: glassBookcase,
        alt: 'Old leather-bound books behind the glass of a wooden bookcase, lamps glowing in the reflection.',
        credit: unsplash('Clarisse Meyer', 'jKU2NneZAbI'),
    },
    readingRoom: {
        src: readingRoom,
        alt: 'A vaulted reading room with long wooden tables, chandeliers and a tall arched window.',
        credit: unsplash('Mathew Schwartz', 'onOdABjwC0M'),
    },
    handsWriting: {
        src: handsWriting,
        alt: 'A man’s hands at a desk, one writing on a sheet of paper with a pen.',
        credit: unsplash('Scott Graham', 'OQMZwNd3ThU'),
    },
    signingContract: {
        src: signingContract,
        alt: 'A hand signing a printed document with a silver pen on a wooden desk.',
        credit: unsplash('Cytonn Photography', 'GJao3ZTX9gU'),
    },
    coupleSigning: {
        src: coupleSigning,
        alt: 'Two people at a dark table, one passing a pen to the other to sign a document on a clipboard.',
        credit: unsplash('Annika Wischnewsky', 'wNxbeoNUg_4'),
    },
    reviewingDocuments: {
        src: reviewingDocuments,
        alt: 'Two people at a grey conference table reviewing printed forms, a pen, phone and tablet beside them.',
        credit: unsplash('Olena Kholina', 'MhqUBTxQ3Hw'),
    },
    fountainPenLetter: {
        src: fountainPenLetter,
        alt: 'A black fountain pen resting on a handwritten letter.',
        credit: unsplash('Álvaro Serrano', 'hjwKMkehBco'),
    },
    penNibHandwriting: {
        src: penNibHandwriting,
        alt: 'A close view of a fountain pen nib writing in ink on lined paper.',
        credit: unsplash('Aaron Burden', 'y02jEX_B0O0'),
    },
    caseFiles: {
        src: caseFiles,
        alt: 'Stacks of old paper files and folders tied with black ribbon.',
        credit: unsplash('Sear Greyson', 'K-ZsC7YdJ6Y'),
    },
    oldEnvelopes: {
        src: oldEnvelopes,
        alt: 'A pile of old airmail envelopes and handwritten letters.',
        credit: unsplash('sue hughes', 'toQNPpuDuwI'),
    },
    keysAtDoor: {
        src: keysAtDoor,
        alt: 'A hand holding up a set of keys on a house-shaped key ring in an open doorway.',
        credit: unsplash('Jakub Żerdzicki', 'bqUZEAeWuok'),
    },
    skeletonKeys: {
        src: skeletonKeys,
        alt: 'A ring of old iron skeleton keys hanging against weathered wood.',
        credit: unsplash('Silas Köhler', 'C1P4wHhQbjM'),
    },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;

/** A post's picture when it has no cover of its own: its first tag's. */
export const topicPhotos: Record<string, PhotoName> = {
    'business': 'brickStorefront',
    'contracts': 'signingContract',
    'estate-planning': 'fountainPenLetter',
    'probate': 'oldEnvelopes',
    'employment': 'caseFiles',
    'real-estate': 'keysAtDoor',
    'leases': 'skeletonKeys',
    'families': 'coupleSigning',
};

export const defaultPostPhoto: PhotoName = 'glassBookcase';
