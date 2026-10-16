# Playbook: dental

For the agent turning this example into a real dental practice's site (or
any appointment-led health practice that wants to feel calm: a family
dentist, an orthodontist, a hygienist's practice, a small physiotherapy or
optometry clinic). Work through it in order, showing the user each step.
AGENTS.md is the rulebook; this is the route.

## What the example is

**Brightside Family Dental**, a fictional, anxiety-aware family practice on
Honeysuckle Lane in Thistlewood (an invented town), with:

| Page | File | Built from |
|---|---|---|
| Home | `src/pages/index.astro` | hero with a blob-masked photo, the "How are you feeling?" chooser, `TreatmentGrid`, `Marquee`, `VisitPath`, `TeamGrid`, the insurance teaser (waffle data), numbers, `KindWords`, `PostGrid`, `BookingBand` |
| Treatments, and one page per treatment | `src/pages/treatments/` | `src/data/treatments.ts`, `layouts/TreatmentPage.astro` (MedicalProcedure + FAQPage) |
| The team, and one page per dentist | `src/pages/team/index.astro`, `team/[slug].astro` | `src/data/team.ts` (a Person node each) |
| New patients | `src/pages/new-patients.astro` | `src/data/first-visit.ts` through `VisitPath` |
| Nervous patients | `src/pages/nervous-patients.astro` | `Breathe` (a breathing guide), `Faq` |
| Insurance & payment | `src/pages/insurance.astro` | `GET /api/site/insurance` through `src/lib/insurance.ts`, `InsuranceList` |
| Book a visit, and its thank-you page | `src/pages/book.astro`, `book/thanks.astro` | `AppointmentForm` posting to `/api/site/forms/appointment` |
| FAQ, About, Find us, Privacy | `src/pages/*.astro` | `Faq` (FAQPage markup), `site.ts` for every fact |
| Blog | `src/content/blog/*.md` | 10 posts by the dentists, 6 to a page, tagged, with a feed |
| Credits | `src/pages/credits.astro` | `src/data/photos.ts` |

**Look:** airy and reassuring, never clinical blue-and-white. Cream paper
(`--color-bg`), soft mint for calm, warm coral for the one action ("Book a
visit") and the smile, butter yellow for children and highlights, a deep
forest green for text and the footer. Fredoka (rounded) for headings, Figtree
for reading. Organic blob shapes (`--blob-a/b/c`), arched portraits
(`--arch`), pill-shaped photo masks, and a lot of room between bands. The
header is a floating rounded bar; phones get a floating call / book pill.
Tokens are at the top of `src/styles/global.css`.

**Motion** (`src/styles/motion.css`, all CSS, all off under reduced motion):
slow cross-fading view transitions in which a treatment's card photo grows
into its page's hero (and a dentist's portrait into theirs); the logo
drawing its smile on load while its pebble sways and its sparkle twinkles (pages with no hero photo float a large copy of the pebble that draws its own smile);
hero blobs and blob-masked photos slowly changing shape and drifting;
floating chips and sparkles; hand-drawn smiles under hero words drawing
themselves; bands and cards rising softly into view; the first-visit path
filling as you scroll down it, each step's pebble warming to mint; a slow
ribbon of reassurances; FAQ answers opening softly; the header settling a
shadow on scroll; a reading line on posts; and on the nervous-patients page
a breathing pebble that swells for four seconds and settles for four.

## 1. Interview

Ask, and write nothing until you have the answers (placeholders are fine
where the user does not know yet; never invent a real-looking fact):

- The practice's name, legal name, phone, email, address, hours (including
  any late or Saturday clinics) and how it handles emergencies.
- Its registration or licence details, and the year it opened.
- The dentists and hygienists: names, qualifications **exactly as they write
  them**, what each does most, days they work, languages, and a few true,
  human details each is happy to share. Real photographs of each.
- The treatments it offers, most important first, and any it does not.
  For each: what a typical appointment involves, in the dentist's words.
  Nothing on the site may promise a result; ask the dentists to check every
  treatment page.
- How it looks after nervous patients, honestly: longer slots, talk-first
  visits, sedation (only if they offer it, worded as they want it).
