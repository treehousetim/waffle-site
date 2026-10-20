/**
 * The network and the disk for src/lib/waffle-api.js, and nothing else.
 *
 * Outside coverage for the one reason AGENTS.md accepts: it only reaches the
 * outside world. Every decision about what comes back is made, and tested,
 * in waffle-api.js.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

/** Long enough for a slow app, short enough that a hung one fails the build. */
const TIMEOUT_MS = 15_000;

/**
 * One GET, no redirects followed: a redirect from an API endpoint is a
 * login page or a moved app, and waffle-api.js reports it as a status.
 *
 * @param {string} url
 * @returns {Promise<{ status: number, text: string }>}
 */
export async function fetchText(url) {
    const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    return { status: response.status, text: await response.text() };
}

/**
 * @param {string} relativePath  from the repository root
 * @returns {Promise<string | null>}
 */
export async function readFixture(relativePath) {
    try {
        return await readFile(resolve(process.cwd(), relativePath), 'utf8');
    } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            return null;
        }

        throw error;
    }
}

/**
 * An image from the waffle app, as bytes, for the build to resize (Waffle's
 * docs/content.md, "Media"). Live builds fetch it from the app; development
 * builds read the same path under the fixtures directory.
 *
 * @param {{ mode: 'fixtures' | 'live', baseUrl: string | null, fixturesDir: string }} source
 * @param {string} path  /api/site/media/<id>.jpg
 * @returns {Promise<Uint8Array>}
 */
export async function fetchImage({ mode, baseUrl, fixturesDir }, path) {
    if (mode === 'fixtures') {
        return new Uint8Array(await readFile(resolve(process.cwd(), fixturesDir, path.slice(1))));
    }

    const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });

    if (response.status !== 200) {
        throw new Error(`the waffle app answered ${response.status} for ${path}`);
    }

    return new Uint8Array(await response.arrayBuffer());
}
