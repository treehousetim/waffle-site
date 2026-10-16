# Playbook: yoga studio

For the agent turning this example into a real yoga studio's site (or any
small studio with a weekly timetable and a few teachers: pilates, barre,
meditation, a dance or movement studio). Work through it in order, showing
the user each step. AGENTS.md is the rulebook; this is the route.

## What the example is

**Still Water Yoga**, a fictional independent studio in an old boathouse on
the River Alder, in the invented town of Alderwick, with:

| Page | File | Built from |
|---|---|---|
| Home | `src/pages/index.astro` | `BreathingCircle`, `ClassRows`, the week at a glance (schedule), `TeacherCircles`, kind words, workshops, `PostList`, `Closing` |
| Classes, and one page per class style | `src/pages/classes/index.astro`, `src/pages/classes/[slug].astro` | `src/data/classes.ts`: vinyasa, yin, restorative, prenatal, beginners; each page shows its own classes from the schedule, its teachers and FAQs (Service and FAQPage markup) |
| Weekly schedule | `src/pages/schedule.astro` | `GET /api/site/schedule` through `src/lib/schedule.ts`, `ScheduleWeek` and `Slot` |
| Teachers, and one page per teacher | `src/pages/teachers/` | `src/data/teachers.ts`; each page shows their classes this week (Person markup) |
| Pricing and memberships | `src/pages/pricing.astro` | `src/data/pricing.ts` (FAQPage markup) |
| Workshops and retreats | `src/pages/workshops.astro` | `src/data/workshops.ts`; past dates drop off at the next build |
| New students | `src/pages/new-students.astro` | `IntroForm` posting to `/api/site/forms/intro-offer` |
| About (the studio), FAQ, Contact, Privacy | `src/pages/*.astro` | `Faq` (FAQPage markup); contact has a drawn sketch map, not an embed |
| Thank-you page | `src/pages/contact/thanks.astro` | where the form sends a browser without script |
| Journal | `src/content/blog/*.md` | 11 posts by the teachers, six to a page, tagged, with a feed |
| Credits | `src/pages/credits.astro` | `src/data/photos.ts` |

**Look:** serene and spacious. Sand ground, sage and clay accents, stone for
lines and rings, a deep river green for the footer. Cormorant, light and very
large, for headings, with one clay *italic aside* in most of them (write it
between asterisks in a `PageHead` heading); Nunito Sans for reading. Circles
and ripples everywhere: round and pebble-shaped photographs, concentric
rings behind sections, ring markers in lists, a sun-on-water logo. Layouts
are asymmetric: headings stay to one side while lists pass, items sit at
uneven heights like stones. Tokens are at the top of `src/styles/global.css`;
class style colours (the schedule's dots) at the bottom.

**Motion** (everything slow, nothing bouncy; all of it off under reduced
motion): the home page's breathing circle (`BreathingCircle.astro`: in for
four seconds, out for six, ripples spreading on each inhale, a cue that
changes with the breath); slow cross-fade view transitions between pages,
with a class's or teacher's photo gliding from its card into its page; page
heads surfacing line by line on load while their rings open; ripples
spreading behind sections as they arrive; the schedule's days sliding in;
photographs drifting; a "tide" that deepens the page's colour as you scroll
to its end; a reading thread on posts; the logo's ripples. All in
`src/styles/motion.css`, except the breathing circle and the logo, which
keep their keyframes beside them.

## 1. Interview

Ask, and write nothing until you have the answers (placeholders are fine
where the user does not know yet; never invent a real-looking fact):

- The studio's name, legal name, phone, email, street address, front desk
  hours, and how people get there (parking, transit, bikes, access).
- The class styles they teach, in their own words: how each one feels, who
  it suits, what to bring. Any they do not teach.
- The teachers: names, what they teach, how they came to it, training they
  are happy to list, a line in their own words, and photographs they agree
  to use. Never invent a credential.
- The intro offer, passes, memberships and concessions, and their prices.
- Workshops, courses and retreats, with real dates, places and prices.
- Whether the waffle app holds the timetable, and what it calls each class
  style and teacher.
- Real words from students they may quote, with permission.
- Photographs of their own room, teachers and classes. Their colours and
  logo, if they have them.

## 2. The studio

