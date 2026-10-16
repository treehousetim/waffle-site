/**
 * The bakery's typefaces, for Astro's Fonts API (astro.config.mjs reads this
 * file). Astro serves them from this site, writes their @font-face rules and
 * preloads them; Base.astro renders each with <Font />.
 *
 * All three are under the SIL Open Font License (assets/fonts/OFL-*.txt):
 *
 *   - Bagel Fat One, the chunky display face: headings, the wordmark, stamps.
 *   - Alegreya, a warm calligraphic serif for reading, upright and italic,
 *     one variable file each.
 *   - Caveat, handwriting, for the notes scribbled in the margins.
 */
import { fontProviders } from 'astro/config';

export const fonts = [
    {
        provider: fontProviders.local(),
        name: 'Bagel Fat One',
        cssVariable: '--font-display',
        fallbacks: ['Georgia', 'serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/bagel-fat-one-latin-400.woff2', import.meta.url)],
                    weight: '400',
                    style: 'normal',
                    display: 'swap',
                },
            ],
        },
    },
    {
        provider: fontProviders.local(),
        name: 'Alegreya',
        cssVariable: '--font-serif',
        fallbacks: ['Georgia', 'serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/alegreya-latin-wght.woff2', import.meta.url)],
                    weight: '400 900',
                    style: 'normal',
                    display: 'swap',
                },
                {
                    src: [new URL('./assets/fonts/alegreya-latin-wght-italic.woff2', import.meta.url)],
                    weight: '400 900',
                    style: 'italic',
                    display: 'swap',
                },
            ],
        },
    },
    {
        provider: fontProviders.local(),
        name: 'Caveat',
        cssVariable: '--font-hand',
        fallbacks: ['cursive'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/caveat-latin-wght.woff2', import.meta.url)],
                    weight: '400 700',
                    style: 'normal',
                    display: 'swap',
                },
            ],
        },
    },
];
