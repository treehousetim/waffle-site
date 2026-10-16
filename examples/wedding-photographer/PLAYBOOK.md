# Playbook: wedding and portrait photographer

For the agent turning this example into a real photographer's site (or any
studio whose work is its photographs: a wedding videographer, a portrait or
family photographer, an elopement guide). Work through it in order, showing
the user each step. AGENTS.md is the rulebook; this is the route.

## What the example is

**Juniper & Vale**, a fictional two-person wedding, elopement and portrait
studio in Port Alder, on the invented Saltgrass Coast, with:

| Page | File | Built from |
|---|---|---|
| Home (the cover) | `src/pages/index.astro` | the cover photo and lines, the studio's letter, the stories track, the places marquee, the three rooms, a couple's line, how it unfolds, packages from `GET /api/site/packages`, the newest journal entries |
| Stories, and one page per story | `src/pages/stories/` | `src/data/stories.ts`; each story page has `Gallery` (the spread and the full-screen viewer) and ImageGallery structured data |
| Portfolio, and a page per kind of day | `src/pages/portfolio/` | `categories` in `src/data/stories.ts`, `ContactSheet`, and `RateCard` narrowed to that kind |
| Packages & pricing | `src/pages/packages.astro` | `GET /api/site/packages` through `src/lib/packages.ts`, `RateCard`, add-ons, an OfferCatalog and an FAQ |
| Enquire, and its thank-you page | `src/pages/enquire*.astro` | `GET /api/site/availability` through `src/lib/availability.ts` (`AvailabilityStrip`), and `EnquiryForm` posting to `POST /api/site/forms/enquiry` |
| The experience, About, FAQ, Privacy | `src/pages/*.astro` | the process chapters; the two photographers; `Faq` with FAQPage markup |
| The Journal (the blog) | `src/content/journal/*.md` | 9 published planning posts and a draft, paginated, tagged, with a feed at `/journal/rss.xml` |
| Credits | `src/pages/credits.astro` | `src/data/photos.ts` |

**Look:** an editorial magazine. Ivory paper (`--paper`) and ink-black
(`--ink`), one oxblood accent (`--accent`) used only for small marks: the
ampersand, folios, figure numbers. Bodoni Moda, a high-contrast Didone with an
optical-size axis, for headlines, numerals and italic captions; Jost for
reading and for the small tracked capitals. Full-bleed photographs, generous
whitespace, captions printed under every photograph ("Fig. 3"), hairline
rules, a faint film grain over everything (`public/grain.svg`), and the
studio's name set huge across the bottom of every page. Tokens are at the top
of `src/styles/global.css`.

**Motion** (`src/styles/motion.css`, every rule switched off under reduced
motion): page turns with the browser's view transitions, the masthead staying
put and a story card's photograph morphing into the story's hero (one
`view-transition-name` line per story); openers rising in line by line with
the italic line wiping in like ink; a slow Ken Burns drift on hero photos;
curtain reveals (`clip-path`) on photographs as they scroll in, with their
captions sliding after; the home page's stories running sideways on a pinned
scroll-driven track; a marquee of places; the logo drawing itself and its sun
setting into the valley every twenty seconds; FAQ answers opening to their
height; a reading-progress line on posts; and the full-screen viewer, which is
plain `:target` links without script and gains keyboard, swipe, focus and
tidy history from `src/scripts/viewer.ts`. Scroll-driven rules are written as
longhands: the CSS minifier breaks the `animation` shorthand when it is
followed by `animation-timeline`.

## 1. Interview

Ask, and write nothing until you have the answers (placeholders are fine
where the user does not know yet; never invent a real-looking fact):

- The studio's name, legal name, phone, email, studio address (or "by
  appointment only"), and the towns and venues they work in most.
- Who the photographers are: names, how they work on the day (alone, as a
  pair, with a second shooter), and a sentence each about how they started.
