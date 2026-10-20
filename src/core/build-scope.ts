/**
 * Whether this build is a full one or scoped to what changed
 * (docs/scoped-builds.md). SITE_PREVIOUS_MANIFEST names the page manifest of
 * the release being served; with it, entity pages are built only for records
 * that changed. Without it, everything is built.
 */
import { readFileSync } from 'node:fs';
import { SITE_PREVIOUS_MANIFEST, SITE_RELEASE } from 'astro:env/server';
import { parseManifest, type PageManifest } from './lib/manifest.js';

/** The code's release tag, written into the manifest: dev for a local build. */
export const release = SITE_RELEASE ?? 'dev';

export const previousManifest: PageManifest | null =
    SITE_PREVIOUS_MANIFEST === undefined ? null : parseManifest(JSON.parse(readFileSync(SITE_PREVIOUS_MANIFEST, 'utf8')));
