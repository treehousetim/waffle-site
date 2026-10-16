# Example sites

The template ships complete example sites in `examples/<name>/`, one per kind
of business, each with its own design. They are starting points, not themes:
`./tools/setup.sh` installs the one you choose as your site's own code
(docs/create-project.md), and your agent then reshapes it for the real
business, following the example's playbook.

```bash
./tools/setup.sh --list-examples               # what there is
SITE_EXAMPLE=bakery ./tools/npm.sh run dev     # look at one, in the template
SITE_EXAMPLE=bakery ./tools/test.sh --group=e2e
```

In the template repository every example is built, audited and checked on
every change, so none of them can rot. `SITE_EXAMPLE` picks which one the dev
server and a plain build use (default `electrician`); the end-to-end group
builds them all.

## What is shared and what is not

| Shared: `src/core/` | Each example's own: `examples/<name>/` |
|---|---|
| settings, the waffle API client, the SEO and structured-data helpers, the audit, the `<Seo>` head, robots.txt | every page, layout, component, style, font, icon, photograph, the logo, the blog posts, the fixtures |

An example imports the core as `@core/...` and nothing from any other
example. Copying a good component from one example into another is fine and
expected; sharing it is not, because once an example is installed it is the
site's own code to change, and a change must never reach another site.

The core is not edited to suit one example. If an example needs something the
core does not do, it does it itself, in its own `src/`.

## The contract: what every example has

```
examples/<name>/
  example.json            # name, label, description, kind, schemaType, look, waffleEndpoints
  PLAYBOOK.md             # how an agent turns this example into a real business's site
  checks.js               # this example's own end-to-end checks
  tsconfig.json           # extends ../../tsconfig.json (copy the electrician's)
  api-fixtures/api/site/  # what each GET endpoint in example.json returns
  public/                 # favicon.svg, logo.png (512 px), og-default.png (1200x630)
  src/
    site.ts               # the business: name, contact, hours, nav, footer, noindex list, blog settings
    fonts.ts              # the typefaces, through Astro's Fonts API, self-hosted from src/assets/fonts/
    content.config.ts     # the blog's schema
    content/blog/*.md     # the blog: at least 8 posts
    pages/                # index, 404, about, contact (+ thanks), credits, privacy, blog/... at least
    layouts/Base.astro    # the head (through @core/components/Seo.astro), header, footer
    components/           # its own; Logo.astro draws the logo
    styles/               # its own design tokens and motion
    data/photos.ts        # every photograph with alt text and credit, for /credits/
    assets/photos/        # the photographs
    assets/fonts/         # the font files and their licences
```

`example.json`:

| Field | Meaning |
|---|---|
| `name` | the directory's name: lowercase letters, digits, dashes |
| `label` | what `--list-examples` shows: "Mobile auto detailing" |
| `description` | one or two sentences on the business and what the site does |
| `kind` | the family: "Local trade", "Hospitality", "Health", "Studio", "Retail"... |
| `schemaType` | the schema.org type of the business node on every page, e.g. `AutoWash`, `Bakery`, `Dentist` |
| `look` | one line on the design: palette, type, mood |
| `waffleEndpoints` | every endpoint the site uses, `"GET /api/site/menu"` or `"POST /api/site/forms/booking"`. The end-to-end test fails if the production build reads a GET endpoint not listed here, or does not read one that is |

## The rules every example meets

Everything in AGENTS.md §4 holds for every example. The end-to-end test and
the audit check most of it; the rest is review.

1. **It builds clean.** `astro check` passes and the audit reports 0 errors and
   0 warnings, in production and development. One `<h1>` per page, a unique
   title and description, alt text on every image, no broken internal link.
2. **The business is fictional, and plainly so.** Invented name, a 555-01xx
   phone number, an `example.com` email address, a street address in a
   fictional town or plainly made up. Never a real business's name, logo,
   review or credential.
3. **The logo is drawn for it**: an original SVG mark and wordmark in
   `src/components/Logo.astro` (or `src/icons/logo.svg`), also as
   `public/favicon.svg` and rendered to `public/logo.png`. Not a real brand's
   mark, not clip art.
4. **Photographs are free Unsplash photos only**: from `images.unsplash.com`,
   never `plus.unsplash.com` (Unsplash+ is not free). Check each on its
   `unsplash.com/photos/<id>` page, record the photographer and that page in
   `src/data/photos.ts`, and list them all on `/credits/` (kept out of search
   results). They are not covered by the repository's MIT licence.
5. **Fonts are self-hosted** through Astro's Fonts API from files in the
   example, under the SIL Open Font License or similar, with the licence file
   beside them. No font CDN: the content security policy blocks it.