- What they photograph: weddings, elopements, portraits, families, events.
  Which they want more of. Which they no longer take.
- Their packages: names, hours, how many photographers, what is included,
  prices, add-ons, and whether the waffle app holds them.
- Whether they publish availability, and how (months, or dates).
- Real stories they may publish: for each, the couple's or family's
  permission, the place, the date, the photographs and a line from them.
- Their own photographs for the cover, the about page and every story. This
  site is nothing without them.
- How they want enquiries: what they need to know before replying.

## 2. The studio

- `src/site.ts`: name (short: it follows every page title), tagline,
  description, contact, address, hours, areas, the photographers' names,
  navigation, footer, journal author. `business.type` stays
  `ProfessionalService` unless the user's business is better described by
  another schema.org LocalBusiness type.
- `example.json` is gone once installed; AGENTS.md §1 gets the two-sentence
  description of the business instead.

## 3. The work

- `src/data/photos.ts` and `src/assets/photos/`: replace every Unsplash
  stand-in with the studio's own photographs, with real alt text. Remove the
  Unsplash credits; delete `/credits/` if none remain (and its entry in
  `site.noindex`, and the footer link).
- `src/data/stories.ts`: one entry per published story, its frames in the
  order of the day, each with a caption in the photographers' voice and a
  layout (`bleed`, `wide` or `tall`; two `tall` frames in a row sit side by
  side). Add a line per story to "Story photos morph" in `motion.css`.
  Publish only with permission, and only quotes the couple wrote.
- `categories` in the same file: the portfolio's rooms. Rename or remove
  them to match what the studio sells; each needs a `kind` the packages use.

## 4. Packages, the calendar and the enquiry

- `GET /api/site/packages` must answer in the shape of
  `api-fixtures/api/site/packages.json`; `src/lib/packages.ts` refuses
  anything else, naming the field. `kind` ties a collection to its portfolio
  room; at most one is `featured`.
- `GET /api/site/availability` answers month by month: `booked` (no dates),
  `limited` or `open` (with how many). If the studio does not publish
  availability, delete `AvailabilityStrip`, its parser, the fixture, its use
  on `/enquire/` and its line in `example.json`.
- `POST /api/site/forms/enquiry` (docs/forms.md) receives names, email,
  phone, date, venue, guests, package and message. Change the fields in
  `EnquiryForm` and in the waffle app's handler together.
- Data is as fresh as the last build: when the studio books a date or changes
  a price, release (or re-run the workflow for the current tag).

## 5. The look

- Swap the palette in `src/styles/global.css` only with a reason; keep the
  contrast (text 4.5:1, large text 3:1). Oxblood on ivory and the muted greys
  are measured; check any change.
- Replace the logo: `src/components/Logo.astro` (the arch, valley and sun),
  `public/favicon.svg`, and re-render `public/logo.png` and
  `public/og-default.png` from `brand/logo.html` and `brand/og.html`.
- Typefaces in `src/fonts.ts`, self-hosted with their licences in
  `src/assets/fonts/`.

## 6. Pages and posts

Rewrite each page for the real studio, one at a time, showing the user each
(docs/pages.md): the home page's letter and cover lines, the experience
chapters (their real process and turnaround times), the FAQ, about, privacy.
Then the journal: keep the posts the user agrees are true for their studio and
rewrite them in their voice, delete the rest, and write new ones from the
questions their couples really ask. Post titles stay under 48 characters so
the studio's name fits after them.

## 7. Checks

`tests/e2e/site.checks.js` (this example's `checks.js`) names the example's
pages, its five packages, its twelve months, its four stories and their
viewers, its nine published posts, and runs the two parsers against broken
answers. Update it as the site changes: it is the site's own test now. Then:

```bash
./tools/npm.sh run build     # 0 errors, 0 warnings
./tools/test.sh --coverage   # the gate
```

Look at every changed page at 390 px and 1440 px before calling it done, and
open a story's viewer with and without script.
