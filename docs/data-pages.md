# Pages from data

How to build a site whose pages come from the waffle app's data: property
listings, locations, products, services, people. Follow the decisions in order;
each gives the default, when to choose otherwise, and what to write down. The
worked example throughout is a vacation-rental site, because it needs every
decision.

Read docs/seo.md first: everything there still applies to every page this
document produces.

## Terms

Used with exactly these meanings, here and in code, tests and commit messages.

| Term | Meaning |
|---|---|
| **record** | One item the waffle app holds and the site publishes: a property, a town, a service. Has a stable **slug**. |
| **page type** | One template that turns records into pages: the property page, the location page. Each has a URL pattern. |
| **entity page** | A page type with one page per record: `/stays/lakeside-cabin/`. |
| **hub page** | A page type that groups records by something they share: `/stays/asheville/`. |
| **combination page** | A hub crossed with another dimension: `/stays/asheville/cabins/`. Built only where enough records meet. |
| **lasting data** | What is true for days or weeks: descriptions, photos, rooms, amenities, a "from" price. Built into the HTML. |
| **live data** | What is true right now: availability, an exact quote, stock. Fetched by an island; never in the built HTML. |
| **island** | Astro's term: a small interactive component on an otherwise static page, here one that reads live data from `/api/site/*` in the browser. |
| **publish bar** | The minimum a record must have before its page is built: photos, words, filled fields. Enforced by code, not by judgement. |
| **retired record** | A record that was published and no longer is. Its URL must still answer (decision 7). |
| **crawl trap** | URLs search engines could follow forever: filters, sorts, date pickers. Never indexed. |
| **site plan** | The table from decision 1: every page type, its URL, its data and the searches it answers. |

## Decision 1: what do people search for?

Start from searches, not tables. List the things the site's visitors type into
a search engine, group them, and give each group a page type. This table, the
**site plan**, is the design of the whole site; write it in the site's
`docs/playbook.md` before writing any code.

| Searches | Page type | Kind | URL | Records |
|---|---|---|---|---|
| "lakeside cabin hot tub asheville" | Property | entity | `/stays/<slug>/` | properties |
| "vacation rentals asheville" | Location | hub | `/stays/<town>/` | properties by town |
| "cabins in asheville" | Location × type | combination | `/stays/<town>/<type>/` | properties by town and type |
| "things to do in asheville in autumn" | Guide | article | `/guides/<slug>/` | blog posts |
| "<the brand>" | Home, about | page | `/`, `/about/` | site.ts |

- **Every row answers searches someone really makes.** A page type nobody
  searches for is not built, however easy it is to generate.
- **Search results, filters and the booking flow are not rows.** They are for
  visitors already on the site (decision 6).

## Decision 2: how is each page rendered?

| Mode | When | How |
|---|---|---|
| **Built** (default) | The page's data changes no more than a few times a day, and there are up to about 10,000 pages of that type | The build reads the waffle app and writes every page as HTML. waffle-site as it is. |
| **Built + live** | As above, but part of the page must be true to the minute: availability, a quote, stock | Built, plus an island for the live part (decision 4). |
| **Rendered on request** | Tens of thousands of pages changing constantly, or data that must be fresh in every byte | Each page rendered when asked for and cached. **Not supported by waffle-site today**: it needs an application server in production, a decision for AGENTS.md §2, not for one page type. |

Choose per page type, and write the choice in the site plan. The vacation-rental
site is **built + live** for properties (descriptions built, availability live)
and **built** for everything else.

## Decision 3: what does each page say?

Every page type gets one template, and every page of that type is filled by
its record. For each page type, write down:

- **Title and `<h1>`**, from the data: "Lakeside cabin with hot tub, Asheville".
  Unique per page; the audit fails duplicates.
- **Description**, composed from the record's fields, 50-160 characters, unique.
- **Substance**: what this page says that no other page does. For a property:
  its photos, rooms, amenities, rules, the neighbourhood, guest reviews. For a
  location: how many stays, the price range, the kinds of stay, what the town
  is like. This is what ranks; a template with only the name changed does not.
- **Structured data**: the schema.org type and the fields it fills.
  Properties: `VacationRental` (or `Accommodation`) with address, rooms,
  amenities, images; locations: `ItemList` of the properties; every page:
  `BreadcrumbList`.
- **Links out**: every page links up to its hub, across to its neighbours
  (similar stays nearby) and down to its entities. These links are how
  crawlers find every page and how ranking moves through the site; a page
  nothing links to is never found.

**Reviews:** the rule in AGENTS.md against review markup is about a business
marking up reviews of itself. Guest reviews of a property, collected by the
platform, may be marked up on that property's page, and are shown as visible
text too. Never mark up reviews the site's owner wrote or chose.

## Decision 4: what is lasting, and what is live?

Sort every field each page shows into one of the two:

| Lasting: in the built HTML | Live: in an island |
|---|---|
| name, description, photos, rooms, amenities, rules, location | the availability calendar |
| "from $180 a night" (a range, refreshed by rebuilds) | the exact price for chosen dates, with fees |
| reviews and rating | "2 left at this price", stock |
| links to related pages | the Reserve button's hand-off to the waffle app |

- **A field is live only if a stale value would mislead.** Everything else is
  lasting, because lasting data is what search engines read.
- **The page reads completely without its islands.** An island adds what is
  true now; it never carries content that should rank.
- **Islands read `/api/site/*` in the browser**, through Caddy to the waffle
  app (docs/waffle-api.md), as a component `<script>` that Astro bundles. They
  show a plain fallback while loading and on failure: "Check availability"
  linking to the booking flow.
- **Booking, accounts and payment happen in the waffle app**, never in the site.

## Decision 5: the publish bar

