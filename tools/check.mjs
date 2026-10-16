/**
 * tools/check.mjs — astro check, on the site being built.
 *
 * In a site that is plain `astro check`. In the template repository each
 * example has its own tsconfig.json, because each example's content
 * collections are its own, and checking one example against another's
 * would fail on types that are not there. Run by `npm run build`.
 */
import { spawnSync } from 'node:child_process';
import { loadProject } from '../src/core/lib/clients/project.js';

const { layout } = loadProject(process.env);
const args = ['astro', 'check', ...(layout.tsconfig === null ? [] : ['--tsconfig', layout.tsconfig])];

if (layout.example !== null) {
    console.log(`check: example ${layout.example}`);
}

const result = spawnSync('npx', args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
