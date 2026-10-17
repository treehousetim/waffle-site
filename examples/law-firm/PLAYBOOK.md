# Playbook: law firm

For the agent turning this example into a real law firm's site (or any small
professional practice that sells advice by the matter: an accounting firm, a
financial planner, a surveyor). Work through it in order, showing the user
each step. AGENTS.md is the rulebook; this is the route.

A law firm's website is regulated speech. In the United States every state's
rules of professional conduct govern lawyer advertising: what a firm may
call itself, whether it may quote clients, what notices it must carry, and
how it describes fees and results. **The firm's own attorneys must approve
every page before launch.** Never invent a credential, an admission, a case
result or a client remark, and never remove a notice without the firm's
say-so.

## What the example is

**Hale & Morrow**, a fictional four-attorney firm on Court Square in the
fictional county seat of Harrowmere, Ostrey County, with:

| Page | File | Built from |
|---|---|---|
| Home | `src/pages/index.astro` | the hero with its pleading margin, `Figures`, `Contents`, `Articles`, `Masthead`, `Remark`, `Docket`, `Closing` |
| Practice areas, and one page each | `src/pages/practice/` | `src/data/practice.ts`, `layouts/PracticePage.astro` (Service and FAQPage markup) |
| Attorneys, and one page each | `src/pages/attorneys/` | `src/data/attorneys.ts`, `layouts/AttorneyPage.astro` (Person markup) |
| How we work & fees | `src/pages/how-we-work.astro` | the process, three fee models with example figures, fee questions (FAQPage) |
| Insights (the blog) | `src/content/blog/*.md` | 10 explainers, paginated by 6, tagged, with a feed at `/insights/rss.xml`; `layouts/BlogPost.astro` adds the not-legal-advice note |
| Questions | `src/pages/faq.astro` | `Faq`, with FAQPage markup |
| Consultation, and its thank-you page | `src/pages/consultation*.astro` | `ConsultationForm` posting to `/api/site/forms/consultation` |
| About, Privacy, Attorney advertising notice, Credits, 404 | `src/pages/*.astro` | `src/site.ts`'s `notices`; `src/data/photos.ts` |

The notices live in one place, `site.notices` in `src/site.ts`: the
attorney-advertising line (footer, every page), the no-relationship notice
(footer, closing band, form, thank-you page) and the fiction notice (delete
it, and every "fictional" label, once the content is real).

**Look:** a well-set legal brief. Ivory paper (`--color-bg`), deep navy ink
and bands, brass only for rules, numerals and the monogram (`--color-brass`,
and `--color-brass-ink` where brass must be read on paper). EB Garamond for
reading, its small capitals for every label, italic brass for the second
line of a heading; IBM Plex Sans for anything operated: navigation, forms,
notes, figures in tables. Hairline rules, a heavy-over-hairline letterhead
rule, numbered sections (§ I, Article 1, II.3), a pleading-paper line-number
margin on wide screens, and photographs set as plates with an offset brass
frame and a caption. Attorneys are shown as monogram roundels, never as
stock portraits. Tokens are at the top of `src/styles/global.css`.

**Motion** (`src/styles/motion.css`), precise and quiet: pages cross-fade
with native view transitions, the letterhead holds still, a practice title
glides from the table of contents into its page's heading and an attorney's
roundel into theirs; headings unmask upward line by line (`Unmask.astro`);
hairlines draw across as sections enter; figures count up through a
registered integer (`@property --n`, the target read with typed `attr()`
where supported, the real number always in the markup); practice rows and
questions open with a measured slide (`interpolate-size`); a brass shimmer
crosses the letterhead monogram every few seconds, and the seal behind the
closing band turns once every three minutes. Nothing bounces. All of it is
off under `prefers-reduced-motion`.

## 1. Interview

Ask, and write nothing until you have the answers (placeholders are fine
where the user does not know yet; never invent a real-looking fact):

- The firm's name exactly as registered and as it may advertise, its
  entity (PLLC, LLP, PC), phone, email, street address, hours.
- The state or states whose advertising rules apply, and who at the firm
  approves the site. Ask whether the rules require "Attorney advertising"
  on the site, a named responsible attorney, or particular wording.
