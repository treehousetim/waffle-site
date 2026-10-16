# Playbook: brewery

For the agent turning this example into a real brewery's site (or any
taproom-led drinks business: a brewpub, a cidery, a meadery, a distillery
tasting room, a wine bar with its own label). Work through it in order,
showing the user each step. AGENTS.md is the rulebook; this is the route.

## What the example is

**Ironwood Brewing Co.**, a fictional small-batch brewery with a taproom in an
1888 stove foundry in the invented river town of Wrenford, Ohio, with:

| Page | File | Built from |
|---|---|---|
| Home | `src/pages/index.astro` | the hero with rising carbonation, `TapBoard` (first six taps), `Kinetic`, `CanCard` for the core range, `PintScroll`, the taproom mosaic, `EventList`, overheard quotes, hire and tour cards, `PostGrid`, `LastCall` |
| On tap now | `src/pages/on-tap.astro` | `GET /api/site/taplist` through `src/lib/taplist.ts`, `TapBoard` |
| Our beers, and one page per core beer | `src/pages/beers/index.astro`, `src/pages/beers/[slug].astro` | `src/data/beers.ts`, `CanArt`, `CanCard`; each beer's page also reads the tap list to say whether it is pouring |
| The taproom | `src/pages/taproom.astro` | hours from `src/site.ts`, `src/data/trucks.ts`, the age, kids and dog policy |
| Events | `src/pages/events.astro` | `GET /api/site/events` through `src/lib/events.ts`, `EventList`, schema.org `Event` nodes |
| Private hire | `src/pages/private-hire.astro` | `src/data/spaces.ts`, `PrivateEventForm` posting to `/api/site/forms/private-event`, `Faq` with FAQPage markup |
| Tours, Our story, FAQ, Privacy | `src/pages/*.astro` | `Faq` (FAQPage markup) on the FAQ |
| Contact, and its thank-you page | `src/pages/contact.astro`, `src/pages/contact/thanks.astro` | details from `site.ts`, a drawn sketch map, `PrivateEventForm` |
| Blog ("Brewing notes") | `src/content/blog/*.md` | 11 posts, paginated by 7, tagged, with a feed |
| Credits | `src/pages/credits.astro` | `src/data/photos.ts` |

**The age policy** lives once, in `site.agePolicy` in `src/site.ts`, and is
shown in the header ticker, the footer, the hero, the tap list, the taproom,
the FAQ, the tours and the private event form (which also asks for a
required acknowledgement). Keep it plain and keep it everywhere drinking is.

**Look:** dark industrial. Charcoal and soot ground (`--char`, `--soot`),
bone text, copper (`--copper`) for actions and rules, hop green (`--hop`) for
what is new or fresh, a signal red only for limited releases and the 21+
stamp. Big Shoulders Display for tall condensed headings, its stencil cut for
labels, tags and buttons, Bitter (a slab serif) for reading. Riveted plates
(`.plate`, a rivet in each corner from `--rivet`), a rivet rail between
footer bands, a film-grain texture on the body, split-flap tiles on the tap
board, ticket stubs for events, and each core beer drawn as a can whose
label colours come from its `tone`. Tokens are at the top of
`src/styles/global.css`.

**Motion** (`src/styles/motion.css`, all CSS): pages pour in from the bottom
with cross-document view transitions, the header stays put and a beer's can
morphs from the range into its page (`vt-<slug>` classes); carbonation rises
behind the hero, each beer page and the closing band; the logo's bubbles
rise; the "on tap now" ticker runs; the home hero's lines slide up out of
their slots; tap-board rows flip in like a split-flap board, on load on
`/on-tap/` and on scroll on the home page; a can turns on hover; the pint in
"From grain to glass" fills as you scroll (a view timeline on the section);
giant type slides across the screen; the story's years run along a
horizontal track driven by scroll on wide screens; cards, stubs and plates
rise in; FAQ answers open smoothly; a copper bar tracks reading progress.
Everything stops under `prefers-reduced-motion: reduce`, and nothing waits on
an animation to be readable.

## 1. Interview

Ask, and write nothing until you have the answers (placeholders are fine
where the user does not know yet; never invent a real-looking fact):

- The brewery's name, legal name, phone, email, street address and taproom
  hours, including the days it is closed and any seasonal changes.
- The age policy exactly as they enforce it: what ID they accept, whether
  under-21s are allowed and until when, and anything state law adds (to-go
  sales, crowlers, growler fills).
- The core range: each beer's name, style, ABV, IBU, tasting notes, malts,
  hops, yeast, glass, serving temperature and pairings, and the story of the
  name. Which are in cans or bottles.
- Whether the bar keeps its tap list in the waffle app, and how often it
  changes. The same for events.
