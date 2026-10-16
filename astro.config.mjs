// @ts-check
/**
 * Astro's configuration. docs/building.md explains each setting.
 *
 * The environment is read once, by src/core/lib/settings.js, which refuses a
 * production build that is missing what it needs before Astro starts; where
 * the site's own files are (src/, or an example in the template repository)
 * is decided by src/core/lib/project.js (docs/examples.md).
 */
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProject } from './src/core/lib/clients/project.js';
import { isNoindex } from './src/core/lib/seo.js';

const { settings, layout } = loadProject(process.env);

/** @type {{ site: { noindex: readonly string[] } }} */
const { site } = await import(pathToFileURL(resolve(layout.srcDir, 'site.ts')).href);

/** The site's typefaces, for Astro's Fonts API: the site's own src/fonts.ts. */
const { fonts } = await import(pathToFileURL(resolve(layout.srcDir, 'fonts.ts')).href);

/**
 * The dev server forwards /api/site to the waffle app the way Caddy does in
 * production (docker/caddy/Caddyfile, docs/waffle-api.md): same origin for the
 * browser, the site key added, the visitor's cookies left behind.
 *
 * @type {Record<string, import('vite').ProxyOptions>}
 */
const proxy = {};

if (settings.waffleAppUrl !== null) {
    proxy['/api/site'] = {
        target: settings.waffleAppUrl,
        changeOrigin: true,
        headers: { 'X-Site-Key': process.env.WAFFLE_SITE_KEY ?? 'local-site-key' },
        configure: (proxyServer) => {
            proxyServer.on('proxyReq', (request) => {
                for (const header of ['cookie', 'origin', 'referer', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest']) {
                    request.removeHeader(header);
                }
            });
        },
    };
}

/**
 * The core's own routes, the same for every site (src/core/routes/).
 *
 * @type {import('astro').AstroIntegration}
 */
const core = {
    name: 'waffle-site-core',
    hooks: {
        'astro:config:setup': ({ injectRoute }) => {
            injectRoute({ pattern: '/robots.txt', entrypoint: './src/core/routes/robots.txt.ts', prerender: true });
        },
    },
};

export default defineConfig({
    site: settings.siteUrl,

    // The site's own pages and files: src/ and public/ in a site, the chosen
    // example's in the template repository.
    srcDir: layout.srcDir,
    publicDir: layout.publicDir,

    // Every page is a directory with an index.html, served with the slash
    // (Caddy redirects /pricing to /pricing/); canonical URLs match.
    trailingSlash: 'always',
    build: { format: 'directory' },

    // The settings the build reads, declared and typed (src/core/lib/settings.js
    // decides how they combine). Server-only: none of them reaches a browser.
    env: {
        schema: {
            SITE_ENV: envField.enum({ context: 'server', access: 'public', values: ['development', 'production'], optional: true }),
            SITE_URL: envField.string({ context: 'server', access: 'public', optional: true }),
            WAFFLE_APP_URL: envField.string({ context: 'server', access: 'public', optional: true }),
            WAFFLE_DATA: envField.enum({ context: 'server', access: 'public', values: ['fixtures', 'live'], optional: true }),
            SITE_EXAMPLE: envField.string({ context: 'server', access: 'public', optional: true }),
        },
    },

    // The content security policy, written into every page by Astro, with a
    // hash for every script and style it inlines (docs/https.md). Scripts,
    // styles, images, fonts and connections from this site only. Caddy adds
    // the rules a page cannot set for itself: framing, and where forms post.
    security: {
        csp: {
            directives: [
                "default-src 'self'",
                "img-src 'self' data:",
                "font-src 'self'",
                "connect-src 'self'",
                "object-src 'none'",
                "base-uri 'self'",
            ],
            scriptDirective: { resources: ["'self'"] },
            styleDirective: { resources: ["'self'"] },
        },
    },

    // Typefaces served from this site (the site's src/fonts.ts).
    fonts,

    // Links are fetched ahead when a visitor hovers or taps them.
    prefetch: { prefetchAll: true, defaultStrategy: 'hover' },

    // Shiki colours code with style attributes, which the content security
    // policy blocks. A marketing blog shows little code; a plain <pre> it is.
    markdown: { syntaxHighlight: false },

    // The end-to-end test builds into its own directory, so it never
    // overwrites the dist/ you are looking at.
    outDir: process.env.SITE_OUT_DIR ?? './dist',

    // Resized images and fonts are cached with the checkout, not in
    // node_modules, which is a Docker volume shared by every checkout.
    cacheDir: './.astro/cache',

    integrations: [
        core,
        sitemap({
            // Pages kept out of search results are kept out of the sitemap,
            // from the same list Base.astro reads (site.ts).
            filter: (page) => !isNoindex(new URL(page).pathname, site.noindex),
        }),
    ],

    server: {
        host: process.env.DEV_HOST ?? 'localhost',
        port: 4321,
    },

    // No telemetry and no dev toolbar: neither belongs in a build anyone ships.
    devToolbar: { enabled: false },

    vite: {
        server: { proxy },
        // A minifier aimed at current browsers folds animation-timeline into
        // the animation shorthand, which no browser accepts yet, so every
        // scroll-driven animation is silently dropped. Aimed at browsers
        // older than scroll timelines, Lightning CSS keeps it a longhand.
        // tests/e2e/site-build.test.js fails the build if it ever comes back.
        build: { cssMinify: 'lightningcss', cssTarget: ['chrome110', 'safari16', 'firefox115'] },
    },
});
