/**
 * Rules about the repository itself, enforced rather than documented
 * (AGENTS.md §5 and §7, docs/examples.md).
 *
 * In the template every example under examples/ is held to them; in a site,
 * its one src/ (the core, src/core/, apart).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { listExamples } from '../../src/core/lib/clients/project.js';
import { read, ROOT } from '../support/shell.js';

const walk = (dir) => (existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir), { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative(ROOT, join(entry.parentPath, entry.name)))
    : []);

/** The code, without its comments: a rule is about what runs, not what is explained. */
const code = (file) => readFileSync(join(ROOT, file), 'utf8')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
    .join('\n');

const lib = walk('src/core/lib').filter((file) => file.endsWith('.js'));
const pure = lib.filter((file) => !file.startsWith('src/core/lib/clients/'));
const examples = listExamples(ROOT);

/** Each site in the repository: its root (where example.json would be) and its src/. */
const sites = examples === null
    ? [{ name: 'site', root: '.', src: 'src', files: walk('src').filter((file) => !file.startsWith('src/core/')) }]
    : examples.map((name) => ({ name, root: `examples/${name}`, src: `examples/${name}/src`, files: walk(`examples/${name}`) }));

test('every test file is in a group: tests/unit, tests/infra or tests/e2e', () => {
    const stray = walk('tests').filter((file) => file.endsWith('.test.js') && !/^tests\/(unit|infra|e2e)\/[^/]+\.test\.js$/.test(file));

    assert.deepEqual(stray, [], 'a test outside the group directories is never reached by --group or --changed');
});

test('every module in src/core/lib has its unit test', () => {
    const missing = pure
        .map((file) => file.replace(/^src\/core\/lib\/(.+)\.js$/, 'tests/unit/$1.test.js'))
        .filter((test) => !walk('tests/unit').includes(test));

    assert.deepEqual(missing, []);
});

