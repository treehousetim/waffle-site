# Building the site

```bash
./tools/npm.sh ci              # once, and when the lockfile changes
./tools/npm.sh run dev         # http://localhost:4321, rebuilds as you edit
./tools/npm.sh run build       # astro check, astro build into dist/, the SEO audit
docker compose up -d           # http://localhost:8090: dist/ behind the real Caddyfile
```

The dev server is quickest for writing pages. `docker compose up -d` serves
the last build the way production does (the headers, the 404 page, the
redirects, `/api/site` forwarded to a waffle app on your machine), for
checking the real thing.

## Build settings

Read from the environment once, by `src/lib/settings.js`, which refuses a
combination that would publish something wrong before Astro starts.
`tools/npm.sh` passes them into its container when they are set.

| Variable | Default | Meaning |
| --- | --- | --- |
| `SITE_ENV` | `development` | `production` makes the build indexable; anything else is `noindex` everywhere (docs/seo.md). |
| `SITE_URL` | `http://localhost:4321` | The canonical origin. Required, and https, in production. |
| `WAFFLE_APP_URL` | none | The waffle app's origin. Required for live data, and for `/api/site` in the dev server. |
| `WAFFLE_DATA` | `fixtures`, or `live` in production | Where build-time data comes from (docs/waffle-api.md). |

The release workflow sets `SITE_ENV`, `SITE_URL` and `WAFFLE_APP_URL` (from `docker-compose.prod.yml`), and `WAFFLE_DATA` defaults to `live`; you never
set them by hand for a release.

```bash
# A production build on your machine, against a waffle app on this machine:
SITE_ENV=production SITE_URL=https://www.acme.com WAFFLE_APP_URL=http://host.docker.internal:8080 ./tools/npm.sh run build
```

## What the build does

1. **`astro check`**: TypeScript over every page, component and layout. A page
   missing its `title` or `description` fails here.
2. **`astro build`**: every page to `dist/<path>/index.html`, images resized and
   converted to WebP, CSS and scripts to content-hashed files in `dist/_astro/`
   (never inline), the sitemap, the feed and `robots.txt`.
3. **`tools/audit.mjs dist`**: the SEO audit (docs/seo.md).

## Failure list: build settings

Each has a test in `tests/unit/settings.test.js`.

1. A misspelled `SITE_ENV` builds a production site as development, or the
   reverse.
2. A production build has no `SITE_URL`, so canonical URLs, the sitemap and
   link previews point nowhere.
3. A production `SITE_URL` is plain http, which search engines treat as a
   different site.
4. A production build publishes fixture data as if it were real.
5. A build asked for live data has no app to get it from.
