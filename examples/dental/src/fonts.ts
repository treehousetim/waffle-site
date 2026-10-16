/**
 * The site's typefaces, for Astro's Fonts API (astro.config.mjs reads this
 * file). Astro serves them from this site, writes their @font-face rules and
 * preloads them; Base.astro renders them with <Font />.
 *
 * Fredoka, a rounded, friendly display face, for headings; Figtree, a warm,
 * open sans, for reading. Both under the SIL Open Font License (their
 * licences are beside them in assets/fonts/). One variable file per style
 * covers every weight.
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
        name: 'Figtree',
        cssVariable: '--font-sans',
        fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/figtree-latin-wght.woff2', import.meta.url)],
                    weight: '300 900',
                    style: 'normal',
                    display: 'swap',
                },
                {
                    src: [new URL('./assets/fonts/figtree-latin-wght-italic.woff2', import.meta.url)],
                    weight: '300 900',
                    style: 'italic',
                    display: 'swap',
                },
            ],
        },
    },
];