6. **Nothing inline that Astro does not hash**: no `style=` or `on*=`
   attributes, no `set:html` of a `<script>` or `<style>`. Component `<style>`
   and `<script>` blocks are fine: Astro bundles or hashes them
   (`security.csp`). No third-party script, embed, map or font.
7. **Motion is part of the design** (below), and every bit of it stops for
   `prefers-reduced-motion: reduce`.
8. **Waffle data is parsed before it is rendered.** An example reads its
   endpoints through `waffle.get()` from `@core/settings`, and checks every
   field in its own code (or with a parser in `src/core/lib/` when one fits,
   such as `parsePriceGuide`). Forms post to `/api/site/forms/<name>` and work
   without script (docs/forms.md).
9. **It looks right at 390 px and at 1440 px.**
10. **Its `checks.js` checks what is particular to it**: its pages, its
    structured data, the waffle data it shows, its form.

## Motion

Each example moves in its own way; this is the toolkit, all of it CSS or
Astro, none of it a library:

- **Page transitions**: the browser's own cross-document view transitions,
  `@view-transition { navigation: auto; }`, with `::view-transition-old/new`
  animations and `view-transition-name` on what should stay or morph (the
  header, a card's photo into the page's hero). Not Astro's `<ClientRouter>`:
  it does not work with the content security policy.
- **Entrances**: keyframe animations on load, staggered with `animation-delay`
  per `:nth-child`.
- **Scroll-driven animation**: `animation-timeline: view()` for reveals,
  `scroll(root)` for parallax, a shrinking header, a progress bar, a
  horizontal track that scrolls as the page does. Always inside
  `@supports (animation-timeline: view())`, so a browser without it shows the
  content, still.
- **Ambient motion**: slow gradients, marquees, floating shapes, an animated
  SVG logo: `@keyframes` on transforms and opacity only.
- **Interaction**: hover and focus transitions, `:has()`-driven states,
  `<details>` that animate with `interpolate-size: allow-keywords`.
- **Script**, when CSS cannot: a component `<script>` (bundled and hashed by
  Astro), small, and never needed to read the page.

Every rule sits inside `@media (prefers-reduced-motion: no-preference)`, and
the global stylesheet switches all animation off under `reduce`. Content is
never hidden waiting for an animation the browser cannot run.
`examples/electrician/src/styles/motion.css` is the reference.

## Adding an example

1. Copy `examples/electrician` to `examples/<name>` and change everything:
   the business, the design, the pages, the components. Delete what the
   business does not need; build what it does.
2. Write `example.json`, the playbook, and `checks.js`.
3. `SITE_EXAMPLE=<name> ./tools/npm.sh run build`, then look at it at both
   widths, then `./tools/test.sh --group=e2e`.
4. Add it to the table below.

## The examples

| Example | Kind | schema.org type | Waffle endpoints |
|---|---|---|---|
| `electrician` | Local trade | `Electrician` | price guide, quote form |
| `mobile-detailing` | Local service, mobile | `AutoWash` | detailing packages, booking form |
| `wedding-photographer` | Studio | `ProfessionalService` | packages, booked dates, enquiry form |
| `dental` | Health | `Dentist` | accepted insurance, appointment request |
| `bakery` | Food | `Bakery` | today's bakes, cake order form |
| `yoga-studio` | Wellness | `SportsActivityLocation` | class schedule, intro offer form |
| `brewery` | Hospitality | `Brewery` | tap list, events, private hire form |
| `veterinary` | Health | `VeterinaryCare` | wellness plans, appointment request |
| `law-firm` | Professional | `LegalService` | consultation request |
| `landscape-design` | Local trade | `HomeAndConstructionBusiness` | seasonal services, consultation form |
| `tattoo-studio` | Studio | `TattooParlor` | artists and their books, booking request |
| `interior-design` | Studio | `ProfessionalService` | enquiry form |
| `escape-room` | Entertainment | `EntertainmentBusiness` | rooms and open slots, booking form |
| `bookshop` | Retail | `BookStore` | events, staff picks, special order form |
| `climbing-gym` | Fitness | `ExerciseGym` | memberships, party booking form |
| `vintage-clothing` | Retail | `ClothingStore` | new arrivals, sell-to-us form |
| `music-school` | Education | `EducationalOrganization` | lesson rates, trial lesson form |
| `florist` | Retail | `Florist` | today's bouquets, order form |
| `tutoring` | Education | `EducationalOrganization` | test dates, assessment form |
| `kayak-tours` | Outdoors | `SportsActivityLocation` | tours and departures, booking form |
| `barber-shop` | Personal care | `HairSalon` | price list, barbers, booking form |
