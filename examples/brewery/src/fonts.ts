/**
 * The site's typefaces, for Astro's Fonts API (astro.config.mjs reads this
 * file). Astro serves them from this site, writes their @font-face rules and
 * preloads them; Base.astro renders each with <Font />.
 *
 * All three are under the SIL Open Font License; the licences sit beside the
 * files in assets/fonts/. One variable file per family covers every weight.
 *
 *   Big Shoulders Display          tall, condensed, industrial: headings and numbers
 *   Big Shoulders Stencil Display  the same bones, stencil-cut: labels, tags, the tap board
 *   Bitter                         a sturdy slab serif for reading
 */
import { fontProviders } from 'astro/config';

const variable = (file: string, style: 'normal' | 'italic' = 'normal') => ({
    src: [new URL(`./assets/fonts/${file}`, import.meta.url)],
    weight: '100 900',
    style,
    display: 'swap' as const,
});

export const fonts = [
    {
        provider: fontProviders.local(),
        name: 'Big Shoulders Display',
        cssVariable: '--font-display',
        fallbacks: ['Impact', 'Haettenschweiler', 'Arial Narrow', 'sans-serif'],
        options: { variants: [variable('big-shoulders-display-latin-wght.woff2')] },
    },
    {
        provider: fontProviders.local(),
        name: 'Big Shoulders Stencil Display',
        cssVariable: '--font-stencil',
        fallbacks: ['Impact', 'Arial Narrow', 'sans-serif'],
        options: { variants: [variable('big-shoulders-stencil-display-latin-wght.woff2')] },
    },
    {
        provider: fontProviders.local(),
        name: 'Bitter',
        cssVariable: '--font-text',
        fallbacks: ['Rockwell', 'Georgia', 'serif'],
        options: { variants: [variable('bitter-latin-wght.woff2'), variable('bitter-latin-wght-italic.woff2', 'italic')] },
    },
];
