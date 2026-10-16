/**
 * Rules about the repository itself, enforced rather than documented
 * (AGENTS.md §5 and §7).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { read, ROOT } from '../support/shell.js';

const walk = (dir) => readdirSync(join(ROOT, dir), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(ROOT, join(entry.parentPath, entry.name)));

/** The code, without its comments: a rule is about what runs, not what is explained. */
const code = (file) => readFileSync(join(ROOT, file), 'utf8')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
    .join('\n');

const lib = walk('src/lib').filter((file) => file.endsWith('.js'));
const pure = lib.filter((file) => !file.startsWith('src/lib/clients/'));

test('every test file is in a group: tests/unit, tests/infra or tests/e2e', () => {
    const stray = walk('tests').filter((file) => file.endsWith('.test.js') && !/^tests\/(unit|infra|e2e)\/[^/]+\.test\.js$/.test(file));

    assert.deepEqual(stray, [], 'a test outside the group directories is never reached by --group or --changed');
});

test('every module in src/lib has its unit test', () => {
    const missing = pure
        .map((file) => file.replace(/^src\/lib\/(.+)\.js$/, 'tests/unit/$1.test.js'))
        .filter((test) => !walk('tests/unit').includes(test));

    assert.deepEqual(missing, []);
});

test('src/lib is pure: no network, disk, environment, Astro or console', () => {
    const forbidden = [
        [/from 'node:(fs|fs\/promises|http|https|net|child_process|os)'/, 'touches the system'],
        [/\bprocess\.env\b/, 'reads the environment (only src/lib/settings.js interprets it, and it is handed env)'],
        [/from 'astro:/, 'imports Astro, so it cannot be unit tested'],
        [/\bfetch\(/, 'reaches the network (src/lib/clients/ does that)'],
        [/\bconsole\./, 'prints'],
    ];
    const offenders = [];

    for (const file of pure) {
        const text = code(file);

        for (const [pattern, why] of forbidden) {
            if (pattern.test(text)) {
                offenders.push(`${file} ${why}`);
            }
        }
    }

    assert.deepEqual(offenders, []);
});

test('only astro.config.mjs, src/settings.ts and tools/audit.mjs read the environment', () => {
    const readers = [...walk('src'), 'astro.config.mjs', ...walk('tools').filter((file) => file.endsWith('.mjs'))]
        .filter((file) => /\.(js|mjs|ts|astro)$/.test(file))
        .filter((file) => /process\.env/.test(code(file)))
        .sort();

    assert.deepEqual(readers, ['astro.config.mjs', 'src/settings.ts', 'tools/audit.mjs']);
});

test('every page is built on Base (directly, or through a layout that is)', () => {
    const pages = walk('src/pages').filter((file) => file.endsWith('.astro'));
    const layouts = walk('src/layouts').filter((file) => file.endsWith('.astro'));
    const usesBase = (text) => /from '(\.\.\/)+layouts\/(Base|BlogPost|ServicePage|AreaPage)\.astro'/.test(text) || /from '\.\/Base\.astro'/.test(text);
    const orphans = [...pages, ...layouts.filter((file) => !file.endsWith('/Base.astro'))]
        .filter((file) => !usesBase(readFileSync(join(ROOT, file), 'utf8')));

    assert.deepEqual(orphans, [], 'a page outside Base has no SEO head, no header and no footer');
});

test('every service and town listed in src/data has its own page', () => {
    const slugs = (file) => [...read(file).matchAll(/slug: '([a-z0-9-]+)'/g)].map((match) => match[1]);

    for (const slug of slugs('src/data/services.ts')) {
        assert.ok(walk('src/pages/services').includes(`src/pages/services/${slug}.astro`), `no page for service ${slug}`);
    }

    for (const slug of slugs('src/data/areas.ts')) {
        assert.ok(walk('src/pages/areas').includes(`src/pages/areas/${slug}.astro`), `no page for area ${slug}`);
    }
});

test('every document is listed in the README\'s documentation table', () => {
    const readme = read('README.md');
    const missing = readdirSync(join(ROOT, 'docs')).filter((name) => name.endsWith('.md') && !readme.includes(`(docs/${name})`));

    assert.deepEqual(missing, []);
});

test('there is no .env file, and the ignore keeps it that way', () => {
    assert.equal(readdirSync(ROOT).some((name) => name === '.env' || /^\.env\./.test(name)), false);
    assert.match(read('.gitignore'), /^\.env\*$/m);
});

test('CLAUDE.md points at AGENTS.md and says nothing else', () => {
    assert.equal(read('CLAUDE.md').trim(), 'See @AGENTS.md');
});
