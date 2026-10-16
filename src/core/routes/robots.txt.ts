/**
 * /robots.txt, for every site: production lets robots in, every other build
 * keeps them out (docs/seo.md). Part of the core, injected by
 * astro.config.mjs, so no example can leave it out or get it wrong.
 */
import type { APIRoute } from 'astro';
import { settings } from '../settings';
import { robotsTxt } from '../lib/robots.js';

export const GET: APIRoute = () =>
    new Response(robotsTxt({ indexable: settings.indexable, siteUrl: settings.siteUrl, sitemapPath: '/sitemap-index.xml' }), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
