// @ts-check
/**
 * Astro's configuration. docs/building.md explains each setting.
 *
 * The environment is read once, by src/lib/settings.js, which refuses a
 * production build that is missing what it needs before Astro starts.
 */
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { buildSettings } from './src/lib/settings.js';
import { isNoindex } from './src/lib/seo.js';
import { site } from './src/site.ts';

const settings = buildSettings(process.env);

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

export default defineConfig({
    site: settings.siteUrl,

    // Every page is a directory with an index.html, served with the slash
    // (Caddy redirects /pricing to /pricing/); canonical URLs match.
    trailingSlash: 'always',
    build: {
        format: 'directory',
        // The content security policy allows no inline <style>
        // (docker/caddy/Caddyfile); the audit fails a page that has one.
        inlineStylesheets: 'never',
    },

    // The end-to-end test builds into its own directory, so it never
    // overwrites the dist/ you are looking at.
    outDir: process.env.SITE_OUT_DIR ?? './dist',

    integrations: [
        sitemap({
            // Pages kept out of search results are kept out of the sitemap,
            // from the same list Base.astro reads (src/site.ts).
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
        // 0: nothing is inlined. Astro otherwise inlines a small script into
        // the page, which the content security policy then blocks, silently.
        build: { assetsInlineLimit: 0 },
        server: { proxy },
    },
});
