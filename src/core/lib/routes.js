/**
 * Pages the waffle app publishes at the top level (/<slug>/) beside the
 * site's own: the site's code owns layout, so an app page whose slug is one
 * of the site's own pages or folders fails the build rather than silently
 * losing to it, or replacing it (Waffle's docs/content-model.md, principle 1).
 */

/**
 * The first path segment of every page file, as import.meta.glob names them
 * relative to src/pages ("./about.astro" -> "about").
 *
 * @param {readonly string[]} files
 * @returns {Set<string>}
 */
export function topLevelNames(files) {
    return new Set(files.map((file) => file.split('/')[1].replace(/\.(astro|ts|js|md)$/, '')));
}

/**
 * @param {readonly string[]} slugs  the app's page slugs
 * @param {Set<string>} own          topLevelNames() of the site's pages
 */
export function assertFreeSlugs(slugs, own) {
    for (const slug of slugs) {
        if (own.has(slug)) {
            throw new Error(`The app's page '${slug}' would replace the site's own /${slug}/: give one of them another slug.`);
        }
    }
}
