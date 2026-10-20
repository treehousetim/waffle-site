# Scoped builds

How a change in the waffle app reaches the site without rebuilding the whole
site: docs/data-pages.md, decision 8, as built. The waffle side is the app's
content slice and its change notices (Waffle's docs/content.md, "Change
notices"; the design is its docs/content-model.md).

```
app: publish ──► change notice (queued, coalesced) ──► GitHub repository_dispatch
site: rebuild.yml ──► scoped build of the served release ──► assemble.sh ──► deploy.sh
```

## The page manifest

Every site with data pages writes `pages-manifest.json` beside its pages:

```json
{
 "release": "v7",
 "records": { "stays:lakeside-cabin": "<sha-256 of the record as the app sent it>" },
 "pages": {
  "/stays/": ["stays:*"],
  "/stays/lakeside-cabin/": ["stays:lakeside-cabin"]
 }
}
```

- `release` is the tag whose code built it (`SITE_RELEASE`, set by the
  release workflow; `dev` locally).
- `records` holds the fingerprint of every record the build read.
- `pages` names, for each page built from data, the records it used:
  `<type>:<slug>` for one record, `<type>:*` for a page that lists every
  record of the type. Pages that use no data are not listed.

The manifest is always written from all the data, scoped build or not, so it
always describes the whole site.

## What a site writes

The examples have no data pages, so none of them writes these; a site that
builds pages from the waffle app's records (docs/data-pages.md) adds three
things. The site's plan of data pages lives in code, in one place, so the
manifest and the pages cannot disagree: a page that shows a record type (the
home page listing the newest stays, say) is added to the plan, or a scoped
build will not know to rebuild it.

```ts
// src/data/stays.ts: the records, parsed once, and the plan of their pages.
import { parseRecords, parseRetired } from '@core/lib/records.js';
export const stays = parseRecords(await waffle.get('/api/site/stays'), { path: '/api/site/stays', fields: stayFields });
export const retiredStays = parseRetired(await waffle.get('/api/site/stays/retired'), '/api/site/stays/retired');
export const stayPath = (slug: string) => `/stays/${slug}/`;
export const stayPages = () => [
    { path: '/stays/', uses: ['stays:*'] },
    ...stays.map((stay) => ({ path: stayPath(stay.slug), uses: [stay.key] })),
];

// src/pages/stays/[slug].astro: in a scoped build, only the changed ones.
import { wants } from '@core/lib/manifest.js';
import { previousManifest } from '@core/build-scope';
export const getStaticPaths = () =>
    stays.filter((stay) => wants(previousManifest, stay)).map((stay) => ({ params: { slug: stay.slug }, props: { stay } }));

// src/pages/pages-manifest.json.ts
export const GET = () => new Response(JSON.stringify(createManifest({ release, records: stays, pages: stayPages() }), null, 1));

// src/pages/redirects.caddy.ts
export const GET = () => new Response(caddyRedirects({
    moves: stays.flatMap((stay) => stay.previousSlugs.map((slug) => ({ from: stayPath(slug), to: stayPath(stay.slug) }))),
    gone: retiredStays.map(stayPath),
}));
```

Read each endpoint once per build: when pages also need Astro to render a
record's Markdown, a content collection whose loader is the only reader does
both (a loader's context has `renderMarkdown`), and pages read the collection.

## What a rebuild does

`.github/workflows/rebuild.yml` runs on a `repository_dispatch` of type
`change-notice`:

1. Reads the served site's `pages-manifest.json` and `sitemap-0.xml`. The
   manifest's `release` is the code to use: a data change never ships new
   code (failure 15).
2. Checks out that tag and builds it with `SITE_PREVIOUS_MANIFEST` pointing
   at the served manifest. Entity pages are built only for records whose
   fingerprint changed or that are new (`wants()` in
   `src/core/lib/manifest.js`); every other page is built as usual.
3. `tools/scoped-release.mjs` compares the two manifests. The **affected
   pages** are every page that used a changed record in the served release
   or uses one now (`affectedPages()`). It writes only those that exist now,
   the build's hashed assets, its manifest, its redirects and a sitemap
   merged with the served one, and lists the affected pages that no longer
   exist in `.scoped-remove`. Nothing changed: no release.
4. The result is rsync'd beside the releases on the server, and
   `deploy/assemble.sh <tag> <run>` makes `releases/<tag>.d<run>/`: a copy of
   the served release with hard links, the changes laid over it (each
   replacing its link, never writing through it), the removed pages deleted.
   `deploy.sh` then switches to it as to any release, so the served release
   is never changed and rolling back is deploying it again.

The notice only starts the rebuild; what to rebuild comes from comparing all
the data with what is served. So a notice that waits behind a deploy, or is
replaced by a newer one, loses nothing.

## Redirects and 410s

The build writes `redirects.caddy` (`src/pages/redirects.caddy.ts`, from
`caddyRedirects()` in `src/core/lib/redirects.js`): each record's previous
slugs redirect permanently to its page, and every slug of a retired record
answers `410 Gone`. The Caddyfile imports it from the release being served,
so each release carries its own, and `deploy.sh`'s reload picks it up.

## Before the first rebuild

- The site writes `pages-manifest.json` and `redirects.caddy` (above).
  Without them `rebuild.yml` stops at its first step, saying the served
  site has no manifest: a site with no data pages has nothing to rebuild.
- A release must be served whose manifest names its tag: publish one release
  after the endpoints land.
- The waffle app needs `SITE_REPOSITORY` and `SITE_DISPATCH_TOKEN` (its
  docs/content.md), the token a fine-grained GitHub token with the Contents
  permission on this repository.

## Failure list

Each has a test: `tests/unit/manifest.test.js`, `tests/unit/sitemap.test.js`,
`tests/unit/redirects.test.js`, `tests/unit/records.test.js` and
`tests/infra/scoped-release.test.js`. A site with data pages adds an
end-to-end check that a scoped build makes only the changed pages. Numbers 13 to 16 are docs/data-pages.md's.

13. A scoped build misses an affected page: the page a record left, a list that showed it, the sitemap.
14. A data change rebuilds every entity page, so each change costs the whole site's build time.
15. A scoped build is laid over a release built from other code, or changes the served release in place.
16. Two rebuilds run at once, or one runs while a release deploys.
17. A scoped release's sitemap loses the pages it did not rebuild, or keeps one that was removed.
18. A path in the redirects, or in the list of removed pages, is anything but a page path inside the release.
19. A changed page that the scoped build failed to make is shipped as missing rather than failing the rebuild.
