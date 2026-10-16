# Playbook: veterinary clinic

For the agent turning this example into a real veterinary practice's site
(or any small-animal clinic, exotic-pet vet, mobile vet or animal hospital
that books appointments and sells wellness plans). Work through it in order,
showing the user each step. AGENTS.md is the rulebook; this is the route.

## What the example is

**Paws & Whiskers Animal Hospital**, a fictional neighbourhood vet in the
invented town of Bramblewick, with:

| Page | File | Built from |
|---|---|---|
| Home | `src/pages/index.astro` | the hero collage, `Marquee`, `ServiceStickers`, `PawTrail`, the plans teaser, `FirstVisit`, `TeamPolaroids`, reviews, `UrgentBand`, `PostGrid` |
| Services, and one page per service | `src/pages/services/` | `src/data/services.ts`, `layouts/ServicePage.astro` |
| Wellness plans | `src/pages/wellness-plans.astro` | `GET /api/site/wellness-plans` through `src/lib/wellness-plans.ts`, `PlanCard` |
| The team | `src/pages/team.astro` | `src/data/team.ts` (each person pictured by their pet) |
| New clients | `src/pages/new-clients.astro` | `FirstVisit`, checklists, `Faq` (FAQPage markup) |
| Pet resources | `src/pages/resources.astro` | household dangers, vital signs, a first-aid kit, the latest posts |
| Emergency | `src/pages/emergency.astro` | the two numbers from `site.ts` (`business.phone`, `afterHours`); calm, no motion |
| FAQ, About, Find us, Privacy | `src/pages/*.astro` | `Faq`; a drawn map on `/contact/` |
| Book, and its thank-you page | `src/pages/book*.astro` | `AppointmentForm` posting to `/api/site/forms/appointment` |
| Blog | `src/content/blog/*.md` | 10 posts and 1 draft, paginated (7 a page), tagged, with a feed |
| Credits | `src/pages/credits.astro` | `src/data/photos.ts` (kept out of search) |

**Look:** bright and joyful. Sunshine yellow (`--sun`), deep teal
(`--teal`, `--teal-deep`), tomato (`--tomato` for decoration, `--tomato-ink`
for text and buttons) and cream paper, all drawn with one thick ink line.
Cards are stickers: a 3px outline, a hard offset shadow, a slight tilt.
Photos are cut into blobs, arches, circles and, once, a paw print. Type is
Fredoka (chunky, rounded: headings, buttons, stickers) over Nunito (body).
The paw-and-bone wallpaper is a CSS data-URI pattern in
`src/styles/global.css`, with every token.

**Urgent care is calm on purpose.** The strip at the top of every page, the
`UrgentBand`, the urgent-care service page and the emergency page are deep
teal, square-ish, untilted and still (`.calm` switches motion off inside
them). Keep it that way: someone reading those may be frightened.

**Motion** (`src/styles/motion.css`, all CSS): view transitions between
pages, with each service sticker's photo growing into that service page's
hero; springy, overshooting entrances; the logo's tail wags (and its ears
flop on hover); the "new clients welcome" sticker wobbles; bones and hearts
float; the hero blob slowly changes shape; the marquee slides; paw prints
walk across the page one step at a time as you scroll; a paw trots along
the header as you read; stickers squash and stretch on hover; the first-visit
path draws itself; the team's photos drift sideways; FAQ answers slide open.
Everything sits inside `prefers-reduced-motion: no-preference`, the
scroll-driven parts inside `@supports (animation-timeline: view())`.

## 1. Interview

Ask, and write nothing until you have the answers (placeholders are fine
where the user does not know yet; never invent a real-looking fact):

- The practice's name, legal name, phone, email, street address and hours.
- Who they send clients to out of hours: the emergency hospital's name,
  address and phone, and whether the practice takes its own night calls.
- Premises registration or licence numbers, and the year founded.
- The species they see, and any they do not (exotics are a big decision).
- The services they offer, most important first, and what each involves.
- Whether they sell wellness plans; if so, the plans, prices and
  inclusions, and whether the waffle app holds them.
