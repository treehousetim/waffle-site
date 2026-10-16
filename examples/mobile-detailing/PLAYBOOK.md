# Playbook: mobile detailing

For the agent turning this example into a real mobile service's site: a
mobile car detailer first, but the same shape fits any business that drives
to its customers and sells fixed packages priced by size (mobile dog
grooming, window cleaning, mobile tyre fitting, pressure washing). Work
through it in order, showing the user each step. AGENTS.md is the rulebook;
this is the route.

## What the example is

**Gloss Theory**, a fictional, fully mobile detailing crew in the made-up
city of Port Alder. Its vans carry their own water, power and lights, so the
site sells one idea above all: we come to you, and we need nothing from you.

| Page | File | Built from |
|---|---|---|
| Home | `src/pages/index.astro` | the studio hero, `Marquee`, `PackageCards`, `Compare`, `VanKit`, `ZoneMap`, `Steps`, `Quotes`, `PostGrid`, `Closing` |
| Packages, and one page per package | `src/pages/packages/index.astro`, `src/pages/packages/[slug].astro` | `GET /api/site/packages` through `src/lib/packages.ts`, joined to `src/data/packages.ts` by `src/lib/catalog.ts` |
| Service zones, and one page per zone | `src/pages/zones/index.astro`, `src/pages/zones/[slug].astro` | `src/data/zones.ts`, `ZoneMap` |
| Fleet and business accounts | `src/pages/fleet.astro` | its own copy, FAQ markup |
| How it works, Gallery, FAQ, About | `src/pages/*.astro` | `src/data/van.ts`, `Steps`, `VanKit`; `Faq` with FAQPage markup |
| Book, and its thank-you page | `src/pages/book.astro`, `src/pages/book/thanks.astro` | `BookingForm` posting to `/api/site/forms/booking` |
| Contact, Privacy, Credits, 404 | `src/pages/*.astro` | `src/site.ts`, `src/data/photos.ts` |
| Journal (blog) | `src/content/blog/*.md` | 10 posts and a draft, paginated by 6, tagged, with a feed |

**The waffle app.** Two endpoints (`example.json`):

- `GET /api/site/packages`, read at build time: the vehicle sizes, and for
  each package its slug, name, summary, price in cents and duration in
  minutes for every size, and what is included. `src/lib/packages.ts` checks
  every field and fails the build naming the field; `src/lib/catalog.ts`
  fails it if the app lists a package that has no copy in
  `src/data/packages.ts`. The fixture is
  `api-fixtures/api/site/packages.json`.
- `POST /api/site/forms/booking`, from the browser: vehicle, size, package
  (or `not-sure`), address, zone (or `other`), earliest and latest date, time
  of day, whether there is cover, notes, name, phone, email, how to confirm,
  the honeypot and the `redirect`. The field list is at the top of
  `src/components/BookingForm.astro`. `/book/?package=<slug>` and
  `?zone=<slug>` preselect those fields (`src/scripts/booking.ts`).

**The look.** A near-black studio (`#050607`), liquid chrome lettering (a
gradient with a hard horizon, clipped to the text) and one electric cyan
(`#2ee6ff`) for actions, focus and small sparks. Archivo with its width
axis: stretched to 125% and set heavy and uppercase for display, normal width
for reading; JetBrains Mono for the spec-sheet labels (sizes, minutes,
prices, numbering). Chamfered photo corners, hairlines instead of boxes,
bands numbered like a spec sheet, and a footer that ends in the name, huge,
running off the page. Tokens are at the top of `src/styles/global.css`.

**The motion** (`src/styles/motion.css`, all inside
`prefers-reduced-motion: no-preference`, scroll-driven parts inside
`@supports`):

- view transitions between pages, wiped in like a squeegee; package and zone
  photos morph from their card into the next page's hero (`vt-*` classes);
- a band of light glides across chrome headings as they arrive, across the
  logo every few seconds, across buttons and package cards on hover;
- package cards tilt toward the pointer (`src/scripts/tilt.ts`, CSSOM only);
- water beads drift up behind the hero and the closing band;
- the header tightens and darkens as you scroll; band headings rise in;
- the before/after frame wipes from swirled to corrected as it scrolls by,
  and a range slider takes over when touched (`src/scripts/compare.ts`);
- the van route draws itself across the zone map; its stops pulse;
- the gallery's film strip runs sideways as the page scrolls down;
- the package marquee slides; FAQs open smoothly; a reading-progress bar
  runs along the top of every post.

## 1. Interview

Ask, and write nothing until you have the answers (placeholders are fine
where the user does not know yet; never invent a real-looking fact):

- The business's name, legal name, phone, email, the address it works from
  (a yard, a unit, or a home office they are happy to publish), and the hours
  the vans are out.
- Licence, insurance (general liability, garage keepers), year founded,
  certifications for the products they use (coating installer programmes).
