/**
 * The site's typefaces, for Astro's Fonts API (astro.config.mjs reads this
 * file). Astro serves them from this site, writes their @font-face rules and
 * preloads them; Base.astro renders them with <Font />.
 *
 * - Archivo, a grotesk with a width axis (62% to 125%) as well as weight:
 *   stretched to 125% and set heavy it is the extended display face of the
 *   headlines; at 100% it is the body text. One file does both.
 * - JetBrains Mono, for the spec-sheet labels: sizes, minutes, prices.
 *
 * Both under the SIL Open Font License (assets/fonts/*-OFL.txt).
 */
import { fontProviders } from 'astro/config';

export const fonts = [
    {
        provider: fontProviders.local(),
        name: 'Archivo',
        cssVariable: '--font-sans',
        fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/archivo-latin-wdth.woff2', import.meta.url)],
                    weight: '100 900',
                    stretch: '62% 125%',
                    style: 'normal',
                    display: 'swap',
                },
            ],
        },
    },
    {
        provider: fontProviders.local(),
        name: 'JetBrains Mono',
        cssVariable: '--font-mono',
        fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        options: {
            variants: [
                {
                    src: [new URL('./assets/fonts/jetbrains-mono-latin-wght.woff2', import.meta.url)],
                    weight: '100 800',
                    style: 'normal',
                    display: 'swap',
                },
            ],
        },
    },
];
