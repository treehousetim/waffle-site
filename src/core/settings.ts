/**
 * The build's settings, where the site's files are, and its connection to
 * the waffle app, for pages. src/core/lib/settings.js decides what the
 * environment means; this only makes the answer importable as '@core/settings'.
 * docs/building.md.
 */
import { join } from 'node:path';
import { SITE_ENV, SITE_EXAMPLE, SITE_URL, WAFFLE_APP_URL, WAFFLE_DATA } from 'astro:env/server';
import { loadProject } from './lib/clients/project.js';
import { createWaffleApi } from './lib/waffle-api.js';
import { fetchText, readFixture } from './lib/clients/waffle.js';

// Declared in astro.config.mjs's env schema; Astro reads and types them.
export const { settings, layout } = loadProject({ SITE_ENV, SITE_URL, WAFFLE_APP_URL, WAFFLE_DATA, SITE_EXAMPLE });

/** Build-time reads from the waffle app (docs/waffle-api.md). */
export const waffle = createWaffleApi({
    mode: settings.dataMode,
    baseUrl: settings.waffleAppUrl,
    fetchText,
    readFixture: (file) => readFixture(join(layout.fixturesDir, file)),
    fixturesDir: layout.fixturesDir,
});

/**
 * The moment the build treats as now, for whether a dated post is out yet.
 * Fixed per build so every page agrees.
 */
export const buildTime = new Date();
