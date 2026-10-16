/**
 * The disk half of src/core/lib/project.js: which examples exist. Outside
 * coverage for the reason AGENTS.md accepts; the decisions are made, and
 * tested, in project.js and settings.js.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { siteLayout } from '../project.js';
import { buildSettings } from '../settings.js';

/**
 * The examples under examples/ (directories holding an example.json), or
 * null when there is no examples/ directory: a site, not the template.
 *
 * @param {string} root
 * @returns {string[] | null}
 */
export function listExamples(root) {
    const dir = join(root, 'examples');

    if (!existsSync(dir)) {
        return null;
    }

    return readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && existsSync(join(dir, entry.name, 'example.json')))
        .map((entry) => entry.name)
        .sort();
}

/**
 * The build's settings and where its files are.
 *
 * @param {Record<string, string | undefined>} env
 * @param {string} [root]
 */
export function loadProject(env, root = process.cwd()) {
    const settings = buildSettings(env);

    return { settings, layout: siteLayout({ examples: listExamples(root), requested: settings.example }) };
}
