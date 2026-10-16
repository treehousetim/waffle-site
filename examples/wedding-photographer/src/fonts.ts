/**
 * The studio's typefaces, for Astro's Fonts API (astro.config.mjs reads this
 * file). Astro serves them from this site, writes their @font-face rules and
 * preloads them; Base.astro renders them with <Font />.
 *
 * Bodoni Moda, a high-contrast Didone with an optical-size axis, for
 * headlines, numerals and captions in italic; Jost, a quiet geometric sans,
 * for everything people read at length. Both under the SIL Open Font
 * License (assets/fonts/OFL-*.txt).
 */
import { fontProviders } from 'astro/config';

export const fonts = [
    {
        provider: fontProviders.local(),
        name: 'Bodoni Moda',
        cssVariable: '--font-display',
        fallbacks: ['Didot', 'Bodoni 72', 'Georgia', 'serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/bodoni-moda-latin-opsz-normal.woff2', import.meta.url)],
                    weight: '400 900',
                    style: 'normal',
                    display: 'swap',
                },
                {
                    src: [new URL('./assets/fonts/bodoni-moda-latin-opsz-italic.woff2', import.meta.url)],
                    weight: '400 900',
                    style: 'italic',
                    display: 'swap',
                },
            ],
        },
    },
    {
        provider: fontProviders.local(),
        name: 'Jost',
        cssVariable: '--font-sans',
        fallbacks: ['Futura', 'Avenir Next', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/jost-latin-wght-normal.woff2', import.meta.url)],
                    weight: '100 900',
                    style: 'normal',
                    display: 'swap',
                },
            ],
        },
    },
];
