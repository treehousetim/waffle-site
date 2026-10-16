/**
 * The site's typefaces, for Astro's Fonts API (astro.config.mjs reads this
 * file). Astro serves them from this site, writes their @font-face rules and
 * preloads them; Base.astro renders them with <Font />.
 *
 * - Fredoka, the chunky rounded display face: headings, buttons, stickers.
 * - Nunito, a rounded sans for reading: body copy, forms, captions.
 *
 * Both under the SIL Open Font License (assets/fonts/OFL-*.txt), each one
 * variable file covering every weight.
 */
import { fontProviders } from 'astro/config';

export const fonts = [
    {
        provider: fontProviders.local(),
        name: 'Fredoka',
        cssVariable: '--font-display',
        fallbacks: ['ui-rounded', 'system-ui', 'sans-serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/fredoka-latin-wght.woff2', import.meta.url)],
                    weight: '300 700',
                    style: 'normal',
                    display: 'swap',
                },
            ],
        },
    },
    {
        provider: fontProviders.local(),
        name: 'Nunito',
        cssVariable: '--font-body',
        fallbacks: ['ui-rounded', 'system-ui', 'sans-serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/nunito-latin-wght.woff2', import.meta.url)],
                    weight: '200 1000',
                    style: 'normal',
                    display: 'swap',
                },
            ],
        },
    },
];
