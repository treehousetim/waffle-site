/**
 * The browser half of a form that the waffle app receives (docs/forms.md).
 *
 * Forms post to /api/site/forms/<name> on this site, which Caddy forwards to
 * the waffle app (docs/waffle-api.md). Without JavaScript the browser posts
 * the form itself and the app answers with a redirect; with it,
 * src/scripts/forms.ts sends JSON and uses these functions to read the
 * answer. Pure, so the rules are tested without a browser.
 */

/**
 * A field no person sees or fills in (it is hidden with CSS and taken out of
 * the tab order). A bot that fills every field fills this one too, and the
 * app throws the submission away while answering as if it had worked.
 */
export const HONEYPOT = 'company_website';

/**
 * The JSON body for a submission: every text field trimmed, files dropped
 * (no form here takes one), and a name that appears more than once (a group
 * of checkboxes) collected into a list. The honeypot is sent as it was, empty
 * or not, because the app is what decides.
 *
 * @param {Iterable<[string, unknown]>} entries  e.g. a FormData
 * @returns {Record<string, string | string[]>}
 */
export function formPayload(entries) {
    /** @type {Record<string, string | string[]>} */
    const payload = {};

    for (const [name, raw] of entries) {
        if (typeof raw !== 'string') {
            continue;
        }

        const value = raw.trim();
        const existing = payload[name];

        if (existing === undefined) {
            payload[name] = value;
        } else if (Array.isArray(existing)) {
            existing.push(value);
        } else {
            payload[name] = [existing, value];
        }
    }

    return payload;
}

/**
 * @typedef {object} Outcome
 * @property {'sent' | 'invalid' | 'failed'} kind
 * @property {string} message                 shown to the person
 * @property {Record<string, string>} fields  per-field problems, by field name
 */

const FAILED = 'Sorry, that did not send. Please try again in a moment.';

/**
 * What to tell the person, from the app's answer (docs/forms.md, "What the
 * app sends back").
 *
 * @param {number} status
 * @param {unknown} body  the parsed JSON, or null when it was not JSON
 * @returns {Outcome}
 */
export function submissionOutcome(status, body) {
    const envelope = /** @type {{ success?: unknown, data?: unknown, error?: unknown, fields?: unknown }} */ (
        body !== null && typeof body === 'object' ? body : {}
    );

    if (status >= 200 && status < 300 && envelope.success === true) {
        const data = /** @type {{ message?: unknown }} */ (envelope.data !== null && typeof envelope.data === 'object' ? envelope.data : {});

        return {
            kind: 'sent',
            message: typeof data.message === 'string' && data.message !== '' ? data.message : 'Thanks, we have it.',
            fields: {},
        };
    }

    if (status === 422) {
        return {
            kind: 'invalid',
            message: typeof envelope.error === 'string' && envelope.error !== '' ? envelope.error : 'Please check the highlighted fields.',
            fields: fieldMessages(envelope.fields),
        };
    }

    if (status === 429) {
        return { kind: 'failed', message: 'Too many tries. Please wait a minute and send it again.', fields: {} };
    }

    // A 4xx the app explained is worth showing; a 5xx, a 502 from the proxy
    // when the app is down, or a body that was not JSON gets the generic line.
    if (status >= 400 && status < 500 && typeof envelope.error === 'string' && envelope.error !== '') {
        return { kind: 'failed', message: envelope.error, fields: {} };
    }

    return { kind: 'failed', message: FAILED, fields: {} };
}

/**
 * @param {unknown} raw
 * @returns {Record<string, string>}
 */
function fieldMessages(raw) {
    /** @type {Record<string, string>} */
    const fields = {};

    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        return fields;
    }

    for (const [name, message] of Object.entries(raw)) {
        if (typeof message === 'string' && message !== '') {
            fields[name] = message;
        }
    }

    return fields;
}
