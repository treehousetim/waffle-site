// src/core/lib/redirects.js — docs/scoped-builds.md: old slugs redirect, retired ones are gone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caddyRedirects } from '../../src/core/lib/redirects.js';

test('an old slug redirects permanently to the page, with or without its slash (4)', () => {
    const snippet = caddyRedirects({ moves: [{ from: '/stays/old/', to: '/stays/new/' }], gone: [] });

    assert.match(snippet, /^redir \/stays\/old \/stays\/new\/ 301$/m);
    assert.match(snippet, /^redir \/stays\/old\/ \/stays\/new\/ 301$/m);
});

test('a retired record\'s page answers 410 Gone, never a redirect home (5)', () => {
    const snippet = caddyRedirects({ moves: [], gone: ['/stays/gone/'] });

    assert.match(snippet, /^respond \/stays\/gone 410$/m);
    assert.match(snippet, /^respond \/stays\/gone\/ 410$/m);
    assert.doesNotMatch(snippet, /redir/);
});

test('nothing to say is a comment, so the import still loads', () => {
    assert.match(caddyRedirects({ moves: [], gone: [] }), /^# Written by the build/);
});

test('only plain page paths reach the server\'s configuration', () => {
    for (const bad of ['/stays/a b/', '/stays/a/\nrespond * 500', 'stays/a/', '/stays/A/', '/']) {
        assert.throws(() => caddyRedirects({ moves: [{ from: bad, to: '/stays/a/' }], gone: [] }), /not a page path/);
        assert.throws(() => caddyRedirects({ moves: [], gone: [bad] }), /not a page path/);
    }

    assert.throws(() => caddyRedirects({ moves: [{ from: '/stays/a/', to: 'https://elsewhere.example/' }], gone: [] }), /not a page path/);
});

test('a path is never both moved and gone', () => {
    assert.throws(() => caddyRedirects({ moves: [{ from: '/stays/a/', to: '/stays/b/' }], gone: ['/stays/a/'] }), /both redirected and gone/);
});