test('src/core/lib is pure: no network, disk, environment, Astro or console', () => {
    const forbidden = [
        [/from 'node:(fs|fs\/promises|http|https|net|child_process|os)'/, 'touches the system'],
        [/\bprocess\.env\b/, 'reads the environment (only src/core/lib/settings.js interprets it, and it is handed env)'],
        [/from 'astro:/, 'imports Astro, so it cannot be unit tested'],
        [/\bfetch\(/, 'reaches the network (src/core/lib/clients/ does that)'],
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

test('only astro.config.mjs and the build tools read the environment; pages get it through astro:env', () => {
    const readers = [...walk('src'), ...walk('examples'), 'astro.config.mjs', ...walk('tools').filter((file) => file.endsWith('.mjs'))]
        .filter((file) => /\.(js|mjs|ts|astro)$/.test(file))
        .filter((file) => /process\.env/.test(code(file)))
        .sort();

    assert.deepEqual(readers, ['astro.config.mjs', 'tools/audit.mjs', 'tools/check.mjs']);
});

test('the core reaches nothing outside itself', () => {
    const imports = /(?:from|import)\s*\(?\s*'(\.[^']+)'/g;
    const escapes = walk('src/core')
        .filter((file) => /\.(js|ts|astro)$/.test(file))
        .flatMap((file) => [...code(file).matchAll(imports)].map((match) => [file, match[1]]))
        .filter(([file, path]) => !resolve(ROOT, dirname(file), path).startsWith(join(ROOT, 'src/core')))
        .map(([file, path]) => `${file} imports ${path}`);

    assert.deepEqual(escapes, [], 'the core is shared by every example; it may not depend on one');
});

for (const site of sites) {
    const pages = site.files.filter((file) => file.startsWith(`${site.src}/pages/`) && file.endsWith('.astro'));
    const layouts = site.files.filter((file) => file.startsWith(`${site.src}/layouts/`) && file.endsWith('.astro'));

    test(`${site.name}: has every part a site needs`, () => {
        const required = examples === null
            ? ['src/site.ts', 'src/fonts.ts', 'src/content.config.ts', 'src/pages/index.astro', 'src/pages/404.astro', 'src/layouts/Base.astro',
                'src/data/photos.ts', 'tests/e2e/site.checks.js', 'public/favicon.svg']
            : ['example.json', 'PLAYBOOK.md', 'checks.js', 'tsconfig.json', 'src/site.ts', 'src/fonts.ts', 'src/content.config.ts',
                'src/pages/index.astro', 'src/pages/404.astro', 'src/pages/credits.astro', 'src/layouts/Base.astro', 'src/data/photos.ts',
                'public/favicon.svg', 'public/logo.png', 'public/og-default.png'].map((path) => `${site.root}/${path}`);

        assert.deepEqual(required.filter((path) => !existsSync(join(ROOT, path))), []);
        assert.equal(existsSync(join(ROOT, site.src, 'core')) && examples !== null, false, 'an example may not carry its own core');
    });

    if (examples !== null) {
        test(`${site.name}: example.json says what docs/examples.md asks`, () => {
            const info = JSON.parse(read(`${site.root}/example.json`));

            assert.equal(info.name, site.name);
            for (const field of ['label', 'description', 'kind', 'schemaType', 'look']) {
                assert.equal(typeof info[field], 'string', field);
                assert.ok(info[field].length > 0, field);
            }
            assert.ok(Array.isArray(info.waffleEndpoints));
            for (const endpoint of info.waffleEndpoints) {
                assert.match(endpoint, /^(GET|POST) \/api\/site\/[a-z0-9-]+(\/[a-z0-9-]+)*$/);

                if (endpoint.startsWith('GET ')) {
                    const fixture = `${site.root}/api-fixtures${endpoint.slice(4)}.json`;
                    assert.ok(existsSync(join(ROOT, fixture)), `${endpoint} has no fixture at ${fixture}`);
                }
            }
            assert.ok(read('docs/examples.md').includes(`| \`${site.name}\` |`), 'listed in docs/examples.md');
        });

        test(`${site.name}: imports nothing from another example, and the core only as @core`, () => {
            const imports = /(?:from|import)\s*\(?\s*'(\.[^']+)'/g;
            const escapes = site.files
                .filter((file) => /\.(js|ts|astro|css)$/.test(file))
                .flatMap((file) => [...code(file).matchAll(imports)].map((match) => [file, match[1]]))
                .filter(([file, path]) => !resolve(ROOT, dirname(file), path).startsWith(join(ROOT, site.root) + '/'))
                .map(([file, path]) => `${file} imports ${path}`);

            assert.deepEqual(escapes, [], 'an installed example is the site\'s own code; it cannot reach outside itself');
        });
    }

    test(`${site.name}: every page is built on Base (directly, or through a layout that is)`, () => {
        const orphans = [
            ...pages.filter((file) => !/from '(\.\.\/)+layouts\/[A-Za-z]+\.astro'/.test(code(file))),
            ...layouts.filter((file) => !file.endsWith('/Base.astro') && !/from '\.\/[A-Za-z]+\.astro'/.test(code(file))),
        ];

        assert.deepEqual(orphans, [], 'a page outside Base has no SEO head, no header and no footer');
    });

    test(`${site.name}: everything listed in src/data with a page directory has its page`, () => {
        const missing = [];

        for (const data of site.files.filter((file) => new RegExp(`^${site.src}/data/[a-z-]+\\.ts$`).test(file))) {
            const dir = `${site.src}/pages/${data.split('/').pop().replace(/\.ts$/, '')}`;

            if (!existsSync(join(ROOT, dir)) || site.files.some((file) => file.startsWith(`${dir}/[`))) {
                continue;
            }

            for (const [, slug] of read(data).matchAll(/^\s+slug: '([a-z0-9-]+)'/gm)) {
                if (!existsSync(join(ROOT, dir, `${slug}.astro`))) {
                    missing.push(`${dir}/${slug}.astro`);
                }
            }
        }

        assert.deepEqual(missing, []);
    });
}

test('every document is listed in the README\'s documentation table', () => {
    const readme = read('README.md');
    const missing = readdirSync(join(ROOT, 'docs')).filter((name) => name.endsWith('.md') && name !== 'playbook.md' && !readme.includes(`(docs/${name})`));

    assert.deepEqual(missing, []);
});

test('there is no .env file, and the ignore keeps it that way', () => {
    assert.equal(readdirSync(ROOT).some((name) => name === '.env' || /^\.env\./.test(name)), false);
    assert.match(read('.gitignore'), /^\.env\*$/m);
});

test('CLAUDE.md points at AGENTS.md and says nothing else', () => {
    assert.equal(read('CLAUDE.md').trim(), 'See @AGENTS.md');
});
