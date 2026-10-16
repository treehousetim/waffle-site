/**
 * The SEO audit: every rule a built page must meet, checked against the HTML
 * that ships rather than the source that produced it (docs/seo.md, whose
 * numbered rules the comments below cite).
 *
 * Pages are written by hand (or by an agent), so nothing upstream can promise
 * a page has one <h1> or a description that is not a copy of another page's.
 * This can. tools/audit.mjs reads dist/ and runs it after every build; an
 * error fails the build, a warning is printed and the build goes on.
 *
 * Pure: the files come in as strings, nothing touches the disk.
 */

import { createHash } from 'node:crypto';
import { parse } from 'node-html-parser';
import { canonicalUrl, DESCRIPTION_MAX, DESCRIPTION_MIN, isNoindex, TITLE_MAX } from './seo.js';

/**
 * @typedef {object} BuiltPage
 * @property {string} path  the URL path it is served at, e.g. /pricing/ or /404.html
 * @property {string} html
 */

/**
 * @typedef {object} AuditInput
 * @property {BuiltPage[]} pages
 * @property {Set<string>} paths   every URL path the build serves (files, and directories with an index.html)
 * @property {string} siteUrl
 * @property {boolean} indexable
 * @property {readonly string[]} noindexPaths
 * @property {string[] | null} sitemap  the <loc> URLs, null when there is no sitemap
 * @property {string | null} robots     robots.txt, null when there is none
 */

/**
 * @typedef {{ errors: string[], warnings: string[] }} AuditResult
 */

/** Paths the site proxies to the waffle app: real, though not in the build. */
const PROXIED = ['/api/site/'];

/**
 * @param {AuditInput} input
 * @returns {AuditResult}
 */
export function auditSite(input) {
    /** @type {AuditResult} */
    const result = { errors: [], warnings: [] };

    // (1) An empty build is a broken build, not a clean one.
    if (input.pages.length === 0) {
        result.errors.push('the build has no pages.');

        return result;
    }

    /** @type {Map<string, string[]>} */
    const titles = new Map();
    /** @type {Map<string, string[]>} */
    const descriptions = new Map();

    for (const page of input.pages) {
        const found = auditPage(page, input);

        result.errors.push(...found.errors.map((message) => `${page.path}: ${message}`));
        result.warnings.push(...found.warnings.map((message) => `${page.path}: ${message}`));

        if (found.title !== '') {
            titles.set(found.title, [...(titles.get(found.title) ?? []), page.path]);
        }

        if (found.description !== '') {
            descriptions.set(found.description, [...(descriptions.get(found.description) ?? []), page.path]);
        }
    }

    // (12) Two pages with one title or one description compete with each other.
    for (const [title, paths] of titles) {
        if (paths.length > 1) {
            result.errors.push(`these pages share the title "${title}": ${paths.join(', ')}`);
        }
    }

    for (const [description, paths] of descriptions) {
        if (paths.length > 1) {
            result.errors.push(`these pages share the description "${description}": ${paths.join(', ')}`);
        }
    }

    auditRobots(input, result);
    auditSitemap(input, result);

    return result;
}

/**
 * @param {BuiltPage} page
 * @param {AuditInput} input
 */
