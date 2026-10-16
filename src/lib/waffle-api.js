/**
 * Build-time reads from the waffle app this site fronts (docs/waffle-api.md).
 *
 * A page that shows the app's data (the pricing plans) asks for it while the
 * site is built; the HTML that ships already contains it. Live builds ask the
 * app; development builds and the test suite read the same envelope from
 * api-fixtures/, so nobody needs the app running to work on a page.
 *
 * The network and the disk come in as functions (src/lib/clients/waffle.js
 * supplies the real ones), so every decision here is tested without either.
 * The numbers cite the failure list in docs/waffle-api.md.
 */

/** Everything the site reads lives under this prefix on the app. */
export const API_PREFIX = '/api/site/';

export class WaffleApiError extends Error {
    /** @param {string} message */
    constructor(message) {
        super(message);
        this.name = 'WaffleApiError';
    }
}

/**
 * @typedef {object} WaffleApiDeps
 * @property {'fixtures' | 'live'} mode
 * @property {string | null} baseUrl   the app's origin (and path), no trailing slash
 * @property {(url: string) => Promise<{ status: number, text: string }>} fetchText
 * @property {(relativePath: string) => Promise<string | null>} readFixture  null when missing
 */

/**
 * @param {WaffleApiDeps} deps
 * @returns {{ get: (path: string) => Promise<unknown> }}
 */
export function createWaffleApi({ mode, baseUrl, fetchText, readFixture }) {
    /** @type {Map<string, Promise<unknown>>} */
    const cache = new Map();

    if (mode === 'live' && baseUrl === null) {
        throw new WaffleApiError('live waffle data needs WAFFLE_APP_URL.');
    }

    /** @param {string} path */
    async function load(path) {
        if (mode === 'fixtures') {
            const file = fixturePath(path);
            const text = await readFixture(file);

            // (6) Say exactly which file to write, rather than "not found".
            if (text === null) {
                throw new WaffleApiError(`no fixture for ${path}: create ${file} holding {"success": true, "data": ...} (docs/waffle-api.md).`);
            }

            return unwrap(200, text, file);
        }

        const url = `${baseUrl}${path}`;
        /** @type {{ status: number, text: string }} */
        let response;

        try {
            response = await fetchText(url);
        } catch (error) {
            // (2) Unreachable, refused, timed out, or a certificate problem.
            throw new WaffleApiError(`could not reach the waffle app at ${url}: ${error instanceof Error ? error.message : String(error)}`);
        }

        return unwrap(response.status, response.text, url);
    }

    return {
        get(path) {
            assertSitePath(path);

            // (8) One request per path per build, however many pages use it.
            let pending = cache.get(path);

            if (pending === undefined) {
                pending = load(path);
                cache.set(path, pending);
            }

            return pending;
        },
    };
}

/**
 * (1) Only the site's own read endpoints: anything else on the app is not
 * this site's to read, and a path built from a variable must not be able to
 * climb out of the prefix.
 *
 * @param {string} path
 */
export function assertSitePath(path) {
    if (!/^\/api\/site\/[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*$/.test(path)) {
        throw new WaffleApiError(
            `'${path}' is not a site endpoint: paths are ${API_PREFIX}<name>, lowercase letters, digits, - and /, with no query.`,
        );
    }
}

/**
 * Where a path's fixture lives, relative to the repository root.
 *
 * @param {string} path  already checked by assertSitePath
 */
export function fixturePath(path) {
    assertSitePath(path);

    return `api-fixtures${path}.json`;
}

/**
 * The `data` of a successful response, or an error that says what was wrong.
 * The app answers every request with {"success": true, "data": ...} or
 * {"success": false, "error": "..."} (waffle's JsonResponder).
 *
 * @param {number} status
 * @param {string} text
 * @param {string} source  the URL or file, for the message
 */
export function unwrap(status, text, source) {
    /** @type {unknown} */
    let body;

    try {
        body = JSON.parse(text);
    } catch {
        // (4) A login page, a proxy's error page, an HTML 404.
        const statusNote = status >= 200 && status < 300 ? '' : ` (HTTP ${status})`;
        throw new WaffleApiError(`${source} did not answer with JSON${statusNote}; is it the waffle app, and is the endpoint there?`);
    }

    const envelope = /** @type {{ success?: unknown, data?: unknown, error?: unknown }} */ (
        body !== null && typeof body === 'object' ? body : {}
    );

    // (3) The app said no, and usually why.
    if (status < 200 || status >= 300) {
        const reason = typeof envelope.error === 'string' ? `: ${envelope.error}` : '';
        throw new WaffleApiError(`${source} answered HTTP ${status}${reason}`);
    }

    // (5) JSON, but not the envelope every waffle endpoint uses.
    if (envelope.success === false) {
        const reason = typeof envelope.error === 'string' ? envelope.error : 'no reason given';
        throw new WaffleApiError(`${source} refused: ${reason}`);
    }

    if (envelope.success !== true || !('data' in envelope)) {
        throw new WaffleApiError(`${source} did not answer with {"success": true, "data": ...}.`);
    }

    return envelope.data;
}
