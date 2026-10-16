/**
 * The site's typefaces, for Astro's Fonts API (astro.config.mjs reads this
 * file). Astro serves them from this site, writes their @font-face rules and
 * preloads them; Base.astro renders them with <Font />.
 *
 * Inter, under the SIL Open Font License (assets/fonts/OFL.txt). One
 * variable file covers every weight.
 */
import { fontProviders } from 'astro/config';

export const fonts = [
    {
        provider: fontProviders.local(),
        name: 'Inter',
        cssVariable: '--font-sans',
        fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/inter-latin-wght.woff2', import.meta.url)],
                    weight: '100 900',
                    style: 'normal',
                    display: 'swap',
                },
            ],
        },
    },
];