- The team: names, roles, credentials, a line each, and whether they want
  photos of themselves or of their own pets (with permission either way).
- Real client reviews they may quote, with permission, and their source.
- Photographs of the building, the team and patients (owners' permission).
- Their colours and logo, if they have them.

## 2. The business

- `src/site.ts`: name, tagline, description, contact, hours (`hours` for
  search engines and `hoursText` for people, in the same order), address,
  licence, `afterHours`, `areas`, navigation, footer, blog author. The
  rename (`tools/setup.sh`) set the name; check every other field.
- `business.type` stays `VeterinaryCare` (a schema.org LocalBusiness).
- `example.json` is gone once installed; AGENTS.md §1 gets the two-sentence
  description of the business instead.

## 3. Services, team and reviews

- `src/data/services.ts`: one entry per service, each with its page in
  `src/pages/services/<slug>.astro` (copy one, rewrite every word, keep the
  FAQ honest). Add its `vt-<slug>` view-transition rule in `motion.css` so
  the sticker's photo morphs into the page. Mark urgent or emergency
  services `tone: 'calm'`.
- `src/data/team.ts`: the real team. The example pictures pets because the
  people are invented; a real practice can use either.
- `src/data/reviews.ts`: real reviews only, shown as text, never marked up.

## 4. Wellness plans and the appointment form

- The plans page and the service pages read `GET /api/site/wellness-plans`
  at build time. The app must answer in the shape of
  `api-fixtures/api/site/wellness-plans.json`: `updated`, `currency`, and
  `plans` with `id`, `name`, `species` (`dog`, `cat`, `rabbit`),
  `lifeStage` (`young`, `adult`, `senior`), `ages`, `monthlyPrice` in
  cents, `popular` and `inclusions`. `src/lib/wellness-plans.ts` refuses
  anything else, naming the field. A new species means adding it to
  `SPECIES` and `speciesNames` there, and to the looks in
  `src/pages/wellness-plans.astro`.
- No plans? Delete the page, `PlanCard`, `src/lib/wellness-plans.ts`,
  `src/lib/load-plans.ts`, the fixture, the nav link, the home teaser and
  `plans` in `services.ts`, and remove the endpoint from the checks.
- The appointment form posts to `POST /api/site/forms/appointment` with
  `client_type`, `pet_name`, `age`, `species`, `reason`, `details`,
  `preferred_times` (a list), `name`, `phone`, `email` and `contact_by`
  (docs/forms.md). Change fields in the form and the waffle app's handler
  together.

## 5. The look

- Swap the palette tokens at the top of `src/styles/global.css` for the
  practice's colours; keep the contrast notes true (text 4.5:1, large text
  and controls 3:1). Keep a calm colour for urgent care.
- Replace the logo: `src/components/Logo.astro` (inline, so the tail can
  wag), `brand/mark.svg`, `public/favicon.svg`, then render
  `public/logo.png` and `public/og-default.png` from `brand/logo.html` and
  `brand/og.html` (any headless browser at 512x512 and 1200x630).
- Replace the photographs in `src/assets/photos/` and `src/data/photos.ts`
  with the practice's own; remove credits that no longer apply, and delete
  `/credits/` if none remain (and its `site.noindex` entry).
- Change the typefaces in `src/fonts.ts` only with a reason; keep them
  self-hosted, with their licences beside them.

## 6. Pages and posts

Rewrite each page for the real practice, one at a time, showing the user
each. The drawn map on `/contact/` is an illustration: redraw it for the
real street or replace it with directions. Then the blog: keep the posts
the vets agree with and rewrite them in their voice, delete the rest, and
write new ones from clients' real questions. Every post needs a real
author, and clinical advice must be checked by a vet.

## 7. Checks

`tests/e2e/site.checks.js` (this example's `checks.js`) names the pages,
the eight plans in the fixture, the form's fields, the calm emergency page
and the ten published posts. Update it as the site changes: it is the
site's own test now. Then:

```bash
./tools/npm.sh run build     # 0 errors, 0 warnings
./tools/test.sh --coverage   # the gate
```

Look at every changed page at 390 px and 1440 px before calling it done,
and once with reduced motion switched on.
