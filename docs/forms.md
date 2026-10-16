# Forms

A form on this site is received by the waffle app (docs/waffle-api.md). The
site only draws it and reads the answer.

## How a submission travels

1. The form posts to `/api/site/forms/<name>` on this site (`QuoteForm`
   posts to `/api/site/forms/quote`).
2. **With script** (`src/scripts/forms.ts`), the browser sends the fields as
   JSON and shows the app's answer in place: a message, and a note under each
   field the app rejected.
3. **Without script**, the browser checks the fields itself (`required`,
   `type="email"`, `pattern`, `maxlength`) and posts the form; the app answers
   with a redirect to the `redirect` field's path (`/contact/thanks/`).
4. Caddy forwards the request to the app with the site key and without the
   visitor's cookies.

## The honeypot

Every form has a field named `company_website`, hidden off screen and out of
the tab order. People leave it empty; bots that fill every field fill it too.
The app should answer a submission with it filled exactly as it answers a good
one (a bot learns nothing) and keep nothing.

## What the app sends back

`src/lib/forms.js` reads the answer; it is tested in `tests/unit/forms.test.js`.

| The app answers | The visitor sees |
| --- | --- |
| 2xx `{"success": true, "data": {"message": "..."}}` | the app's message, or "Thanks, we have it." The form is cleared. |
| 422 `{"success": false, "error": "...", "fields": {"email": "..."}}` | the error, and each field's message under that field |
| 429 | "Too many tries. Please wait a minute and send it again." |
| another 4xx with an `error` | that error |
| a 5xx, a 502 from Caddy when the app is down, or anything not JSON | "Sorry, that did not send. Please try again in a moment." |

A JSON request gets JSON back. A form-encoded request gets a `303` to the
`redirect` path on success, after checking it is a path on this site (never a
full URL: an open redirect is a phishing tool), and on failure a `303` back to
the form's page.

## Adding a form

1. Copy `src/components/QuoteForm.astro`, change the fields and the action's
   `<name>`. Keep `data-site-form`, the `redirect` field, the honeypot, a
   `data-error-for="<field>"` slot per field and the `data-status` element.
2. Give every field a `<label>` and the browser checks the app also makes.
3. Add a thank-you page and put it in `noindex` in `src/site.ts`.
4. Build the receiving endpoint in the waffle app (docs/waffle-api.md).
