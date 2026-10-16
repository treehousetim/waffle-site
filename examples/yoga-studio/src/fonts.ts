/**
 * The site's typefaces, for Astro's Fonts API (astro.config.mjs reads this
 * file). Astro serves them from this site, writes their @font-face rules and
 * preloads them; Base.astro renders them with <Font />.
 *
 * Cormorant, a light, high-contrast serif for headings and the quiet italic
 * asides, and Nunito Sans, a soft humanist sans for reading. Both are under
 * the SIL Open Font License (assets/fonts/*-LICENSE.txt), and each is one
 * variable file covering every weight.
 */
import { fontProviders } from 'astro/config';

export const fonts = [
    {
        provider: fontProviders.local(),
        name: 'Cormorant',
        cssVariable: '--font-serif',
        fallbacks: ['Georgia', 'ui-serif', 'serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/cormorant-latin-wght-normal.woff2', import.meta.url)],
                    weight: '300 700',
                    style: 'normal',
                    display: 'swap',
                },
                {
                    src: [new URL('./assets/fonts/cormorant-latin-wght-italic.woff2', import.meta.url)],
                    weight: '300 700',
                    style: 'italic',
                    display: 'swap',
                },
            ],
        },
    },
    {
        provider: fontProviders.local(),
        name: 'Nunito Sans',
        cssVariable: '--font-sans',
        fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/nunito-sans-latin-wght-normal.woff2', import.meta.url)],
                    weight: '200 1000',
                    style: 'normal',
                    display: 'swap',
                },
            ],
        },
    },
];
