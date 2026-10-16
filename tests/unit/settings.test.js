// src/lib/settings.js — docs/building.md, "Build settings" failure list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSettings, DEV_SITE_URL, SettingsError } from '../../src/core/lib/settings.js';

const production = {
    SITE_ENV: 'production',
    SITE_URL: 'https://www.acme.com',
    WAFFLE_APP_URL: 'https://app.acme.com',
};

test('an empty environment is a development build that is never indexed', () => {
    assert.deepEqual(buildSettings({}), {
        env: 'development',
        production: false,
        indexable: false,
        siteUrl: DEV_SITE_URL,
        waffleAppUrl: null,
        dataMode: 'fixtures',
        example: null,
    });
});

test('blank values count as unset', () => {
    assert.equal(buildSettings({ SITE_ENV: '  ', SITE_URL: '' }).env, 'development');
});

test('a production build is indexable and reads live data', () => {
    assert.deepEqual(buildSettings(production), {
        env: 'production',
        production: true,
        indexable: true,
        siteUrl: 'https://www.acme.com',
        waffleAppUrl: 'https://app.acme.com',
        dataMode: 'live',
        example: null,
    });
});

test('(1) refuses an unknown SITE_ENV', () => {
    assert.throws(() => buildSettings({ SITE_ENV: 'prod' }), /SITE_ENV must be development or production; got 'prod'/);
});

test('(2) refuses a production build without SITE_URL', () => {
    assert.throws(() => buildSettings({ ...production, SITE_URL: undefined }), /SITE_URL is required/);
});

test('(3) refuses a production SITE_URL that is not https', () => {
    assert.throws(() => buildSettings({ ...production, SITE_URL: 'http://www.acme.com' }), /must be https/);
});

test('(4) refuses fixture data in production', () => {
    assert.throws(() => buildSettings({ ...production, WAFFLE_DATA: 'fixtures' }), /fixtures is refused/);
});

test('(5) refuses live data with nowhere to get it from', () => {
    assert.throws(() => buildSettings({ ...production, WAFFLE_APP_URL: undefined }), /WAFFLE_APP_URL is required/);
    assert.throws(() => buildSettings({ WAFFLE_DATA: 'live' }), /WAFFLE_APP_URL is required/);
});

test('development may ask for live data', () => {
    const settings = buildSettings({ WAFFLE_DATA: 'live', WAFFLE_APP_URL: 'http://localhost:8080' });

    assert.equal(settings.dataMode, 'live');
    assert.equal(settings.waffleAppUrl, 'http://localhost:8080');
});

test('refuses an unknown WAFFLE_DATA', () => {
    assert.throws(() => buildSettings({ WAFFLE_DATA: 'cache' }), /WAFFLE_DATA must be fixtures or live/);
});

test('SITE_URL is reduced to its origin and must have no path', () => {
    assert.equal(buildSettings({ SITE_URL: 'https://www.acme.com/' }).siteUrl, 'https://www.acme.com');
    assert.throws(() => buildSettings({ SITE_URL: 'https://www.acme.com/site' }), /must be an origin/);
    assert.throws(() => buildSettings({ SITE_URL: 'https://www.acme.com/?a=1' }), /must be an origin/);
    assert.throws(() => buildSettings({ SITE_URL: 'https://www.acme.com/#top' }), /must be an origin/);
});

test('WAFFLE_APP_URL is an origin too: Caddy proxies to it, and a proxy target has no path', () => {
    assert.equal(buildSettings({ WAFFLE_APP_URL: 'https://app.acme.com/' }).waffleAppUrl, 'https://app.acme.com');
    assert.throws(() => buildSettings({ WAFFLE_APP_URL: 'https://acme.com/app' }), /WAFFLE_APP_URL must be an origin/);
});

test('refuses what is not an http(s) URL, or carries credentials', () => {
    assert.throws(() => buildSettings({ SITE_URL: 'www.acme.com' }), /SITE_URL is not a URL/);
    assert.throws(() => buildSettings({ SITE_URL: 'ftp://acme.com' }), /must be http or https/);
    assert.throws(() => buildSettings({ WAFFLE_APP_URL: 'https://user:pw@app.acme.com' }), /must not carry credentials/);
});

test('errors are SettingsErrors', () => {
    assert.throws(() => buildSettings({ SITE_ENV: 'x' }), (error) => error instanceof SettingsError && error.name === 'SettingsError');
});

test('SITE_EXAMPLE names an example, and nothing that could leave examples/', () => {
    assert.equal(buildSettings({ SITE_EXAMPLE: 'photographer' }).example, 'photographer');
    assert.equal(buildSettings({ SITE_EXAMPLE: ' dental-clinic ' }).example, 'dental-clinic');

    for (const bad of ['../etc', 'Photographer', 'a/b', '-x', 'x'.repeat(42)]) {
        assert.throws(() => buildSettings({ SITE_EXAMPLE: bad }), /SITE_EXAMPLE must be an example's name/, bad);
    }
});
