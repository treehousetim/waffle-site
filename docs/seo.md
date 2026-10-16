# SEO: what every build guarantees

Pages are written by hand or by an agent, so nothing about how they are
written can promise they are right. The built HTML can be checked, so it is:
`tools/audit.mjs` reads every file in `dist/` after every build, and
`src/lib/audit.js` holds the rules (tested at 100%). An **error** fails the
build, which fails the test gate, the release and the deploy. A **warning** is
printed and the build goes on.

```bash
./tools/npm.sh run build       # check, build, audit
./tools/npm.sh run audit:seo   # the audit alone, on the dist/ you have
```

## What every page gets from Base.astro

You do not write any of this by hand; `src/layouts/Base.astro` and
`src/components/Seo.astro` do, from the page's `title` and `description`:

- `<title>`: the page's title, then the site name ("Panel upgrades — Waffle
  Site"), unless the title already names the site.
- `<meta name="description">`, `<meta name="robots">`, and a canonical URL on
  every listed page.
- Open Graph and Twitter card tags, with an absolute image URL: the site's
  default image unless the page gives its own.
- One JSON-LD graph: the business (an `Electrician`, which is a
  `LocalBusiness`, with address, phone, hours and the towns served), the
  website, the page, breadcrumbs when the page passes them, and whatever the
  page adds (`Service`, `FAQPage`, `BlogPosting`).
- `<html lang>`, the viewport, the favicon, and links to the sitemap and the
  feed.

## Local business details

Name, address and phone ("NAP") must read the same on every page, on the
Google Business Profile and in every directory: search engines match them to
decide all of those are one business. They are written once, in
`src/site.ts`, and every page reads them from there.

The business node carries no star rating. Search engines do not allow a
business to mark up reviews of itself on its own site; the reviews page shows
them as text.

## Preview builds are never indexed

Only a production build (`SITE_ENV=production`, set by the release workflow) is
indexable. Every other build, including the dev server (`./tools/npm.sh run dev`), tells robots
`noindex, nofollow` on every page and serves a `robots.txt` of
`Disallow: /`, and shows a banner saying so. A preview that leaks onto the
internet does not end up in search results next to the real site.

## Pages kept out of search results

`noindex` in `src/site.ts` lists them (the 404 page, the form's thank-you
page). They get `noindex, follow`, no canonical URL, and are left out of the
sitemap. The audit fails a page on the list that robots may index, and a page
off the list that they may not, so the list is the one place this is decided.

## The audit's rules

Each has a test in `tests/unit/audit.test.js`; the comments in
`src/lib/audit.js` cite the numbers.

1. **The build has pages.** An empty build is a broken build, not a clean one.
2. **`<html lang>` and a viewport** on every page.
3. **Exactly one non-empty `<title>`.** Over 65 characters is a warning: it is
   cut off in results.
4. **A meta description.** Under 50 or over 160 characters is a warning.
5. **Exactly one `<h1>`, with words in it.** `Hero` holds it; a page with a
   Hero puts no other `<h1>` anywhere.
6. **Robots agree with the build and the noindex list.**
7. **Every listed page names itself as canonical**, absolutely, once, with the
   trailing slash.
8. **Link previews**: `og:title`, `og:description`, `og:type`, `og:url`,
   `og:image` (absolute) and `twitter:card` on every listed page.
9. **Images have alt text** (empty is fine for decoration). An image without a
   width and height is a warning: the page shifts as it loads.
10. **Every link to this site resolves**: `<a>`, `<img>`, `<link>` and
    `<script>` pointing at a path that is not in the build is an error.
    Proxied paths (`/api/site/`) are allowed.
11. **Nothing the content security policy blocks**: no inline `<script>`
    (JSON-LD is data and is allowed), no `<style>` element, no `style=` or
    `on*=` attribute. JSON-LD must parse and name `https://schema.org`.
12. **Titles and descriptions are unique** across the site. Page 2 of the blog
    gets its own.
13. **robots.txt exists and agrees with the build**: production allows
    everything and names a sitemap on the site's own origin; anything else
    disallows everything.
14. **The production sitemap lists every listed page, and nothing else**: no
    page that is not in the build, no noindex page, no other origin.

## The blog's own rules

Post front matter is checked by a schema when the site builds (docs/blog.md):
titles of 10-55 characters, so the site name still fits after them;
descriptions of 50-160; no unknown fields; a cover image needs its alt text.
