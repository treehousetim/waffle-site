# The waffle app this site fronts

The site has no server code. Anything that needs one, a quote request or the
current prices, belongs to the [Waffle](https://github.com/treehousetim/waffle)
app behind it, which is the system of record. The site reaches it two ways.

## 1. At build time: reading data into pages

A page that shows the app's data reads it while the site builds, so the HTML
that ships already contains it:

```astro
---
import { waffle } from '../settings';
import { parsePriceGuide } from '../lib/prices.js';

const guide = parsePriceGuide(await waffle.get('/api/site/prices'));
---
```

- **Production builds** (the release workflow) fetch from `WAFFLE_APP_URL`.
- **Development builds and the test suite** read the same answer from
  `api-fixtures/api/site/<name>.json`, so nobody needs the app running to work
  on a page. `WAFFLE_DATA=live` makes a development build use the app instead.
- Each path is fetched once per build, however many pages use it.
- Every answer is checked before a page renders it (`src/core/lib/prices.js` for the
  prices). An answer in the wrong shape fails the build with the field named.

The data is as fresh as the last build. When the office changes prices, cut a
release (or re-run the workflow for the current tag) to publish them.

### Adding an endpoint

1. Add `api-fixtures/api/site/<name>.json` holding
   `{"success": true, "data": ...}`, shaped like the app's real answer.
2. Add a parser in `src/core/lib/` that checks every field and refuses anything
   else, with its unit test (100% coverage is enforced).
3. Use it from the page: `parseThing(await waffle.get('/api/site/<name>'))`.
4. Build the endpoint in the waffle app (below).

## 2. At run time: the browser, through the site

Forms post to `/api/site/forms/<name>` **on this site**. Caddy forwards every
`/api/site/*` request to the app (docs/https.md), so for the browser it is the
same origin: no CORS, nothing to configure in the app for it. On the way:

- A request a browser marks as cross-site is refused with 403.
- `X-Site-Key: <WAFFLE_SITE_KEY>` is added, so the app knows the request came
  through this site.
- The visitor's `Cookie`, `Authorization`, `Origin`, `Referer` and `Sec-Fetch-*`
  headers are dropped, and any `Set-Cookie` from the app is dropped on the way
  back: the app must never mistake a site visitor for a signed-in user, or
  hand one a session.
- The visitor's address arrives as `X-Visitor-Address`, for rate limiting (the
  app's own Caddy rewrites `X-Forwarded-For`, so the app reads this header, and
  only on a request that carries the site key).

`./tools/npm.sh run dev` does the same through the dev server's proxy, to a
waffle app on your machine (`WAFFLE_APP_URL`, default
`http://host.docker.internal:8080`).

## The contract the waffle app implements

This is the waffle side's work: a slice (or a Waffle Iron module) in the app.

| Endpoint | Auth | Answer |
| --- | --- | --- |
| `GET /api/site/prices` | none: public, read-only | `{"success": true, "data": {"updated": "YYYY-MM-DD", "items": [...]}}`, items as in `api-fixtures/api/site/prices.json` |
| `POST /api/site/forms/<name>` | `X-Site-Key` must be a key the app issued to this site, on its Sites page (kept there only as a hash; 401 otherwise) | see docs/forms.md, and Waffle's docs/forms.md |

Rules for every `/api/site/*` route in the app:

- Answers in the envelope every waffle endpoint uses: `{"success": true,
  "data": ...}` or `{"success": false, "error": "..."}`.
- Never reads or sets a session. These are not the app's signed-in routes.
- Rate-limits forms per `X-Visitor-Address`, read only behind the site key.
- Accepts form-encoded bodies on `POST /api/site/forms/*` (a browser without
  script sends one). Waffle's `SameSiteMiddleware` refuses form bodies on
  `/api/`, so these routes need an explicit exception, which the site key
  makes safe.

## Failure list: build-time reads

Each has a test in `tests/unit/waffle-api.test.js` (and the end-to-end test
builds against a stand-in app over real HTTP).

1. A path outside `/api/site/`, or one that could climb out of it, is read.
2. The app cannot be reached, and the build fails with a message that does not
   say where it was looking.
3. The app refuses (a non-2xx status), and its reason is lost.
4. The app answers with something that is not JSON (a login page, a proxy's
   error page) and the build crashes on it.
5. The app answers with JSON that is not the envelope, and a page renders
   `undefined`.
6. A development build has no fixture for an endpoint, and the message does
   not say which file to create.
7. A production build quietly uses fixture data (refused in
   `src/core/lib/settings.js`; docs/building.md).
8. A path used by several pages is fetched once per page.
