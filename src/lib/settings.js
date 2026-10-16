/**
 * Build settings, from the environment the build runs in.
 *
 * The only place the environment is interpreted. astro.config.mjs,
 * src/settings.ts and tools/audit.mjs each pass `process.env` in; nothing else
 * reads it. docs/building.md has the variables and the failure list; the
 * numbers below cite it.
 *
 *   SITE_ENV        development (default) | production
 *   SITE_URL        the canonical origin, e.g. https://www.acme.com
 *   WAFFLE_APP_URL  the waffle app this site fronts, an origin: https://app.acme.com
 *   WAFFLE_DATA     fixtures | live: where build-time waffle data comes from
 *
 * A development build is never indexable, so a preview that leaks onto the
 * internet does not end up in search results next to the real site.
 */

/** @typedef {'development' | 'production'} SiteEnv */
/** @typedef {'fixtures' | 'live'} DataMode */

/**
 * @typedef {object} Settings
 * @property {SiteEnv} env
 * @property {boolean} production
 * @property {boolean} indexable    robots may index the build
 * @property {string} siteUrl       origin, no trailing slash
 * @property {string | null} waffleAppUrl  origin, no trailing slash (Caddy proxies to it)
 * @property {DataMode} dataMode
 */

export const DEV_SITE_URL = 'http://localhost:4321';

export class SettingsError extends Error {
    /** @param {string} message */
    constructor(message) {
        super(message);
        this.name = 'SettingsError';
    }
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {Settings}
 */
export function buildSettings(env) {
    const siteEnv = value(env, 'SITE_ENV') ?? 'development';

    // (1) A typo here would otherwise build a production site as development.
    if (siteEnv !== 'development' && siteEnv !== 'production') {
        throw new SettingsError(`SITE_ENV must be development or production; got '${siteEnv}'.`);
    }

    const production = siteEnv === 'production';
    const rawSiteUrl = value(env, 'SITE_URL');

    // (2) Canonical URLs, the sitemap and Open Graph tags are all absolute.
    if (production && rawSiteUrl === undefined) {
        throw new SettingsError('SITE_URL is required for a production build, e.g. SITE_URL=https://www.acme.com.');
    }

    const siteUrl = origin(rawSiteUrl ?? DEV_SITE_URL, 'SITE_URL');

    // (3) Search engines treat http and https as different sites.
    if (production && !siteUrl.startsWith('https://')) {
        throw new SettingsError(`SITE_URL must be https for a production build; got '${siteUrl}'.`);
    }

    const rawApp = value(env, 'WAFFLE_APP_URL');
    const waffleAppUrl = rawApp === undefined ? null : origin(rawApp, 'WAFFLE_APP_URL');
    const dataMode = value(env, 'WAFFLE_DATA') ?? (production ? 'live' : 'fixtures');

    if (dataMode !== 'fixtures' && dataMode !== 'live') {
        throw new SettingsError(`WAFFLE_DATA must be fixtures or live; got '${dataMode}'.`);
    }

    // (4) Fixture data must never be published as if it were the real thing.
    if (production && dataMode === 'fixtures') {
        throw new SettingsError('WAFFLE_DATA=fixtures is refused for a production build: it would publish sample data.');
    }

    // (5) Live data needs somewhere to come from.
    if (dataMode === 'live' && waffleAppUrl === null) {
        throw new SettingsError('WAFFLE_APP_URL is required when waffle data is live (every production build).');
    }

    return { env: siteEnv, production, indexable: production, siteUrl, waffleAppUrl, dataMode };
}

/**
 * A set, non-blank variable, trimmed; undefined otherwise.
 *
 * @param {Record<string, string | undefined>} env
 * @param {string} name
 */
function value(env, name) {
    const raw = env[name];

    if (raw === undefined || raw.trim() === '') {
        return undefined;
    }

    return raw.trim();
}

/**
 * An absolute http(s) URL with nothing after the host.
 *
 * @param {string} raw
 * @param {string} name
 */
function origin(raw, name) {
    const url = parse(raw, name);

    if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
        throw new SettingsError(`${name} must be an origin with no path, e.g. https://www.acme.com; got '${raw}'.`);
    }

    return url.origin;
}

/**
 * @param {string} raw
 * @param {string} name
 */
function parse(raw, name) {
    /** @type {URL} */
    let url;

    try {
        url = new URL(raw);
    } catch {
        throw new SettingsError(`${name} is not a URL: '${raw}'.`);
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new SettingsError(`${name} must be http or https; got '${raw}'.`);
    }

    if (url.username !== '' || url.password !== '') {
        throw new SettingsError(`${name} must not carry credentials.`);
    }

    return url;
}