- The practice areas, in the order the firm wants them, and what it
  declines (the "Outside our practice" section of `/practice/`).
- Each attorney: name, title, year joined, practice areas, bar admissions
  (court and year, checked against the bar's public directory), education,
  a biography they have approved, a sentence in their own words, community
  work, email. Whether they want portraits (then add them as photos) or
  the monogram roundels.
- Fees: which work is flat fee, hourly or retainer, and whether the firm
  will publish example figures at all. Many firms will not.
- Client remarks: only with written permission, only if the state allows
  testimonials, with whatever disclaimer it requires.
- What the consultation form must ask for the firm's conflict check, and
  how the firm wants to be contacted.
- The firm's own photographs (office, town, building), colours and logo.

## 2. The firm

- `src/site.ts`: name, tagline, description, contact, hours, address, county,
  towns (`areas`), navigation, footer, `notices`, blog author. The rename
  (`tools/setup.sh`) set the name; check every other field.
- `business.type` stays `LegalService` unless the firm says otherwise.
- `example.json` is gone once installed; AGENTS.md §1 gets the two-sentence
  description of the firm instead.

## 3. Practice areas and attorneys

- `src/data/practice.ts`: one entry per practice area, with its page in
  `src/pages/practice/<slug>.astro` (copy one; rewrite the two paragraphs).
  Remove an entry and its page together. A new slug needs its own
  `view-transition-name` line in `motion.css` (`.vt-practice-<slug>`).
- `src/data/attorneys.ts` and `src/pages/attorneys/<slug>.astro`: the same,
  and `.vt-attorney-<slug>` in `motion.css`. Replace the `admissions` with
  the real ones and remove the "Fictional" labels in
  `layouts/AttorneyPage.astro` only once every entry is real.
- The consultation form's practice list follows `practice.ts`.

## 4. The consultation form

The form posts to `POST /api/site/forms/consultation` (docs/forms.md) with:
`practice_area`, `matter_summary`, `conflict_names`, `heard_about`, `name`,
`organization`, `email`, `phone`, `contact_method`,
`acknowledge_no_relationship`, plus the `redirect` field and the honeypot.
Build its handler in the waffle app (docs/waffle-api.md): it should run the
conflict check against the firm's records before an attorney reads the
summary, and store nothing from a submission with the honeypot filled.
Adjust the fields in the form and the handler together. The site reads no
data from the app at build time; if the firm later wants, say, published
fees from the app, add a GET endpoint with a fixture and a strict parser.

## 5. The look

- Swap the palette tokens in `src/styles/global.css` for the firm's colours;
  keep the contrast (text 4.5:1, large text and controls 3:1). Brass on
  paper is for rules only; use `--color-brass-ink` for brass text.
- Replace the logo: the monogram in `src/icons/monogram.svg` (also the
  shimmer's mask, and the seal), the wordmark in `src/components/Logo.astro`,
  `public/favicon.svg`, and re-render `public/logo.png` and
  `public/og-default.png` from `brand/logo.html` and `brand/og.html`.
- Replace the photographs in `src/assets/photos/` and their entries in
  `src/data/photos.ts` with the firm's own. Remove the Unsplash credits that
  no longer apply; delete `/credits/` if none remain (and its entry in
  `site.noindex`).

## 6. Pages and posts

Rewrite each page for the real firm, one at a time, showing the user each
(docs/pages.md), and have an attorney approve it. Then the Insights: keep
only explainers an attorney has reviewed for the firm's state, rewrite them
in the firm's voice, and write new ones from clients' real questions
(docs/blog.md). Every post needs a real author. The not-legal-advice note on
every post comes from `layouts/BlogPost.astro`; keep it.

## 7. Checks

`tests/e2e/site.checks.js` (this example's `checks.js`) names the example's
practice areas and attorneys, the form's fields, the notices, the 10
published Insights and the fictional labels. Update it as the pages change:
it is the site's own test now. Then:

```bash
./tools/npm.sh run build     # 0 errors, 0 warnings
./tools/test.sh --coverage   # the gate
```

Look at every changed page at 390 px and 1440 px before calling it done.