function auditPage(page, input) {
    /** @type {string[]} */
    const errors = [];
    /** @type {string[]} */
    const warnings = [];
    const root = parse(page.html, { comment: false });
    const noindex = isNoindex(page.path, input.noindexPaths);

    // (2) The language, for screen readers and for search engines' locale.
    if ((root.querySelector('html')?.getAttribute('lang') ?? '').trim() === '') {
        errors.push('<html> has no lang attribute.');
    }

    if (root.querySelector('meta[name="viewport"]') === null) {
        errors.push('no <meta name="viewport">: the page will not be treated as mobile-friendly.');
    }

    // (3) The title.
    const titleTags = root.querySelectorAll('title');
    const title = titleTags.length === 1 ? titleTags[0].text.trim() : '';

    if (titleTags.length !== 1) {
        errors.push(`expected one <title>, found ${titleTags.length}.`);
    } else if (title === '') {
        errors.push('the <title> is empty.');
    } else if (title.length > TITLE_MAX) {
        warnings.push(`the title is ${title.length} characters; past ${TITLE_MAX} it is cut off in results.`);
    }

    // (4) The description.
    const description = (meta(root, 'name', 'description') ?? '').trim();

    if (description === '') {
        errors.push('no <meta name="description">.');
    } else if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX) {
        warnings.push(`the description is ${description.length} characters; aim for ${DESCRIPTION_MIN}-${DESCRIPTION_MAX}.`);
    }

    // (5) One <h1>, with words in it.
    const headings = root.querySelectorAll('h1');

    if (headings.length !== 1) {
        errors.push(`expected one <h1>, found ${headings.length}.`);
    } else if (headings[0].text.trim() === '') {
        errors.push('the <h1> is empty.');
    }

    // (6) Robots: never index a build that is not production, and keep
    // unlisted pages out of results without hiding the rest.
    const robots = (meta(root, 'name', 'robots') ?? '').toLowerCase();

    if (robots === '') {
        errors.push('no <meta name="robots">.');
    } else if (!input.indexable && !robots.includes('noindex')) {
        errors.push(`this build is not for production, but robots may index it ("${robots}").`);
    } else if (input.indexable && noindex && !robots.includes('noindex')) {
        errors.push('this page is listed as noindex in site.ts, but robots may index it.');
    } else if (input.indexable && !noindex && robots.includes('noindex')) {
        errors.push(`robots are told not to index this page ("${robots}"); add it to noindex in site.ts if that is meant.`);
    }

    // (7) Canonical URL: every listed page names itself, absolutely.
    const canonical = root.querySelectorAll('link[rel="canonical"]');

    if (!noindex) {
        const expected = canonicalUrl(page.path, input.siteUrl);

        if (canonical.length !== 1) {
            errors.push(`expected one <link rel="canonical">, found ${canonical.length}.`);
        } else if (canonical[0].getAttribute('href') !== expected) {
            errors.push(`the canonical URL is ${canonical[0].getAttribute('href') ?? '(empty)'}, expected ${expected}.`);
        }

        // (8) Link previews: Open Graph, and Twitter's card type.
        for (const property of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image']) {
            if ((meta(root, 'property', property) ?? '').trim() === '') {
                errors.push(`no <meta property="${property}">.`);
            }
        }

        const image = meta(root, 'property', 'og:image') ?? '';

        if (image !== '' && !/^https?:\/\//.test(image)) {
            errors.push(`og:image must be an absolute URL; got ${image}.`);
        }

        if ((meta(root, 'name', 'twitter:card') ?? '') === '') {
            errors.push('no <meta name="twitter:card">.');
        }
    }

    // (9) Images: alt text always (empty is fine for decoration), and a size,
    // or the layout jumps as they load.
    for (const img of root.querySelectorAll('img')) {
        const src = img.getAttribute('src') ?? '(no src)';

        if (img.getAttribute('alt') === undefined) {
            errors.push(`<img src="${src}"> has no alt attribute.`);
        }

        if (img.getAttribute('width') === undefined || img.getAttribute('height') === undefined) {
            warnings.push(`<img src="${src}"> has no width and height; the page will shift as it loads.`);
        }
    }

    // (10) Links and assets on this site must exist in the build.
    for (const [selector, attribute] of [['a[href]', 'href'], ['img[src]', 'src'], ['link[href]', 'href'], ['script[src]', 'src']]) {
        for (const element of root.querySelectorAll(selector)) {
            // The canonical link is rule 7's to judge.
            if (element.getAttribute('rel') === 'canonical') {
                continue;
            }

            // The selector only matches elements that carry the attribute.
            const target = internalPath(String(element.getAttribute(attribute)), page.path, input.siteUrl);

            if (target !== null && !input.paths.has(target) && !PROXIED.some((prefix) => target.startsWith(prefix))) {
                errors.push(`links to ${target}, which is not in the build.`);
            }
        }
    }

    // (11) The content security policy (docs/https.md). Astro writes it into
    // every page with a hash for each script and style it inlines; anything
    // inline it does not cover is silently dead in a browser, so it is an
    // error here, where someone will see it.
    const policy = contentSecurityPolicy(root);

    if (policy === null) {
        errors.push('has no content security policy <meta>; is security.csp on in astro.config.mjs?');
    } else {
        if (!policy.has('default-src')) {
            errors.push('the content security policy has no default-src.');
        }

        for (const [directive, sources] of policy) {
            if (sources.includes("'unsafe-inline'") || sources.includes("'unsafe-eval'")) {
                errors.push(`the content security policy's ${directive} allows ${sources.includes("'unsafe-eval'") ? "'unsafe-eval'" : "'unsafe-inline'"}.`);
            }
        }
    }

    for (const script of root.querySelectorAll('script')) {
        const type = (script.getAttribute('type') ?? '').toLowerCase();

        if (type === 'application/ld+json') {
            auditJsonLd(script.text, errors);
        } else if (script.getAttribute('src') === undefined && !covered(policy, 'script-src', script.rawText)) {
            errors.push('has an inline <script> the content security policy does not hash, so browsers will not run it.');
        }
    }

    for (const style of root.querySelectorAll('style')) {
        if (!covered(policy, 'style-src', style.rawText)) {
            errors.push('has an inline <style> the content security policy does not hash, so browsers will ignore it.');
        }
    }

    // A hash covers an element's content, never an attribute.
    for (const element of root.querySelectorAll('*')) {
        for (const name of Object.keys(element.attributes)) {
            const lower = name.toLowerCase();

            if (lower === 'style') {
                errors.push(`<${element.tagName.toLowerCase()} style="..."> is blocked by the content security policy; use a class.`);
            } else if (lower.startsWith('on')) {
                errors.push(`<${element.tagName.toLowerCase()} ${lower}="..."> is blocked by the content security policy; use a script.`);
            }
        }
    }

    return { errors, warnings, title, description };
}

/**
 * (11) JSON-LD that does not parse is ignored by every search engine, silently.
 *
 * @param {string} text
 * @param {string[]} errors
 */
