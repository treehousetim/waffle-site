// src/lib/forms.js — docs/forms.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formPayload, HONEYPOT, submissionOutcome } from '../../src/lib/forms.js';

test('text fields are trimmed and files are dropped', () => {
    assert.deepEqual(formPayload([['name', '  Sam '], ['upload', new Blob(['x'])], ['email', 'sam@acme.com']]), {
        name: 'Sam',
        email: 'sam@acme.com',
    });
});

test('a repeated name becomes a list', () => {
    assert.deepEqual(formPayload([['topic', 'a'], ['topic', 'b'], ['topic', 'c']]), { topic: ['a', 'b', 'c'] });
});

test('the honeypot is passed on for the app to judge', () => {
    assert.equal(HONEYPOT, 'company_website');
    assert.deepEqual(formPayload([[HONEYPOT, 'spam.example']]), { company_website: 'spam.example' });
});

test('a 2xx success uses the app\'s message, or a default', () => {
    assert.deepEqual(submissionOutcome(200, { success: true, data: { message: 'We will reply today.' } }), {
        kind: 'sent', message: 'We will reply today.', fields: {},
    });
    assert.equal(submissionOutcome(201, { success: true, data: null }).message, 'Thanks, we have it.');
    assert.equal(submissionOutcome(200, { success: true, data: { message: '' } }).message, 'Thanks, we have it.');
});

test('a 2xx that is not a success envelope is a failure', () => {
    assert.equal(submissionOutcome(200, { success: false }).kind, 'failed');
    assert.equal(submissionOutcome(200, null).kind, 'failed');
});

test('422 carries the field problems', () => {
    assert.deepEqual(submissionOutcome(422, { success: false, error: 'Fix two things.', fields: { email: 'Not an email.', name: '', age: 3 } }), {
        kind: 'invalid', message: 'Fix two things.', fields: { email: 'Not an email.' },
    });
    assert.deepEqual(submissionOutcome(422, { success: false, fields: ['x'] }), {
        kind: 'invalid', message: 'Please check the highlighted fields.', fields: {},
    });
    assert.deepEqual(submissionOutcome(422, null).fields, {});
});

test('429 asks the person to wait', () => {
    assert.match(submissionOutcome(429, { success: false, error: 'Slow down.' }).message, /Too many tries/);
});

test('an explained 4xx is shown; anything else gets the generic line', () => {
    assert.equal(submissionOutcome(403, { success: false, error: 'Forms are closed.' }).message, 'Forms are closed.');
    assert.match(submissionOutcome(403, { success: false, error: '' }).message, /did not send/);
    assert.match(submissionOutcome(502, null).message, /did not send/);
    assert.match(submissionOutcome(500, { success: false, error: 'SQLSTATE[...]' }).message, /did not send/);
});
