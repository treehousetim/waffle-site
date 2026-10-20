#!/usr/bin/env node
/**
 * tools/scoped-release.mjs — what a scoped build ships (docs/scoped-builds.md).
 *
 *   node tools/scoped-release.mjs <dist> <served-manifest.json> <served-sitemap-0.xml> <out>
 *
 * Compares the scoped build in <dist> with the manifest of the release being
 * served, and writes to <out> only what the new release changes: the affected
 * pages that exist now, the build's assets, its manifest and redirects, and
 * the sitemap merged with the served one. The pages that no longer exist are
 * listed in <out>/.scoped-remove, one directory per line. deploy/assemble.sh
 * lays <out> over a copy of the served release on the server.
 *
 * Every decision is made in src/core/lib/manifest.js and sitemap.js; this
 * only reads and writes files.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseManifest, planScopedRelease } from '../src/core/lib/manifest.js';
import { mergeSitemap } from '../src/core/lib/sitemap.js';

const [dist, servedManifest, servedSitemap, out] = process.argv.slice(2);

if (out === undefined) {
    console.error('usage: node tools/scoped-release.mjs <dist> <served-manifest.json> <served-sitemap-0.xml> <out>');
    process.exit(2);
}

try {
    const previous = parseManifest(JSON.parse(readFileSync(servedManifest, 'utf8')));
    const next = parseManifest(JSON.parse(readFileSync(join(dist, 'pages-manifest.json'), 'utf8')));
    const plan = planScopedRelease(previous, next);

    // One sitemap file is all this merges; a site past 45,000 pages needs a
    // full build until it learns more.
    if (existsSync(join(dist, 'sitemap-1.xml'))) {
        throw new Error('the build wrote more than one sitemap file; release it as a full build.');
    }

    // A notice for a change that touched no page (or one already shipped)
    // makes no release: nothing is written, and the workflow stops here.
    if (plan.copy.length === 0 && plan.remove.length === 0) {
        console.log(`scoped release of ${next.release}: nothing changed; no release to make.`);
        process.exit(0);
    }

    mkdirSync(out, { recursive: true });

    for (const file of plan.copy) {
        // (13) A page the plan names but the build did not make is a missed
        // page, not a skip.
        if (!existsSync(join(dist, file))) {
            throw new Error(`the scoped build did not make ${file}, which changed.`);
        }

        copy(file);
    }

    for (const file of ['pages-manifest.json', 'redirects.caddy', 'sitemap-index.xml']) {
        copy(file);
    }

    // Hashed assets: new names for anything new, never a changed file.
    if (existsSync(join(dist, '_astro'))) {
        for (const entry of readdirSync(join(dist, '_astro'), { recursive: true, withFileTypes: true }).filter((item) => item.isFile())) {
            copy(join(entry.parentPath, entry.name).slice(dist.length + 1));
        }
    }

    writeFileSync(join(out, 'sitemap-0.xml'), mergeSitemap(readFileSync(servedSitemap, 'utf8'), readFileSync(join(dist, 'sitemap-0.xml'), 'utf8'), plan.remove));
    writeFileSync(join(out, '.scoped-remove'), plan.remove.map((dir) => `${dir}\n`).join(''));

    console.log(`scoped release of ${next.release}: ${plan.copy.length} page(s) changed, ${plan.remove.length} removed`);
    for (const file of plan.copy) console.log(`  changed  /${file.replace(/index\.html$/, '')}`);
    for (const dir of plan.remove) console.log(`  removed  /${dir}/`);
} catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}

/**
 * One file from the build to <out>, at the same path. Read and written,
 * not copied: a kernel copy fails on some mounted volumes.
 *
 * @param {string} file
 */
function copy(file) {
    mkdirSync(dirname(join(out, file)), { recursive: true });
    writeFileSync(join(out, file), readFileSync(join(dist, file)));
}
