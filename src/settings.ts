/**
 * The build's settings and its connection to the waffle app, for pages.
 *
 * src/lib/settings.js decides what the environment means; this only makes
 * the answer importable from a page. docs/building.md.
 */
import { buildSettings } from './lib/settings.js';
import { createWaffleApi } from './lib/waffle-api.js';
import { fetchText, readFixture } from './lib/clients/waffle.js';

export const settings = buildSettings(process.env);

/** Build-time reads from the waffle app (docs/waffle-api.md). */
export const waffle = createWaffleApi({
    mode: settings.dataMode,
    baseUrl: settings.waffleAppUrl,
    fetchText,
    readFixture,
});

/**
 * The moment the build treats as now, for whether a dated post is out yet.
 * Fixed per build so every page agrees.
 */
export const buildTime = new Date();