- Their food: kitchen, trucks (who and when), or bring-your-own.
- Kids and dogs: allowed where and until when.
- Private hire: the spaces, capacities, minimum spends, what is included.
- Tours: which, when, how long, how much, how to book, what is tasted.
- The building and the people, for "Our story". Real quotes from customers,
  with permission, if they want an "overheard" band.
- Photographs of their own brewhouse, taproom, people and beer.
- Their logo and colours, if they have them; their can art, if any.

## 2. The business

- `src/site.ts`: name, tagline, description, contact, hours, `closedDays`,
  address, `founded` and `built`, the age policy, navigation, footer, blog
  author. Keep `business.type` as `Brewery` (or `BarOrPub`, `Winery`,
  `Distillery` for other drinks businesses).
- `example.json` is gone once installed; AGENTS.md §1 gets the two-sentence
  description of the business instead.

## 3. The beers

- `src/data/beers.ts`: one entry per core beer. Each gets its page from
  `src/pages/beers/[slug].astro` automatically. Choose a `tone` for its can
  from the six in `src/components/CanArt.astro`, or add one there (a class
  with `--label`, `--ink` and `--accent`), and add its `vt-<slug>` rule to
  `motion.css` so its can morphs between pages.
- Describe styles in lower case unless a word is a proper noun
  ("hazy pale ale", "West Coast IPA"): they are used mid-sentence.

## 4. The waffle app: tap list, events, and the private event form

- **`GET /api/site/taplist`** answers in the shape of
  `api-fixtures/api/site/taplist.json`: `updated` (an ISO date and time with
  its zone) and `taps`, each with `tap`, `name`, `style`, `abv`, `ibu` (or
  null), `new`, `limited`, `dispense` (`draft`, `nitro` or `cask`), `pours`
  (each `size`, `ounces`, `price_cents`) and optionally `beer`, the slug of
  a core beer in `beers.ts`. `src/lib/taplist.ts` checks every field and
  lists the ways it can be wrong.
- **`GET /api/site/events`** answers in the shape of
  `api-fixtures/api/site/events.json`: `events`, each with `id` (a slug),
  `date` (YYYY-MM-DD), `time` (HH:MM or null), `title`, `description` and
  `kind` (one of the kinds in `src/lib/events.ts`). Upcoming events only;
  the site shows what the app sends.
- **`POST /api/site/forms/private-event`** receives `event_type`, `date`,
  `guests`, `space`, `name`, `email`, `phone`, `message`, `age_ok` and the
  honeypot (docs/forms.md). Change the fields in
  `src/components/PrivateEventForm.astro` and the app's handler together;
  the space choices come from `src/data/spaces.ts`.
- The tap list and events are as fresh as the last build: when the bar
  changes the board, release (or re-run the workflow for the current tag).
  A brewery whose board changes daily may want a scheduled rebuild.

## 5. The look

- Swap the palette tokens in `src/styles/global.css` for the brewery's
  colours; keep the contrast (text 4.5:1, large text and controls 3:1). The
  site is dark on purpose; a light brand needs the plates, the board and the
  footer reconsidered together.
- Replace the logo: `src/components/LogoMark.astro` and `brand/mark.svg`
  (keep them the same drawing), then copy `brand/mark.svg` to
  `public/favicon.svg` and render `public/logo.png` and
  `public/og-default.png` from `brand/logo.html` and `brand/og.html` with a
  headless browser at 512x512 and 1200x630.
- Replace the photographs in `src/assets/photos/` and their entries in
  `src/data/photos.ts` with the brewery's own. Remove the Unsplash credits
  that no longer apply; delete `/credits/` if none remain (and its entry in
  `site.noindex`).
- Change the typefaces in `src/fonts.ts` only with a reason; keep them
  self-hosted with their licences beside them.

## 6. Pages and posts

Rewrite each page for the real brewery, one at a time, showing the user each
(docs/pages.md): the taproom's trucks and rules, the tours, the spaces, the
story and the people, the FAQ. Then the blog: keep the posts the user agrees
are true for their brewery and rewrite them in their voice, delete the rest,
and write new ones from their customers' real questions (docs/blog.md).
Every post needs a real author. Titles stay at 42 characters or fewer, so
the brewery's name still fits after them.

## 7. Checks

`tests/e2e/site.checks.js` (this example's `checks.js`) names Ironwood's
pages, its twelve taps and their prices, its eight events, its form's
fields and its eleven posts. Update it as the pages and the data change: it
is the site's own test now. Then:

```bash
./tools/npm.sh run build     # 0 errors, 0 warnings
./tools/test.sh --coverage   # the gate
```

Look at every changed page at 390 px and 1440 px before calling it done.
