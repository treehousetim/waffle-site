# Playbook: bakery and café

For the agent turning this example into a real bakery's site (or any food
business whose counter changes daily and that takes orders ahead: a
patisserie, a doughnut shop, a deli, a café with a kitchen). Work through it
in order, showing the user each step. AGENTS.md is the rulebook; this is the
route.

## What the example is

**Crumb & Kettle**, a fictional sourdough bakery and café on Cooper's Row in
Larkhaven, an invented town, with:

| Page | File | Built from |
|---|---|---|
| Home | `src/pages/index.astro` | the hero, `Ticker` and a `MenuBoard` slip (today's bakes), `SectionCards`, `RollingPin`, `DayTrack`, the cake, wholesale and people bands, `Notes`, `PostGrid`, `TownMap`, `CallToOrder` |
| Today's bakes | `src/pages/menu/index.astro` | `GET /api/site/menu` through `parseMenu` (`src/lib/menu.ts`), `MenuBoard`, `DietaryKey`, schema.org `Menu` |
| One page per section of the counter: bread, pastries, cakes by the slice, coffee | `src/pages/menu/<slug>.astro` | `src/data/menu.ts` (the regular bake calendar), `layouts/CategoryPage.astro` (today's bakes in that section, its FAQ) |
| Celebration cakes | `src/pages/cakes/index.astro` | `src/data/cakes.ts`: flavours, sizes and servings, lead times; FAQ |
| Order a cake, and its thank-you page | `src/pages/cakes/order/` | `CakeOrderForm` posting to `/api/site/forms/cake-order` |
| Wholesale for cafés | `src/pages/wholesale.astro` | the range, the delivery route (`site.deliveryTowns`), FAQ |
| Visit us | `src/pages/visit.astro` | the hours from `site.ts`, `TownMap`, parking and access |
| Our story, the bakers, FAQ, contact, privacy | `src/pages/*.astro` | `src/data/bakers.ts`, `src/data/notes.ts`; `Faq` with FAQPage markup |
| Journal (the blog) | `src/content/blog/*.md`, `src/pages/journal/` | 9 posts and a draft, paginated six to a page, tagged, with a feed at `/journal/rss.xml` |
| Credits | `src/pages/credits.astro` | `src/data/photos.ts`, and the typefaces |

**Look:** warm and handmade, like a paper bag on a floured bench. Cream
paper (`--cream`), terracotta ink for actions (`--terracotta`), cocoa for
type and the dark bands (`--cocoa`), butter yellow for stamps and highlights
(`--butter`), kraft paper for "today" bands. Bagel Fat One for headings, the
wordmark and stamps; Alegreya to read; Caveat for the notes in the margins.
Bands meet with wavy, zigzag (torn paper bag) and scalloped (piped icing)
edges; hard printed shadows instead of soft glows; photos in bakery-window
arches, polaroids and portholes; rubber-stamp marks with uneven ink (an SVG
noise mask); hand-drawn SVG doodles of loaves, croissants, cups, a whisk and
a rolling pin (`components/Doodle.astro`). Tokens and textures are at the top
of `src/styles/global.css`.

**Motion** (`src/styles/motion.css`, plus `DayTrack` and `TownMap`): view
transitions between pages, the header and footer held still, a section's
photo growing from its card into the section page's hero; the home headline
dropping in word by word with a squash, the arch photo "proofing" up, the
stamp thumping down and its rim turning slowly; steam rising from the cups
and the logo's kettle; doodles bobbing; today's bakes crawling across the
ticker (paused on hover); menu items bouncing in as they scroll up; a rolling
pin rolling out a sheet of dough between bands; "a day at the bakery"
sliding sideways while the page scrolls down; wiggly underlines drawing
themselves under links; cards straightening up like pinned paper; a wavy
reading-progress line on journal posts. Every bit of it stops under
`prefers-reduced-motion: reduce`, and the scroll-driven parts are inside
`@supports (animation-timeline: view())`.

## 1. Interview

Ask, and write nothing until you have the answers (placeholders are fine
where the user does not know yet; never invent a real-looking fact):

- The business's name, legal name, phone, email, street address and
  opening hours, and the day or days it is closed.
- What it bakes, by section of the counter, and which things are on which
  days. Its specials and seasonal bakes.
- How the daily menu is kept: does the waffle app hold today's board? Who
  updates it, and when (the site shows it as of the last build)?
- Its dietary marks and allergen policy, in the owner's own words. Never
  write "gluten-free" or "nut-free" unless the kitchen can promise it.
- Whether it takes cake or catering orders: flavours, sizes, servings,
  prices, lead times, deposits, pickup and delivery.
- Whether it supplies other businesses: the range, the towns, the cut-off.
- Parking, access, the busy and quiet times, dogs, wifi.
- The people, with their permission, and the story.
- Real reviews they may quote, with permission, and where they came from.
- Photographs of their own bread, counter, kitchen and people.
- Their colours and logo, if they have them.

## 2. The business

- `src/site.ts`: name, tagline, description, contact, hours, `closed`,
  address, geo, `deliveryTowns` (the business's `areaServed`), social
  profiles, navigation, footer, the journal's name and default author. The
  site name is not the template's placeholder, so `tools/setup.sh`'s rename
  does not change it: change `site.name` and `business.name` here, and the
  wordmark follows.
- `example.json` is gone once installed; AGENTS.md §1 gets the two-sentence
  description of the business instead.

## 3. The menu from the waffle app

- Pages read `GET /api/site/menu` at build time and parse it with
  `parseMenu` in `src/lib/menu.ts`, which checks every field and fails the
  build naming the field (its failure list is at the top of the file). The
  app's answer must look like `api-fixtures/api/site/menu.json`: a `date`
  (the day the board is for) and `items`, each with `id`, `name`, `category`
  (`breads`, `pastries`, `cakes` or `coffee`), `description`, `price_cents`,
  `currency`, `dietary` (`vegan`, `vegetarian`, `gluten-free`,
  `contains-nuts`) and `sold_out`.
- The board is as fresh as the last build. A bakery whose board changes
  every morning needs a build every morning, after the bakers have updated
  the app: schedule the release workflow (docs/releasing.md), or re-run it
  for the current tag. Say so to the user plainly.
- To change the sections of the counter, change `CATEGORIES` in
  `src/lib/menu.ts`, the entries in `src/data/menu.ts`, and the pages in
  `src/pages/menu/` together, and the categories the app sends.
- To add a dietary mark, add it to `DIETARY` in `src/lib/menu.ts` (the
  parser refuses marks it cannot explain) and to the app.

## 4. Cake orders

- The form posts to `POST /api/site/forms/cake-order` (docs/forms.md) with
  `occasion`, `servings`, `flavour`, `date_needed` (YYYY-MM-DD), `pickup`,
  `message` (the words on the cake, up to 40 characters), `notes`, `name`,
  `email`, `phone`, plus `redirect` and the `company_website` honeypot.
  The choices come from `src/data/cakes.ts`; the app's handler must accept
  exactly the same values, and is where the lead time for the chosen size is
  checked (the form deliberately has no `min` date, so the build does not
  change every day).
- If the business does not take orders, delete `src/pages/cakes/order/`,
  `CakeOrderForm`, the header ticket (`site.cta`) and the closing
  `CallToOrder` band, and point people at the phone instead.

## 5. The look

- Swap the palette tokens at the top of `src/styles/global.css` for the
  business's colours; keep the contrast (text 4.5:1, large text and
  controls 3:1). Terracotta on cream is 4.9:1; cocoa on cream 13:1.
- Replace the logo: `src/components/Logo.astro` (the kettle-loaf is inline
  SVG so its steam can move), `brand/mark.svg`, `public/favicon.svg`, and
  render `public/logo.png` and `public/og-default.png` from
  `brand/logo.html` and `brand/og.html`.
- Replace the photographs in `src/assets/photos/` and their entries in
  `src/data/photos.ts` with the bakery's own, and the journal covers in the
  posts' front matter. Remove the Unsplash credits that no longer apply;
  delete `/credits/` if none remain (and its entry in `site.noindex`).
- Redraw `components/TownMap.astro` for the real streets, or replace it with
  a static map image the business is licensed to use. No embedded map: the
  content security policy blocks third-party frames and scripts.
- Change the typefaces in `src/fonts.ts` only with a reason; keep them
  self-hosted, with their licences in `src/assets/fonts/`.

## 6. Pages and posts

Rewrite each page for the real business, one at a time, showing the user
each (docs/pages.md): the section pages from what customers actually ask at
the counter, the visit page from the real parking and access. Then the
journal: keep the posts the bakers agree are true for their kitchen and
rewrite them in their voice (recipes must be ones they have actually
tested), delete the rest, and write new ones from their customers' real
questions (docs/blog.md). Every post needs a real author.

## 7. Checks

`tests/e2e/site.checks.js` (this example's `checks.js`) names the bakery's
pages, the 21 bakes in the menu fixture and which are sold out, the
structured data (Bakery, Menu, FAQPage, BlogPosting), the cake order form's
fields and the 9 published posts. Update it as the pages change: it is the
site's own test now. Then:

```bash
./tools/npm.sh run build     # 0 errors, 0 warnings
./tools/test.sh --coverage   # the gate
```

Look at every changed page at 390 px and 1440 px before calling it done.
