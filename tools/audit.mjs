/**
 * tools/audit.mjs <dir> — the SEO audit, run on a finished build.
 *
 *   node tools/audit.mjs dist        # `npm run build` runs it for you
 *
 * Reads every file in the build, hands them to src/lib/audit.js (where every
 * rule lives, and is tested), prints what it found, and exits 1 on any error
 * so the build, the test gate and the deploy all stop. docs/seo.md has the
 * rules. This file only reads the disk; it is outside coverage for that.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { auditSite, servedPath, sitemapLocs } from '../src/lib/audit.js';
import { buildSettings } from '../src/lib/settings.js';
import { site } from '../src/site.ts';

const dir = process.argv[2] ?? 'dist';
const settings = buildSettings(process.env);

/** @param {string} root @returns {Promise<string[]>} */
async function walk(root) {
    const entries = await readdir(root, { withFileTypes: true, recursive: true });

    return entries.filter((entry) => entry.isFile()).map((entry) => relative(dir, join(entry.parentPath, entry.name)).split(sep).join('/'));
}

/** @param {string} file @returns {Promise<string | null>} */
async function read(file) {
    try {
        return await readFile(join(dir, file), 'utf8');
    } catch {
        return null;
    }
}

let files;

try {
    files = await walk(dir);
} catch {
    console.error(`audit: there is no build at ${dir}/. Run: ./tools/npm.sh run build`);
    process.exit(1);
}

const paths = new Set(files.map(servedPath));
const pages = [];

for (const file of files.filter((name) => name.endsWith('.html'))) {
    pages.push({ path: servedPath(file), html: /** @type {string} */ (await read(file)) });
}

// The sitemap index names the sitemaps; each sitemap names the pages.
let sitemap = null;
const index = await read('sitemap-index.xml');

if (index !== null) {
    sitemap = [];

    for (const loc of sitemapLocs(index)) {
        const xml = await read(new URL(loc).pathname.slice(1));
        sitemap.push(...(xml === null ? [] : sitemapLocs(xml)));
    }
}

const result = auditSite({
    pages,
    paths,
    siteUrl: settings.siteUrl,
    indexable: settings.indexable,
    noindexPaths: site.noindex,
    sitemap,
    robots: await read('robots.txt'),
});

for (const warning of result.warnings) {
    console.warn(`  warning  ${warning}`);
}

for (const error of result.errors) {
    console.error(`  error    ${error}`);
}

const mode = settings.indexable ? `production, ${settings.siteUrl}` : `${settings.env}, not indexable`;
console.log(`audit: ${pages.length} pages (${mode}): ${result.errors.length} errors, ${result.warnings.length} warnings.`);

process.exit(result.errors.length > 0 ? 1 : 0);