- The insurance plans it accepts (in and out of network), payment options,
  membership plans and their prices, and whether the waffle app holds them.
- What the booking form must ask, and what the front desk does with it.
- Real kind words from patients they may quote, with permission, and where
  they came from.
- Their colours and logo, if they have them.

## 2. The practice

- `src/site.ts`: `name` (short: it follows every page title, and the whole
  title must stay under 65 characters), `business` (full name, contact,
  hours, address, registration), `areas`, navigation, footer, blog author.
- `example.json` is gone once installed; AGENTS.md §1 gets the two-sentence
  description of the practice instead.

## 3. Treatments and the team

- `src/data/treatments.ts`: one entry per treatment, each with its page in
  `src/pages/treatments/<slug>.astro` (copy one, rewrite every word with the
  dentist, keep the before / during / after general and true). Remove an
  entry and its page together. Update the view-transition names in
  `motion.css` (one line per slug) so cards still grow into heroes.
- `src/data/team.ts`: one entry per dentist; `team/[slug].astro` builds the
  pages. Same view-transition lines for dentists. Never invent a
  qualification or a detail for a real person.
- `src/data/first-visit.ts`: the first-visit steps, as the practice really
  runs them.
- `src/data/kind-words.ts`: real patients' words only, shown as text, never
  marked up as reviews.

## 4. Insurance and the appointment form

- The insurance page and the home page read `GET /api/site/insurance` at
  build time, parsed strictly by `src/lib/insurance.ts` (its failure list is
  at the top of the file). Make the app's endpoint answer in the shape of
  `api-fixtures/api/site/insurance.json` (docs/waffle-api.md): `updated`,
  `plans` (id, name, type, network, note) and `payments` (id, name, note,
  optional `from_cents` with `per`). If the practice does not publish its
  plans, delete the page, the home page's teaser, the form's insurance
  choice, the fixture and the endpoint in `example.json`.
- The booking form posts to `POST /api/site/forms/appointment`
  (docs/forms.md): patient_type, appointment_for, name, phone, email,
  reason, nervous, insurance, days[], times[], message, contact_by and the
  honeypot. Adjust the fields in `AppointmentForm.astro` and the waffle
  app's handler together. The app should treat this as a request, not a
  booking, and must not ask for medical detail through it.

## 5. The look

- Swap the palette tokens in `src/styles/global.css` for the practice's
  colours; keep it calm and keep the contrast (text 4.5:1, large text and
  controls 3:1). Coral is the one action colour: keep one.
- Replace the logo: `src/components/Logo.astro` (inline, so it can animate),
  `public/favicon.svg`, and the sources in `brand/` (`logo.html`, `og.html`),
  rendered to `public/logo.png` (512x512) and `public/og-default.png`
  (1200x630).
- Replace every photograph in `src/assets/photos/` and its entry in
  `src/data/photos.ts` with the practice's own: its rooms, its team, and
  patients who have agreed. The example people are Unsplash models. Remove
  credits that no longer apply; delete `/credits/` if none remain (and its
  `site.noindex` entry).
- Change the typefaces in `src/fonts.ts` only with a reason; keep them
  self-hosted, with their licences.

## 6. Pages and posts

Rewrite each page for the real practice, one at a time, showing the user
each (docs/pages.md). Health pages need care: describe, do not promise;
send people with severe symptoms to emergency care; have a dentist read
every treatment page and post. Then the blog: keep the posts the dentists
agree with and rewrite them in their voice, delete the rest, and write new
ones from patients' real questions (docs/blog.md). Every post needs a real
author; a dentist named in `team.ts` gets their portrait beside the post.
Keep post titles under 45 characters so the site name still fits.

## 7. Checks

`tests/e2e/site.checks.js` (this example's `checks.js`) names the example's
treatments and dentists, the fixture's 9 plans and $329 membership, the
form's fields and the 10 published posts. Update it as the pages change: it
is the site's own test now. Then:

```bash
./tools/npm.sh run build     # 0 errors, 0 warnings
./tools/test.sh --coverage   # the gate
```

Look at every changed page at 390 px and 1440 px before calling it done.
