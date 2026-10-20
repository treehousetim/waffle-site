/**
 * The page manifest and scoped builds (docs/scoped-builds.md; docs/data-pages.md,
 * decision 8).
 *
 * Every build writes a manifest beside its pages: the fingerprint of every
 * record it read, and which records every data page was built from
 * ("properties:lakeside-cabin", or "properties:*" for a page that lists them all). A
 * rebuild after a change notice compares the new data with the manifest of
 * the release being served: the records that changed give the pages they
 * touch, before and after, and only those are built and shipped. Pure, so
 * every decision is tested here; tools/scoped-release.mjs does the copying.
 */

/** A record key: "<type>:<slug>", or "<type>:*" for every record of a type. */
const KEY = /^[a-z][a-z0-9_]*:(?:\*|[a-z0-9]+(?:-[a-z0-9]+)*)$/;

/** A page's path, as the build writes it: /, /stays/, /stays/lakeside-cabin/. */
const PAGE = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*$/;

export class ManifestError extends Error {
    /** @param {string} message */
    constructor(message) {
        super(message);
        this.name = 'ManifestError';
    }
}

/**
 * @typedef {object} PageManifest
 * @property {string} release                   the code's release tag: what built it
 * @property {Record<string, string>} records   record key => fingerprint
 * @property {Record<string, string[]>} pages   page path => the record keys it used
 */

/**
 * @param {{
 *   release: string,
 *   records: readonly { key: string, fingerprint: string }[],
 *   pages: readonly { path: string, uses: readonly string[] }[],
 * }} build
 * @returns {PageManifest}
 */
export function createManifest({ release, records, pages }) {
    return parseManifest({
        release,
        records: Object.fromEntries(records.map((record) => /** @type {[string, string]} */ ([record.key, record.fingerprint])).sort(byFirst)),
        pages: Object.fromEntries(pages.map((page) => /** @type {[string, string[]]} */ ([page.path, [...page.uses]])).sort(byFirst)),
    });
}

/**
 * @param {unknown} value
 * @returns {PageManifest}
 */
export function parseManifest(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new ManifestError('page manifest: expected an object.');
    }

    const { release, records, pages } = /** @type {Record<string, unknown>} */ (value);

    if (typeof release !== 'string' || !/^v[1-9][0-9]*$|^dev$/.test(release)) {
        throw new ManifestError('page manifest.release: expected a release tag, like v7.');
    }

    if (!isMap(records, (key, fingerprint) => KEY.test(key) && !key.endsWith(':*') && typeof fingerprint === 'string')) {
        throw new ManifestError('page manifest.records: expected record keys with their fingerprints.');
    }

    if (!isMap(pages, (path, uses) => PAGE.test(path) && Array.isArray(uses) && uses.every((key) => typeof key === 'string' && KEY.test(key)))) {
        throw new ManifestError('page manifest.pages: expected page paths with the record keys each uses.');
    }

    return /** @type {PageManifest} */ ({ release, records, pages });
}

/**
 * The records that are new, gone, or different.
 *
 * @param {PageManifest} previous
 * @param {PageManifest} next
 * @returns {Set<string>}
 */
export function changedKeys(previous, next) {
    const keys = new Set([...Object.keys(previous.records), ...Object.keys(next.records)]);

    return new Set([...keys].filter((key) => previous.records[key] !== next.records[key]));
}

/**
 * Every page that used a changed record in the release being served, or
 * uses one now (failure 13): the page a record left, the page it moved to,
 * every list that shows its type.
 *
 * @param {PageManifest} previous
 * @param {PageManifest} next
 * @returns {string[]} sorted
 */
export function affectedPages(previous, next) {
    const changed = changedKeys(previous, next);
    const types = new Set([...changed].map((key) => key.slice(0, key.indexOf(':'))));
    /** @param {string} key */
    const touched = (key) => (key.endsWith(':*') ? types.has(key.slice(0, -2)) : changed.has(key));
    const paths = new Set();

    for (const pages of [previous.pages, next.pages]) {
        for (const [path, uses] of Object.entries(pages)) {
            if (uses.some(touched)) {
                paths.add(path);
            }
        }
    }

    return [...paths].sort();
}

/**
 * Whether a scoped build makes this record's own page: always without a
 * previous manifest (a full build), otherwise only when the record changed
 * (failure 14).
 *
 * @param {PageManifest | null} previous
 * @param {{ key: string, fingerprint: string }} record
 */
export function wants(previous, record) {
    return previous === null || previous.records[record.key] !== record.fingerprint;
}

/** @param {string} path  a page path */
export function pageFile(path) {
    return `${path.slice(1)}index.html`;
}

/**
 * What a scoped release changes in a copy of the one being served: the
 * affected pages that exist now are copied from the new build, and those
 * that no longer exist are removed. Refused unless both were built from the
 * same code (failure 15).
 *
 * @param {PageManifest} previous  the served release's
 * @param {PageManifest} next      the scoped build's
 * @returns {{ copy: string[], remove: string[] }}
 */
export function planScopedRelease(previous, next) {
    if (previous.release !== next.release) {
        throw new ManifestError(`the scoped build was built from ${next.release}, but ${previous.release} is being served; a data rebuild uses the served release's code.`);
    }

    const affected = affectedPages(previous, next);

    return {
        copy: affected.filter((path) => path in next.pages).map(pageFile).sort(),
        remove: affected.filter((path) => !(path in next.pages)).map((path) => path.slice(1, -1)),
    };
}

/**
 * @param {unknown} value
 * @param {(key: string, item: unknown) => boolean} valid
 */
function isMap(value, valid) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
        && Object.entries(value).every(([key, item]) => valid(key, item));
}

/** @param {[string, unknown]} a @param {[string, unknown]} b */
function byFirst(a, b) {
    return a[0] < b[0] ? -1 : 1;
}