function auditJsonLd(text, errors) {
    /** @type {unknown} */
    let data;

    try {
        data = JSON.parse(text);
    } catch {
        errors.push('has JSON-LD that is not valid JSON.');

        return;
    }

    const context = data !== null && typeof data === 'object' ? /** @type {Record<string, unknown>} */ (data)['@context'] : undefined;

    if (context !== 'https://schema.org') {
        errors.push('has JSON-LD without "@context": "https://schema.org".');
    }
}

/**
 * The page's content security policy, directive by directive, from the
 * <meta http-equiv> Astro writes; null when there is none.
 *
 * @param {import('node-html-parser').HTMLElement} root
 * @returns {Map<string, string[]> | null}
 */
function contentSecurityPolicy(root) {
    const meta = root.querySelectorAll('meta').find((element) => (element.getAttribute('http-equiv') ?? '').toLowerCase() === 'content-security-policy');

    if (meta === undefined) {
        return null;
    }

    /** @type {Map<string, string[]>} */
    const directives = new Map();

    for (const part of (meta.getAttribute('content') ?? '').split(';')) {
        const [name, ...sources] = part.trim().split(/\s+/);

        if (name !== undefined && name !== '') {
            directives.set(name.toLowerCase(), sources);
        }
    }

    return directives;
}

/**
 * Whether inline content is allowed by its hash in a directive.
 *
 * @param {Map<string, string[]> | null} policy
 * @param {string} directive
 * @param {string} content
 */
function covered(policy, directive, content) {
    const hash = `'sha256-${createHash('sha256').update(content).digest('base64')}'`;

    return policy?.get(directive)?.includes(hash) ?? false;
}

/**
 * (13) robots.txt agrees with the build.
 *
 * @param {AuditInput} input
 * @param {AuditResult} result
 */
function auditRobots(input, result) {
    if (input.robots === null) {
        result.errors.push('there is no /robots.txt.');

        return;
    }

    const lines = input.robots.split('\n').map((line) => line.trim());

    if (!input.indexable) {
        if (!lines.includes('Disallow: /')) {
            result.errors.push('robots.txt must disallow everything in a build that is not for production.');
        }

        return;
    }

    if (lines.includes('Disallow: /')) {
        result.errors.push('robots.txt disallows the whole production site.');
    }

    if (!lines.some((line) => line.startsWith(`Sitemap: ${input.siteUrl}/`))) {
        result.errors.push(`robots.txt does not name a sitemap on ${input.siteUrl}.`);
    }
}

/**
 * (14) The sitemap lists every page that should be found, and nothing else.
 * Checked in production only: elsewhere robots are kept out anyway.
 *
 * @param {AuditInput} input
 * @param {AuditResult} result
 */
function auditSitemap(input, result) {
    if (!input.indexable) {
        return;
    }

    if (input.sitemap === null) {
        result.errors.push('there is no sitemap.');

        return;
    }

    const listed = new Set();

    for (const url of input.sitemap) {
        if (!url.startsWith(`${input.siteUrl}/`)) {
            result.errors.push(`the sitemap lists ${url}, which is not on ${input.siteUrl}.`);
            continue;
        }

        const path = url.slice(input.siteUrl.length);
        listed.add(path);

        if (!input.paths.has(path)) {
            result.errors.push(`the sitemap lists ${path}, which is not in the build.`);
        } else if (isNoindex(path, input.noindexPaths)) {
            result.errors.push(`the sitemap lists ${path}, which is noindex.`);
        }
    }

    for (const page of input.pages) {
        if (!isNoindex(page.path, input.noindexPaths) && !listed.has(page.path)) {
            result.errors.push(`${page.path} is missing from the sitemap.`);
        }
    }
}

/**
 * @param {import('node-html-parser').HTMLElement} root
 * @param {'name' | 'property'} key
 * @param {string} value
 */
function meta(root, key, value) {
    return root.querySelector(`meta[${key}="${value}"]`)?.getAttribute('content');
}

/**
 * The path on this site a link points at, or null for anything that is not
 * on this site (another host, mailto:, a fragment on the same page). Query
 * and fragment are dropped; relative links are resolved against the page.
 *
 * @param {string} href
 * @param {string} pagePath
 * @param {string} siteUrl
 * @returns {string | null}
 */
export function internalPath(href, pagePath, siteUrl) {
    const trimmed = href.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
        return null;
    }

    const url = new URL(trimmed, siteUrl + pagePath);

    if (url.origin !== siteUrl) {
        return null;
    }

    try {
        return decodeURI(url.pathname);
    } catch {
        // A malformed escape (/a%zz) names no file; report it as written.
        return url.pathname;
    }
}

/**
 * The URL path a built file is served at: index.html is its directory.
 *
 * @param {string} file  relative to the build directory, with / separators
 */
export function servedPath(file) {
    if (file === 'index.html') {
        return '/';
    }

    if (file.endsWith('/index.html')) {
        return `/${file.slice(0, -'index.html'.length)}`;
    }

    return `/${file}`;
}

/**
 * The <loc> entries of a sitemap or sitemap index.
 *
 * @param {string} xml
 */
export function sitemapLocs(xml) {
    return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, '&'));
}
