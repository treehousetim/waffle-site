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
 * photographs of the real hospital, team and patients (with their owners'
 * permission) before launch.
 *
 * Alt text says what the photo shows, for people who cannot see it. Write it
 * for the photo, not for search engines.
 */
import type { ImageMetadata } from 'astro';
import chihuahuaHeld from '../assets/photos/chihuahua-held-in-clinic.jpg';
import vetExaminingDachshund from '../assets/photos/vet-examining-dachshund.jpg';
import vetCheckingTeeth from '../assets/photos/vet-checking-teeth.jpg';
import vetInjectingDachshund from '../assets/photos/vet-injecting-dachshund.jpg';
import vetUltrasound from '../assets/photos/vet-ultrasound-dog.jpg';
import kittenCheckup from '../assets/photos/kitten-checkup.jpg';
import whiteCatExam from '../assets/photos/white-cat-exam.jpg';
import goldenPuppy from '../assets/photos/golden-retriever-puppy.jpg';
import puppyOrange from '../assets/photos/puppy-orange-backdrop.jpg';
import samoyed from '../assets/photos/samoyed-confetti.jpg';
import seniorLabrador from '../assets/photos/senior-labrador.jpg';
import beardedDog from '../assets/photos/bearded-brown-dog.jpg';
import rabbit from '../assets/photos/mini-lop-rabbit.jpg';
import budgie from '../assets/photos/budgie-on-hand.jpg';
import tortoise from '../assets/photos/tortoise-on-lawn.jpg';
import catSunglasses from '../assets/photos/cat-in-sunglasses.jpg';
import pug from '../assets/photos/pug-in-glasses.jpg';
import puppyRunning from '../assets/photos/puppy-running-in-park.jpg';
import labradorTulip from '../assets/photos/labrador-with-tulip.jpg';
import tabbyKitten from '../assets/photos/tabby-kitten.jpg';

export interface Photo {
    src: ImageMetadata;
    alt: string;
    /** Who took it and where it came from, for /credits/. */
    credit: { name: string; url: string };
}

const unsplash = (name: string, id: string) => ({ name, url: `https://unsplash.com/photos/${id}` });

export const photos = {
    chihuahuaHeld: {
        src: chihuahuaHeld,
        alt: 'A small fawn chihuahua standing on an exam table, steadied by a gentle hand, with an ultrasound machine behind.',
        credit: unsplash('Anya Prygunova', 'u2H8mUzoF2Q'),
    },
    vetExaminingDachshund: {
        src: vetExaminingDachshund,
        alt: 'A vet in a white coat holding a black and tan dachshund on the exam table.',
        credit: unsplash('Alexander Mass', 'e4f87NzUJsU'),
    },
    vetCheckingTeeth: {
        src: vetCheckingTeeth,
        alt: 'A vet wearing magnifying loupes looks closely at a dachshund’s teeth.',
        credit: unsplash('Alexander Mass', 'sdpIuIbKaQg'),
    },
    vetInjectingDachshund: {
        src: vetInjectingDachshund,
        alt: 'A gloved vet gives a vaccine into a dachshund’s leg while a nurse holds it close.',
        credit: unsplash('Alexander Mass', 'fQeLC7WlNm8'),
    },
    vetUltrasound: {
        src: vetUltrasound,
        alt: 'A dog lying on its back on a steel table while a vet runs an ultrasound probe over its belly.',
        credit: unsplash('Alexander Mass', 'q-1iFFFN6ls'),
    },
    kittenCheckup: {
        src: kittenCheckup,
        alt: 'A white kitten being checked over by careful hands, a stethoscope ready beside it.',
        credit: unsplash('Judy Beth Morris', '5Bi6MWlWMbw'),
    },
    whiteCatExam: {
        src: whiteCatExam,
        alt: 'A fluffy white cat on an exam table, held gently by a vet in gloves and dark scrubs.',
        credit: unsplash('Sueda Güzeldere', 'BATIVPqWwqw'),
    },
    goldenPuppy: {
        src: goldenPuppy,
        alt: 'A golden retriever puppy with a red collar resting its paws on a table edge.',
        credit: unsplash('Bill Stephan', '9LkqymZFLrE'),
    },
    puppyOrange: {
        src: puppyOrange,
        alt: 'A corgi puppy with enormous ears sitting against a bright orange backdrop.',
        credit: unsplash('Alvan Nee', 'eoqnr8ikwFE'),
    },
    samoyed: {
        src: samoyed,
        alt: 'A smiling white Samoyed sitting on a pink floor scattered with confetti.',
        credit: unsplash('Peri Stojnic', '5Vr_RVPfbMI'),
    },
    seniorLabrador: {
        src: seniorLabrador,
        alt: 'An older yellow labrador with a white muzzle lying on a rug at home.',
        credit: unsplash('Reba Spike', 'FnMh0z-IeBY'),
    },
    beardedDog: {
        src: beardedDog,
        alt: 'A brown wire-haired dog with a scruffy beard and floppy ears against a black background.',
        credit: unsplash('Nicolás Pinilla', '2zg35_EsOMw'),
    },
    rabbit: {
        src: rabbit,
        alt: 'A white and fawn mini lop rabbit with one ear up, sitting on a lawn.',
        credit: unsplash('Sandy Millar', 'kKAaCeGf5wY'),
    },
    budgie: {
        src: budgie,
        alt: 'A small blue budgie perched on an outstretched hand.',
        credit: unsplash('Alexander Grey', 'W5D__7paUa0'),
    },
    tortoise: {
        src: tortoise,
        alt: 'A tortoise walking across a sunny green lawn.',
        credit: unsplash('Joel M Mathey', 'qC_b3XPPUjo'),
    },
    catSunglasses: {
        src: catSunglasses,
        alt: 'A grey fold-eared cat wearing round yellow sunglasses.',
        credit: unsplash('Raoul Droog', 'yMSecCHsIBc'),
    },
    pug: {
        src: pug,
        alt: 'A black pug in round glasses and a knitted scarf.',
        credit: unsplash('charlesdeluvio', 'pOUA8Xay514'),
    },
    puppyRunning: {
        src: puppyRunning,
        alt: 'A fluffy white puppy running across the grass towards the camera, ears flying.',
        credit: unsplash('Joe Caione', 'qO-PIF84Vxg'),
    },
    labradorTulip: {
        src: labradorTulip,
        alt: 'A young golden labrador sitting on a patio with a yellow tulip in its mouth.',
        credit: unsplash('Richard Brutyo', 'Sg3XwuEpybU'),
    },
    tabbyKitten: {
        src: tabbyKitten,
        alt: 'A brown tabby kitten sitting on a speckled floor, looking down.',
        credit: unsplash('Edgar', 'nKC772R_qog'),
    },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;

/** A blog post's picture when it has no cover of its own: its first tag's. */
export const topicPhotos: Record<string, PhotoName> = {
    'puppies': 'goldenPuppy',
    'kittens': 'tabbyKitten',
    'vaccines': 'vetInjectingDachshund',
    'dental': 'vetCheckingTeeth',
    'safety': 'labradorTulip',
    'senior-pets': 'seniorLabrador',
    'exotics': 'rabbit',
    'parasites': 'puppyRunning',
    'visits': 'chihuahuaHeld',
    'emergencies': 'whiteCatExam',
    'surgery': 'vetUltrasound',
    'dogs': 'puppyOrange',
    'cats': 'catSunglasses',
    'rabbits': 'rabbit',
};

export const defaultPostPhoto: PhotoName = 'chihuahuaHeld';