- The packages they sell, in order, with prices and durations for each
  vehicle size, and what each includes. Whether the waffle app holds them.
- The areas they cover, and for each one something true and particular:
  parking rules, slopes, water restrictions, trees, salt, which days they go.
  Areas with nothing particular to say get listed, not a page.
- What the van carries: water, power, runoff capture. Many cities regulate
  wash water reaching storm drains: ask how they comply, and say so.
- Their weather, cancellation, deposit and payment policies.
- Fleet work: whether they do it, minimum fleet size, terms.
- Real reviews they may quote, with permission, and where they came from.
- Photographs of their own vans, crew and before-and-afters: these matter
  more for a detailer than for almost any other business.
- Their colours and logo, if they have them.

## 2. The business

- `src/site.ts`: name, tagline, description, contact, hours and the hours
  note, address, licence line, social profiles, navigation, footer, blog
  name and author. `business.type` stays `AutoWash` for a detailer (it is the
  schema.org type for car washing and detailing); change it for another kind
  of mobile service.
- `example.json` is gone once installed; AGENTS.md §1 gets the two-sentence
  description of the business instead.

## 3. Packages and the booking form

- The waffle app's `GET /api/site/packages` must answer in the shape of
  `api-fixtures/api/site/packages.json` (docs/waffle-api.md). Change sizes and
  packages in the app; the parser takes any number of sizes (up to six) and
  packages (up to twenty).
- For every package the app lists, write its entry in
  `src/data/packages.ts`: title and description for search, kicker, the
  headline, lead, two photos, who it is for, how the visit goes, what you
  need from the customer, how often, and its questions. A package without an
  entry fails the build, deliberately.
- If a package needs its own extra section (paint correction has the
  before/after), add it in `src/pages/packages/[slug].astro`, keyed on the
  slug, as the example does.
- `motion.css` names each package's photo for the view transition
  (`.vt-<slug>`): add or rename a line per package.
- The booking form posts to `POST /api/site/forms/booking` (docs/forms.md).
  Its options come from the app (sizes, packages) and `src/data/zones.ts`.
  Change its fields in the form and the waffle app's handler together, and
  update the field list at the top of `BookingForm.astro`.

## 4. Zones

- `src/data/zones.ts`: one entry per zone, each with three facts that are
  true there and nowhere else, its parking, its days, a suggested package
  and its place on the map. If you cannot write three true facts, the zone
  gets no page: remove it and mention it on `/zones/` instead.
- The map (`src/components/ZoneMap.astro`) is a drawing, not a real map:
  redraw the coastline, lake and zone shapes in the 800x520 viewBox to suit
  the real city, keep the list and the map in the same order (the hover
  highlight works by position), and set `yard` and each zone's `stop`.
  No third-party map: the content security policy blocks it, on purpose.
- `motion.css` lists a `.vt-zone-<slug>` line per zone.

## 5. The look

- Swap the palette tokens in `src/styles/global.css` for the business's
  colours; keep the contrast (text 4.5:1, large text and controls 3:1). The
  design depends on a dark ground: if the brand is light, rethink the chrome
  rather than inverting it.
- Replace the logo: `src/components/Logo.astro`, `public/favicon.svg`,
  and the sources in `brand/` (render `public/logo.png` at 512x512 and
  `public/og-default.png` at 1200x630 from `brand/logo.html` and
  `brand/og-default.html` with a headless browser).
- Replace the photographs in `src/assets/photos/` and their entries in
  `src/data/photos.ts` with the business's own. The before/after
  (`Compare.astro`) is an illustration made from one photo; replace it with a
  real before and after of the same panel, and drop the "Illustration"
  caption. Remove Unsplash credits that no longer apply; delete `/credits/`
  if none remain (and its entry in `site.noindex`).
- Change the typefaces in `src/fonts.ts` only with a reason; keep them
  self-hosted. Archivo's width axis is what makes the display type: a
  replacement needs a wide or extended cut.

## 6. Pages and posts

Rewrite each page for the real business, one at a time, showing the user
each (docs/pages.md). The fleet page, the about page's history and promises,
the reviews in `src/data/reviews.ts` and the van kit in `src/data/van.ts` are
all fiction: replace them or remove them. Then the journal: keep the posts
the user agrees are true for their business and rewrite them in their voice,
delete the rest, and write new ones from their customers' real questions
(docs/blog.md). Every post needs a real author.

## 7. Checks

`tests/e2e/site.checks.js` (this example's `checks.js`) names the example's
pages, its five packages and their prices from the fixture, its five zones,
its 20 photo credits, its 10 published posts and the booking form's fields.
Update it as the pages change: it is the site's own test now. Then:

```bash
./tools/npm.sh run build     # 0 errors, 0 warnings
./tools/test.sh --coverage   # the gate
```

Look at every changed page at 390 px and 1440 px before calling it done.
