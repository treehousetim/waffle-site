# Playbook: electrician

For the agent turning this example into a real electrician's site (or any
local trade that quotes jobs and covers a set of towns: plumber, roofer,
HVAC, locksmith). Work through it in order, showing the user each step.
AGENTS.md is the rulebook; this is the route.

## What the example is

**Waffle Site**, a fictional electrician in Springfield, with:

| Page | File | Built from |
|---|---|---|
| Home | `src/pages/index.astro` | `Hero`, `TrustBar`, `CardGrid`, `Split`, `Steps`, `Testimonials`, `PostGrid`, `CallToAction` |
| Services, and one page per service | `src/pages/services/` | `src/data/services.ts`, `layouts/ServicePage.astro` |
| Areas, and one page per town | `src/pages/areas/` | `src/data/areas.ts`, `layouts/AreaPage.astro` |
| Prices | `src/pages/prices.astro` | `GET /api/site/prices` through `parsePriceGuide`, `PriceGuide` |
| Emergency | `src/pages/emergency.astro` | the 24/7 line from `site.ts` |
| Reviews, FAQ, About, Privacy | `src/pages/*.astro` | `src/data/reviews.ts`; `Faq` (with FAQPage markup) |
| Contact, and its thank-you page | `src/pages/contact*.astro` | `QuoteForm` posting to `/api/site/forms/quote` |
| Blog | `src/content/blog/*.md` | 25 posts, paginated, tagged, with a feed |
| Credits | `src/pages/credits.astro` | `src/data/photos.ts` |

**Look:** light, purple for actions, amber only for emergencies and stars,
Inter throughout, heavy tight headings, photo-led bands, a dark footer.
Tokens are at the top of `src/styles/global.css`; motion is in
`src/styles/motion.css` (view transitions between pages, the hero rising in,
bands and cards rising as they scroll into view, the header lifting, a
reading-progress bar on articles).

## 1. Interview

Ask, and write nothing until you have the answers (placeholders are fine
where the user does not know yet; never invent a real-looking fact):

- The business's name, legal name, phone, email, street address, hours, and
  whether it answers emergencies out of hours.
- Licence number and the body that issued it; insurance; year founded.
- The services they want to sell, most profitable first. Any they do not do.
- The towns they cover, and for each something true and particular: a
  housing stock, a utility, a permit office, a job they did there.
- Their prices, if they publish them, and whether the waffle app holds them.
- Real reviews they may quote, with permission, and where they came from.
- Photographs of their own people, vans and work.
- Their colours and logo, if they have them.

## 2. The business

- `src/site.ts`: name, tagline, description, contact, hours, address,
  licence, social profiles, navigation, footer, blog author. The rename
  (`tools/setup.sh`) set the name; check every other field.
- `example.json` is gone once installed; AGENTS.md §1 gets the two-sentence
  description of the business instead.

## 3. Services and towns

- `src/data/services.ts`: one entry per service; each needs its page in
  `src/pages/services/<slug>.astro` (copy one, rewrite every word). Remove a
  service's entry and page together.
- `src/data/areas.ts` and `src/pages/areas/<slug>.astro`: the same, and a
  town page must say something true about that town and no other
  (docs/pages.md, "Town pages"). Fewer, better town pages beat many thin ones.

## 4. Prices and the quote form

- The price guide reads `GET /api/site/prices` from the waffle app at build
  time. If the business does not publish prices, delete `src/pages/prices.astro`,
  `PriceGuide`, the fixture and the nav link, and the service pages' price
  rows. If it does, make sure the app's endpoint answers in the shape of
  `api-fixtures/api/site/prices.json` (docs/waffle-api.md).
- The quote form posts to `POST /api/site/forms/quote` (docs/forms.md). Adjust
  its fields to what the business needs to price a job, in the form and in the
  waffle app's handler together.

## 5. The look

- Swap the palette tokens in `src/styles/global.css` for the business's
  colours; keep the contrast (text 4.5:1, large text and controls 3:1).
- Replace the logo: `src/components/Logo.astro`, `src/icons/logo.svg`,
  `public/favicon.svg`, `public/logo.png`, `public/og-default.png`.
- Replace the photographs in `src/assets/photos/` and their entries in
  `src/data/photos.ts` with the business's own. Remove the Unsplash credits
  that no longer apply; delete `/credits/` if none remain (and its entry in
  `site.noindex`).
- Change the typeface in `src/fonts.ts` only with a reason; keep it
  self-hosted.

## 6. Pages and posts

Rewrite each page for the real business, one at a time, showing the user
each (docs/pages.md). Then the blog: keep the posts the user agrees are true
for their business and rewrite them in their voice, delete the rest, and
write new ones from their customers' real questions (docs/blog.md). Every
post needs a real author.

## 7. Checks

`tests/e2e/site.checks.js` (this example's `checks.js`) names the
electrician's pages, its 12-row price guide and its 24 published posts.
Update it as the pages change: it is the site's own test now. Then:

```bash
./tools/npm.sh run build     # 0 errors, 0 warnings
./tools/test.sh --coverage   # the gate
```

Look at every changed page at 390 px and 1440 px before calling it done.
