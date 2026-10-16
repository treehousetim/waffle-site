// src/lib/waffle-api.js — docs/waffle-api.md, build-time reads, failure list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { API_PREFIX, assertSitePath, createWaffleApi, fixturePath, unwrap, WaffleApiError } from '../../src/lib/waffle-api.js';

const ok = (data) => JSON.stringify({ success: true, data });

/** A network that answers from a table and records what was asked. */
function fakeNetwork(table) {
    const calls = [];

    return {
        calls,
        fetchText: async (url) => {
            calls.push(url);
            const answer = table[url];

            if (answer instanceof Error) {
                throw answer;
            }

            if (answer === undefined) {
                throw new Error(`fake network: nothing at ${url}`);
            }

            return answer;
        },
    };
}

const noDisk = async () => {
    throw new Error('the disk was read in live mode');
};

test('live mode reads the data from the app', async () => {
    const net = fakeNetwork({ 'https://app.acme.com/api/site/plans': { status: 200, text: ok([1, 2]) } });
    const api = createWaffleApi({ mode: 'live', baseUrl: 'https://app.acme.com', fetchText: net.fetchText, readFixture: noDisk });

    assert.deepEqual(await api.get('/api/site/plans'), [1, 2]);
});

test('(8) a path is fetched once per build however often it is asked for', async () => {
    const net = fakeNetwork({ 'https://app.acme.com/api/site/plans': { status: 200, text: ok('x') } });
    const api = createWaffleApi({ mode: 'live', baseUrl: 'https://app.acme.com', fetchText: net.fetchText, readFixture: noDisk });

    await Promise.all([api.get('/api/site/plans'), api.get('/api/site/plans')]);
    await api.get('/api/site/plans');

    assert.equal(net.calls.length, 1);
});

test('(2) an unreachable app fails the build naming the URL', async () => {
    const net = fakeNetwork({ 'https://app.acme.com/api/site/plans': new Error('connect ECONNREFUSED') });
    const api = createWaffleApi({ mode: 'live', baseUrl: 'https://app.acme.com', fetchText: net.fetchText, readFixture: noDisk });

    await assert.rejects(api.get('/api/site/plans'), /could not reach the waffle app at https:\/\/app\.acme\.com\/api\/site\/plans: connect ECONNREFUSED/);
});

test('(2) a thrown non-Error is reported too', async () => {
    const api = createWaffleApi({
        mode: 'live',
        baseUrl: 'https://app.acme.com',
        fetchText: async () => { throw 'boom'; },
        readFixture: noDisk,
    });

    await assert.rejects(api.get('/api/site/plans'), /could not reach the waffle app at .*: boom/);
});

test('live mode without an app URL is refused up front', () => {
    assert.throws(() => createWaffleApi({ mode: 'live', baseUrl: null, fetchText: async () => ({}), readFixture: noDisk }), /needs WAFFLE_APP_URL/);
});

test('fixture mode reads api-fixtures and never the network', async () => {
    const read = [];
    const api = createWaffleApi({
        mode: 'fixtures',
        baseUrl: null,
        fetchText: async () => { throw new Error('the network was used in fixture mode'); },
        readFixture: async (file) => { read.push(file); return ok({ plans: true }); },
    });

    assert.deepEqual(await api.get('/api/site/plans'), { plans: true });
    assert.deepEqual(read, ['api-fixtures/api/site/plans.json']);
});

test('(6) a missing fixture says which file to create', async () => {
    const api = createWaffleApi({ mode: 'fixtures', baseUrl: null, fetchText: noDisk, readFixture: async () => null });

    await assert.rejects(api.get('/api/site/team-members'), /no fixture for \/api\/site\/team-members: create api-fixtures\/api\/site\/team-members\.json/);
});

test('(1) only site endpoints may be read', () => {
    for (const bad of ['/api/users', '/api/site/', '/api/site/../auth/me', '/api/site/plans?x=1', 'api/site/plans', '/api/site/Plans', '/api/site/plans/', '/api/site//plans']) {
        assert.throws(() => assertSitePath(bad), WaffleApiError, bad);
    }

    assert.doesNotThrow(() => assertSitePath('/api/site/plans'));
    assert.doesNotThrow(() => assertSitePath('/api/site/catalog/featured-items'));
    assert.equal(API_PREFIX, '/api/site/');
});

test('(1) get refuses a bad path before any request', async () => {
    const net = fakeNetwork({});
    const api = createWaffleApi({ mode: 'live', baseUrl: 'https://app.acme.com', fetchText: net.fetchText, readFixture: noDisk });

    assert.throws(() => api.get('/api/auth/me'), /not a site endpoint/);
    assert.equal(net.calls.length, 0);
});

test('fixture paths mirror the endpoint', () => {
    assert.equal(fixturePath('/api/site/plans'), 'api-fixtures/api/site/plans.json');
    assert.throws(() => fixturePath('/etc/passwd'), WaffleApiError);
});

test('(3) a refusal reports the status and the app\'s reason', () => {
    assert.throws(() => unwrap(403, JSON.stringify({ success: false, error: 'Bad site key.' }), 'U'), /U answered HTTP 403: Bad site key\./);
    assert.throws(() => unwrap(500, JSON.stringify({ success: false }), 'U'), /U answered HTTP 500$/);
    assert.throws(() => unwrap(302, '[]', 'U'), /U answered HTTP 302/);
});

test('(4) a body that is not JSON is named as such, with the status when it was not 2xx', () => {
    assert.throws(() => unwrap(200, '<!doctype html>', 'U'), /U did not answer with JSON; is it the waffle app/);
    assert.throws(() => unwrap(404, 'Not Found', 'U'), /U did not answer with JSON \(HTTP 404\)/);
});

test('(5) JSON that is not the envelope is refused', () => {
    assert.throws(() => unwrap(200, '[1,2]', 'U'), /did not answer with \{"success": true, "data": \.\.\.\}/);
    assert.throws(() => unwrap(200, 'null', 'U'), /did not answer with \{"success"/);
    assert.throws(() => unwrap(200, JSON.stringify({ success: true }), 'U'), /did not answer with \{"success"/);
    assert.throws(() => unwrap(200, JSON.stringify({ success: false, error: 'Disabled.' }), 'U'), /U refused: Disabled\./);
    assert.throws(() => unwrap(200, JSON.stringify({ success: false }), 'U'), /U refused: no reason given/);
});

test('a null data is still data', () => {
    assert.equal(unwrap(200, JSON.stringify({ success: true, data: null }), 'U'), null);
});
