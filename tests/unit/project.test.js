// src/core/lib/project.js — docs/examples.md, "Where a site's files are".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_EXAMPLE, ProjectError, siteLayout } from '../../src/core/lib/project.js';

test('a site keeps its files in src/, public/ and api-fixtures/', () => {
    assert.deepEqual(siteLayout({ examples: null, requested: null }), {
        example: null, srcDir: 'src', publicDir: 'public', fixturesDir: 'api-fixtures', tsconfig: null,
    });
});

test('(1) naming an example in a site is refused', () => {
    assert.throws(() => siteLayout({ examples: null, requested: 'dentist' }), /SITE_EXAMPLE=dentist is set, but this is a site/);
});

test('the template builds the electrician unless told otherwise', () => {
    assert.equal(DEFAULT_EXAMPLE, 'electrician');
    assert.deepEqual(siteLayout({ examples: ['dentist', 'electrician'], requested: null }), {
        example: 'electrician',
        srcDir: 'examples/electrician/src',
        publicDir: 'examples/electrician/public',
        fixturesDir: 'examples/electrician/api-fixtures',
        tsconfig: 'examples/electrician/tsconfig.json',
    });
});

test('without an electrician, the first example is the default', () => {
    assert.equal(siteLayout({ examples: ['dentist', 'photographer'], requested: null }).example, 'dentist');
});

test('SITE_EXAMPLE picks an example', () => {
    assert.equal(siteLayout({ examples: ['dentist', 'electrician'], requested: 'dentist' }).srcDir, 'examples/dentist/src');
});

test('(2) a template with no examples is refused', () => {
    assert.throws(() => siteLayout({ examples: [], requested: null }), /examples\/ holds no example/);
});

test('(3) an example that is not there is named, with the ones that are', () => {
    assert.throws(
        () => siteLayout({ examples: ['dentist', 'electrician'], requested: 'plumber' }),
        (error) => error instanceof ProjectError && error.name === 'ProjectError' && /no example 'plumber'; the examples are: dentist, electrician/.test(error.message),
    );
});
