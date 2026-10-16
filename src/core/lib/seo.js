/**
 * What goes in a page's <head> for search engines and link previews.
 *
 * src/components/Seo.astro renders it; tools/audit.mjs checks the result in
 * the built HTML (docs/seo.md). Pure: settings and site details come in as
 * arguments.
 */

/** Titles longer than this are cut off in search results (docs/seo.md). */
export const TITLE_MAX = 65;
/** Descriptions are cut off after roughly this many characters... */
export const DESCRIPTION_MAX = 160;
/** ...and shorter ones are usually replaced by text the engine picks itself. */
export const DESCRIPTION_MIN = 50;

/**
 * The <title>: the page's own title, then the site name, unless the page
 * title already says it (the home page usually does).
 *
 * @param {string} title
 * @param {string} siteName
 */
export function pageTitle(title, siteName) {
    const trimmed = title.trim();

    if (trimmed === '') {
        return siteName;
    }

    if (trimmed.toLowerCase().includes(siteName.toLowerCase())) {
        return trimmed;
    }

    return `${trimmed} — ${siteName}`;
}

/**
 * The canonical URL for a path: absolute, on the site's own origin, with a
 * trailing slash for pages (the shape Astro builds and Caddy serves), and
 * without query or fragment, so every variant of a URL names the same page.
 *
 * @param {string} pathname
 * @param {string} siteUrl  origin, no trailing slash
 */
export function canonicalUrl(pathname, siteUrl) {
    const url = new URL(pathname, siteUrl + '/');
    let path = url.pathname;

    // A file (robots.txt, feed.xml, 404.html) keeps its name; a page ends in /.
    if (!path.endsWith('/') && !/\.[a-z0-9]+$/i.test(path)) {
        path += '/';
    }

    return siteUrl + path;
}

/**
 * An absolute URL for something that may be a path or already absolute: an
 * Open Graph image must be absolute, or no link preview will show it.
 *
 * @param {string} pathOrUrl
 * @param {string} siteUrl
 */
export function absoluteUrl(pathOrUrl, siteUrl) {
    return new URL(pathOrUrl, siteUrl + '/').href;
}

/**
 * The robots meta value. A build that is not indexable (anything but
 * production) tells robots to stay out entirely; a production page that
 * should not be listed (a thank-you page, the 404) is still followed, so the
 * links on it count.
 *
 * @param {{ indexable: boolean, noindex: boolean }} options
 */
export function robotsMeta({ indexable, noindex }) {
    if (!indexable) {
        return 'noindex, nofollow';
    }

    return noindex ? 'noindex, follow' : 'index, follow';
}

/**
 * Whether a path is one the site has chosen to keep out of search results,
 * given the list in src/site.ts. Matched with and without the trailing slash,
 * so `/404` and `/404/` and `/404.html` are one entry.
 *
 * @param {string} pathname
 * @param {readonly string[]} noindexPaths
 */
export function isNoindex(pathname, noindexPaths) {
    const normalise = (/** @type {string} */ path) => path.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    const target = normalise(pathname);

    return noindexPaths.some((path) => normalise(path) === target);
}
