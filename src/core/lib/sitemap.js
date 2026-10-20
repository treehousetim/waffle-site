/**
 * A scoped release's sitemap (docs/scoped-builds.md). A scoped build only
 * makes the pages that changed, so its sitemap lacks the unchanged ones; the
 * release's sitemap is the served one's pages, less those removed, with the
 * built ones over them (failure 13).
 */

const URLSET = /^([\s\S]*?<urlset\b[^>]*>)([\s\S]*)<\/urlset>\s*$/;
const ENTRY = /<url>[\s\S]*?<\/url>/g;
const LOC = /<loc>([^<]+)<\/loc>/;

/**
 * @param {string} served  sitemap-0.xml of the release being served
 * @param {string} built   sitemap-0.xml of the scoped build
 * @param {readonly string[]} removed  pages removed, as planScopedRelease names them ("stays/gone")
 * @returns {string}
 */
export function mergeSitemap(served, built, removed) {
    const [, head] = parts(built);
    const gone = new Set(removed.map((dir) => `/${dir}/`));
    /** @type {Map<string, string>} */
    const entries = new Map();

    for (const entry of [...entriesOf(served), ...entriesOf(built)]) {
        const loc = /** @type {RegExpMatchArray} */ (entry.match(LOC))[1];

        if (!gone.has(new URL(loc).pathname)) {
            entries.set(loc, entry);
        }
    }

    return `${head}${[...entries.keys()].sort().map((loc) => entries.get(loc)).join('')}</urlset>`;
}

/** @param {string} xml */
function parts(xml) {
    const match = xml.match(URLSET);

    if (match === null) {
        throw new Error('sitemap: not a sitemap (no <urlset>).');
    }

    return match;
}

/** @param {string} xml */
function entriesOf(xml) {
    return parts(xml)[2].match(ENTRY) ?? [];
}
