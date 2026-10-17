/**
 * The site's typefaces, for Astro's Fonts API (astro.config.mjs reads this
 * file). Astro serves them from this site, writes their @font-face rules and
 * preloads them; Base.astro renders them with <Font />.
 *
 * - EB Garamond, the book face: headings, body and the small capitals that
 *   label everything. Roman and italic, one variable file each.
 *   SIL Open Font License (assets/fonts/OFL-eb-garamond.txt).
 * - IBM Plex Sans, the precise face: navigation, forms, figures and notes.
 *   SIL Open Font License (assets/fonts/OFL-ibm-plex-sans.txt).
 */
import { fontProviders } from 'astro/config';

export const fonts = [
    {
        provider: fontProviders.local(),
        name: 'EB Garamond',
        cssVariable: '--font-serif',
        fallbacks: ['Garamond', 'Georgia', 'serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/eb-garamond-latin-wght.woff2', import.meta.url)],
                    weight: '400 800',
                    style: 'normal',
                    display: 'swap',
                },
                {
                    src: [new URL('./assets/fonts/eb-garamond-latin-wght-italic.woff2', import.meta.url)],
                    weight: '400 800',
                    style: 'italic',
                    display: 'swap',
                },
            ],
        },
    },
    {
        provider: fontProviders.local(),
        name: 'IBM Plex Sans',
        cssVariable: '--font-sans',
        fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/ibm-plex-sans-latin-wght.woff2', import.meta.url)],
                    weight: '100 700',
                    style: 'normal',
                    display: 'swap',
                },
            ],
        },
    },
];
