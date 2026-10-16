# Adding and changing pages

Every page except a blog post is an `.astro` file in `src/pages/`, written by
hand or by an agent: ordinary HTML, plus components for the parts every page
shares. The file's path is its URL: `src/pages/services/lighting.astro` is
`/services/lighting/`.

## A new page, start to finish

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import Section from '../components/Section.astro';
---

<Base
    title="Commercial electrical work"
    description="Fit-outs, lighting and maintenance for shops, offices and cafés in Springfield, by licensed electricians who work around your opening hours."
    breadcrumbs={[{ name: 'Commercial', href: '/commercial/' }]}
>
    <Hero size="small" eyebrow="Commercial" heading="Electrical work that keeps your doors open" lead="..." />

    <div class="prose">
        <h2>...</h2>
        <p>...</p>
    </div>
</Base>
```

1. **`title` and `description` are required.** `astro check` fails the build
   without them. Write the title for a person scanning search results (under
   50 characters; the site name is added after it), and a description of
   50-160 characters that is not a copy of another page's.
2. **One `<h1>`.** `Hero` renders it. Everything else on the page is `<h2>` and
   below.
3. **Link it from somewhere**: the navigation or footer in `src/site.ts`, a
   card list, or another page. A page nobody links to is a page nobody finds.
4. **Run the build** (`./tools/npm.sh run build`) and read the audit's output.
   The page is done when it reports no errors and no warnings.
5. **Run the gate** (`./tools/test.sh --coverage`) before committing.

## Rules the build enforces

docs/seo.md has the full list. The ones that catch people out:

- **Nothing inline.** No `<script>` with code in it, no `<style>` element in
  the page, no `style="..."` or `onclick="..."`. Put styles in the component's
  `<style>` block (Astro writes it to a file) and scripts in `src/scripts/`.
- **Internal links must exist.** A link to `/servcies/` fails the build.
- **Images need `alt`.** Describe what the image shows; use `alt=""` for pure
  decoration.
- **Links end in a slash**: `/services/`, not `/services`.

## The components

| Component | What it is |
| --- | --- |
| `Hero` | The top of the page and its `<h1>`. `size="small"` for inner pages; a slot for a call box. |
| `Section` | A band with an optional heading and intro; `tone="surface"` alternates the background. |
| `CardGrid` | Linked cards: services, towns, any list of pages. |
| `FeatureGrid` | Icon, title, text, unlinked. |
| `Steps` | A numbered how-it-works list. |
| `Testimonials` | Quotes with a name and a line under it. |
| `Faq` | Questions and answers. Pass the same items to `faqPage()` in `jsonLd`. |
| `PriceGuide` | The waffle app's prices; `service="<slug>"` narrows it. |
| `QuoteForm` | The quote request the waffle app receives (docs/forms.md). |
| `PhoneLink` | The business phone, tap-to-call. `variant="button"` for a button. |
| `TrustBar` | Licensed, years in business, 24/7, free estimates. |
| `CallToAction` | The closing band with one button. |
| `Icon` | A small line icon; add one by adding its path. |

Shared text lives in `src/site.ts` (the business, navigation, footer) and
`src/data/` (services, towns, reviews). Change it there, not on each page.

## Service pages

`src/pages/services/<slug>.astro`, one per entry in `src/data/services.ts`,
built on `src/layouts/ServicePage.astro`. The layout adds the hero with both
ways to get in touch, this service's prices from the waffle app, its FAQ, the
towns served, and `Service` structured data. You write the copy in the slot
and three or four real questions. `tests/infra/structure.test.js` fails if a
service in the list has no page.

## Town pages

`src/pages/areas/<slug>.astro`, one per entry in `src/data/areas.ts`, built on
`src/layouts/AreaPage.astro`.

**Write each one for its town.** A page per town earns its place only with
copy that is true of that town and no other: the housing stock, the jobs you
do there, how far it is, local permitting. Search engines treat pages that
differ only in the town's name as doorway pages and rank none of them. If you
cannot write three honest paragraphs about a town, list it on `/areas/`
without a page of its own.

## Removing a page

Delete the file, then the build tells you every link that pointed at it.
Search engines that already know the URL will see a 404; for a page that had
traffic, add a redirect in `docker/caddy/Caddyfile` (`redir /old/ /new/ 308`
inside the `route`).
