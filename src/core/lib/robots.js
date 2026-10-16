/**
 * robots.txt. Production invites every robot in and says where the sitemap
 * is; any other build turns them all away (docs/seo.md), so a preview or a
 * staging copy never competes with the real site in search results.
 *
 * @param {{ indexable: boolean, siteUrl: string, sitemapPath: string }} options
 */
export function robotsTxt({ indexable, siteUrl, sitemapPath }) {
    if (!indexable) {
        return 'User-agent: *\nDisallow: /\n';
    }

    return `User-agent: *\nAllow: /\n\nSitemap: ${new URL(sitemapPath, siteUrl + '/').href}\n`;
}
