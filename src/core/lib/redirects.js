/**
 * Redirects and 410s from data (docs/data-pages.md, decision 7): the build
 * writes them as a Caddy snippet beside the pages, which the Caddyfile
 * imports, so a release carries its own. An old slug redirects permanently
 * to its record's page (failure 4); a retired record's pages answer 410 Gone,
 * never a redirect home (failure 5).
 *
 * The snippet is server configuration, so only paths made of slugs reach it.
 */

/** A page under the site's root, never the root itself. */
const PAGE = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)+$/;

/**
 * @param {{ moves: readonly { from: string, to: string }[], gone: readonly string[] }} rules
 * @returns {string}
 */
export function caddyRedirects({ moves, gone }) {
    for (const path of [...moves.flatMap((move) => [move.from, move.to]), ...gone]) {
        if (!PAGE.test(path)) {
            throw new Error(`redirects: ${JSON.stringify(path)} is not a page path.`);
        }
    }

    const moved = new Set(moves.map((move) => move.from));

    for (const path of gone) {
        if (moved.has(path)) {
            throw new Error(`redirects: ${path} is both redirected and gone.`);
        }
    }

    const lines = [
        '# Written by the build from the waffle app\'s data (docs/scoped-builds.md). Do not edit.',
        ...moves.flatMap(({ from, to }) => [`redir ${from.slice(0, -1)} ${to} 301`, `redir ${from} ${to} 301`]),
        ...gone.flatMap((path) => [`respond ${path.slice(0, -1)} 410`, `respond ${path} 410`]),
    ];

    return `${lines.join('\n')}\n`;
}