- `src/site.ts`: name, tagline, description, contact, hours, address,
  `areasServed`, social profiles, navigation, footer, the journal's name
  and default author, and the header's invitation (`cta`). The rename
  (`tools/setup.sh`) set the name; check every other field.
- `business.type` stays `SportsActivityLocation` for a yoga studio
  (`ExerciseGym` or `HealthClub` may fit other studios better).
- `example.json` is gone once installed; AGENTS.md §1 gets the two-sentence
  description of the business instead.

## 3. Class styles and teachers

- `src/data/classes.ts`: one entry per style, and `[slug].astro` makes its
  page. Every word in an entry is shown somewhere; rewrite them all. Add or
  remove a style here, and add or remove its colour at the bottom of
  `global.css`, its line in each filter rule in `ScheduleWeek.astro`, and its
  view-transition line in `motion.css`.
- `src/data/teachers.ts`: the same for teachers (and their view-transition
  lines in `motion.css`). Use their real photographs.
- The slugs are the contract with the waffle app: the schedule names each
  class's style and teacher by them, and an unknown slug fails the build
  with the field named (`resolveSchedule`).

## 4. The schedule and the intro offer

- The schedule reads `GET /api/site/schedule` at build time. The app must
  answer in the shape of `api-fixtures/api/site/schedule.json`
  (`{"updated": "YYYY-MM-DD", "classes": [{"day", "start", "duration",
  "style", "teacher", "level", "spacesLeft"}]}`), checked field by field in
  `src/lib/schedule.ts`. Spaces are as fresh as the last build: if the
  studio wants live spaces, schedule a rebuild every hour or so, or say on
  the page how to check (it already says "as of the last update").
- If the studio's timetable is not in the app, replace `loadSchedule()` in
  `src/data/schedule.ts` with a list kept in `src/data/`, delete the
  fixture, update the request check in `tests/e2e/site.checks.js`, and keep
  running the hand-kept list through `parseSchedule` so a typo still fails
  the build.
- The intro offer form posts to `POST /api/site/forms/intro-offer`
  (docs/forms.md) with `name`, `email`, `phone`, `experience`
  (none/some/regular/returning) and `start_with` (a style slug or
  `unsure`), plus the honeypot and `redirect`. Change the fields in
  `IntroForm.astro` and the app's handler together. If the studio books
  through its own system, keep the form for new students and link to the
  booking system from the schedule.

## 5. The look

- Swap the palette tokens in `src/styles/global.css` for the studio's
  colours; keep the contrast (text 4.5:1, large text and controls 3:1).
  Decorative colours (`--color-sage`, `--color-clay`, `--color-stone`) are
  never used for small text.
- Replace the logo: `src/components/Logo.astro`, `public/favicon.svg`, and
  render `public/logo.png` (512) and `public/og-default.png` (1200x630) from
  `brand/logo.html` and `brand/og.html`.
- Replace the photographs in `src/assets/photos/` and their entries in
  `src/data/photos.ts` with the studio's own. Stock photographs of strangers
  must never stand in for named teachers on a real site. Remove the
  Unsplash credits that no longer apply; delete `/credits/` if none remain
  (and its entry in `site.noindex`).
- Change the typefaces in `src/fonts.ts` only with a reason; keep them
  self-hosted, with their licences beside them.

## 6. Pages and posts

Rewrite each page for the real studio, one at a time, showing the user each
(docs/pages.md). The FAQ, new students and contact pages hold the most
studio-specific facts (late policy, lockers, access, parking): check every
one. Then the journal: keep the posts the teachers agree are true for their
classes and rewrite them in their voices, delete the rest, and write new
ones from students' real questions (docs/blog.md). Every post needs a real
author; a post whose author matches a teacher's name links to their page.

## 7. Checks

`tests/e2e/site.checks.js` (this example's `checks.js`) names the studio's
pages, its 29-class fixture schedule, the five styles and teachers, the
form's fields and its 11 published posts. Update it as the pages change: it
is the site's own test now. Then:

```bash
./tools/npm.sh run build     # 0 errors, 0 warnings
./tools/test.sh --coverage   # the gate
```

Look at every changed page at 390 px and 1440 px before calling it done,
and once with reduced motion switched on.