The biggest mistake data sites make is publishing thousands of near-empty
pages: search engines treat them as spam and rank the whole site lower. So
each page type has a publish bar, enforced by the build:

| Page type | Published only if |
|---|---|
| Property | at least 8 photos, a description of 150+ words, every required field filled |
| Location | at least 5 published properties, and an introduction written for that town |
| Location × type | at least 4 published properties of that type in that town |

- **Below the bar, the page is not built** and is not in the sitemap. The
  record is still bookable in the waffle app; it just has no landing page.
- **The build reports what it left out and why**, so the owner can fill the
  gaps: "3 properties below the publish bar: lakeside-cabin (5 photos, needs 8)".
- **The numbers are the site's to choose**, written in the site plan. Raise
  them when Search Console shows a page type "crawled, currently not indexed"
  (decision 9).

## Decision 6: what is never indexed?

| URL | Why | How |
|---|---|---|
| search results, filters, sorts | a crawl trap: endless near-duplicates | not built as pages; the search page itself is `noindex` |
| any URL with dates or guest counts | a crawl trap | live islands only; never a link in the HTML |
| booking, account, checkout | private, and not content | in the waffle app, not the site |
| below-bar records | thin | not built (decision 5) |

Every built page has one canonical URL. A property reachable from two hubs is
still one page with one URL.

## Decision 7: URLs that last

- **URLs are built from slugs, never numeric IDs.** The waffle app stores a
  slug per record, unique within its type, lowercase letters, digits and
  dashes.
- **A slug changes only with a redirect.** The waffle app keeps each record's
  previous slugs; the build turns them into permanent (301) redirects.
- **A retired record** (unlisted, deleted, below the bar for good) redirects to
  its hub if there is one, and otherwise answers `410 Gone`. It is never
  redirected to the home page, and it leaves the sitemap.

## Decision 8: keeping it fresh

- **Lasting data is as fresh as the last build.** When the waffle app changes a
  record's lasting data, it asks for a rebuild; the site rebuilds and
  redeploys. A few changes close together make one rebuild.
- **Live data needs no rebuild**: the islands read it on every visit.
- **The build fails rather than publish wrong pages.** An unreachable app or a
  record that does not parse stops the build, and the site keeps serving the
  last good release (docs/releasing.md).

## Decision 9: proving it works

- **The audit** (docs/seo.md) checks every built page: one `<h1>`, unique
  titles and descriptions, working links, valid structured data.
- **The site's own end-to-end checks** (`tests/e2e/site.checks.js`) prove each
  page type from fixtures: a record above the bar is built with its title and
  structured data; one below it is not; a retired slug redirects; the sitemap
  lists exactly the built pages.
- **After launch, Google Search Console** is the scoreboard, per page type:
  impressions and clicks show what ranks; "crawled, currently not indexed"
  shows a type whose pages are too thin (raise its publish bar or its
  substance); "discovered, not crawled" shows pages nothing links to.

## The waffle app's side

What the site needs from the app, as `/api/site/*` endpoints (docs/waffle-api.md
has the envelope and the rules); a Waffle Iron module can provide them.

| Endpoint | Read | Returns |
|---|---|---|
| `GET /api/site/<records>` | at build time | every published record's lasting data and slug, and each record's previous slugs. Paged by path (`/api/site/<records>/page/2`) once large: build-time paths carry no query string |
| `GET /api/site/<records>/retired` | at build time | the slugs of retired records, with the hub each redirects to, if any |
| `GET /api/site/availability`, `/quote` | by islands, in the browser | live data, with query strings (dates, guests) |
| a rebuild request | by the app, on change | asks the site to rebuild (decision 8) |

The build makes one request per endpoint, not one per record.

## Failure list

The ways a site built from data can go wrong. Each is covered by a test in the
site's checks or the core before the code that prevents it is written
(AGENTS.md §7).

1. A record that does not parse reaches a page.
2. A record below its publish bar is built, or appears in the sitemap.
3. Two records share a slug, and one page silently overwrites the other.
4. A changed slug leaves the old URL dead, with no redirect.
5. A retired record's URL answers `200` with stale content, or redirects home.
6. A hub or combination page is built with too few records to be worth it.
7. Live data (a price for dates, availability) is baked into the HTML and goes stale.
8. A crawl trap is linked from a built page and gets indexed.
9. A page has no inbound links, so crawlers never find it.
10. The waffle app is down or answers garbage at build time, and the site publishes an empty or partial set of pages.
11. A rebuild is never triggered after a change, and pages drift from the app.
12. Photos are hot-linked from the app's storage instead of resized and served by the site.

## What exists today, and what this needs

Built and usable now:

- static pages from waffle data at build time (`waffle.get()`, fixtures,
  strict parsers, the audit, the sitemap), as every example does
- islands as component scripts, posting and fetching through `/api/site/*`
- structured data helpers (`src/core/lib/jsonld.js`)

Not built yet, and needed for a site like the vacation-rental example:

- **core helpers for collections**: a tested parser for "records with slugs",
  the publish-bar check with its report, and hub and combination grouping, so
  every site uses the same code (`src/core/lib/`, at 100% coverage)
- **redirects and `410`s from data**: the build writing a Caddy snippet of
  previous slugs and retired records that `docker/caddy/Caddyfile` imports
- **remote photos**: `image.remotePatterns` in `astro.config.mjs` for the
  waffle app's photo storage, so the build fetches, resizes and serves them
  itself (failure 12)
- **rebuild requests**: a way for the waffle app to start the deploy
  workflow for the current release, and its waffle-side module
- **a worked example**: an example site built this way

Until those exist, a site can follow every decision here with code of its own;
build the missing pieces in the core first when two sites would need them.
