# Design

How the site looks, and the rules that keep it looking that way as pages are
added. The tokens live in `src/styles/global.css`; the components in
`src/components/` use them and nothing else.

## Principles

1. **Photos of real work earn trust.** A trades site with no people, vans or
   jobs in it reads as a template. Every service, town and post has a
   photograph; the example ones are stand-ins (see "Photos").
2. **Both ways in, everywhere.** A free quote and a phone number are on every
   screen: in the header on wide screens, in the bar fixed to the bottom of a
   phone, beside the copy on service and town pages, and at the end of every
   page.
3. **One loud colour, one urgent colour.** Purple is the brand and every
   primary action. Amber means "emergency" and is used for nothing else but
   the stars on reviews.
4. **Heavy headings, calm body.** Headings are 750 weight with tight tracking;
   body text is 17px with generous line height. One typeface, Inter.
5. **Rhythm by alternation.** Sections alternate white and the pale surface,
   and every page ends on the same dark call to action and footer, so the
   eye knows where a page ends.
6. **Mobile first in practice, not just in CSS.** Actions go full width on a
   phone, the menu is one tap, and nothing important sits only in a hover.

## Tokens

| Token | Use |
| --- | --- |
| `--color-brand` `#6d28d9`, `-strong`, `-deep`, `-soft` | primary buttons, links, icons, the call to action band |
| `--color-accent` `#f5a524` | emergency only: the strip, the emergency call button, review stars |
| `--color-ink` `#140f26` | the top strip, the footer, dark hero bands |
| `--color-surface` | alternating section backgrounds, quiet panels |
| `--radius`, `--radius-large` | cards, and photos and big panels |
| `--shadow-small`, `--shadow`, `--shadow-large` | resting cards, hovered cards, floating photos |
| `--section` | the vertical padding of every band |

Buttons: `.button` (primary), `.button-secondary` (outline), `.button-light`
and `.button-outline-light` (on dark), `.button-accent` (the emergency call),
`.button-large` (heroes and calls to action). Group them in `.actions`, which
makes them full width on phones.

## Photos

Every photograph goes through `src/components/Photo.astro`, by name, from the
registry in `src/data/photos.ts`. The build resizes each to several widths,
converts it to WebP, and gives it a width, a height, a `srcset` and its alt
text; only the photo at the top of a page loads eagerly.

To replace a photo, put the new file in `src/assets/photos/` (a JPEG around
1800px wide is plenty), point its entry in `photos.ts` at it, and rewrite its
`alt` and `credit`. To add one, add an entry. Never put a photo in `public/`:
it would skip the resizing.

**The example photos are from Unsplash**, free under the
[Unsplash License](https://unsplash.com/license), and credited on `/credits/`.
They are not covered by this repository's MIT licence, and they are not your
business: replace them with photographs of your own team and jobs before
launch. Stock photos of "an electrician" persuade nobody who has seen the same
photo on a competitor's site.

## The audit this design came from

The example site was reviewed at phone and desktop widths, and these were
fixed:

1. **The desktop navigation was invisible.** It lived inside the phone menu's
   closed `<details>`, whose contents browsers hide whatever the CSS says. Wide
   screens now have their own navigation.
2. **No photographs anywhere**, on a site whose whole job is trust.
3. **The hero was mostly empty space**, with the emergency box floating beside
   it. It now leads with a photo and both actions, and emergencies have their
   own band.
4. **Weak type hierarchy**: light headings in whatever font the device had.
   Now one self-hosted typeface, heavy headings, a clear scale.
5. **Text-only lists** for services, towns and posts. Now photo cards.
6. **Every section centred**, which made long pages monotonous. Headings now
   sit left where the content below them is not symmetric.
7. **Service and town pages had nowhere to act** after the hero. They now keep
   a quote card beside the copy, sticky on wide screens.
8. **Phones had to scroll back to the top to call.** A fixed bar now carries
   "Call now" and the quote button.
9. **Machine dates** ("updated 2026-10-01") where people read. Now "October 1,
   2026".
10. **Generic disclosure triangles and default form controls.** The FAQ, the
    form fields and the contact choices are styled to match.

Checking a change: `./tools/npm.sh run dev`, then look at it at 390px and at
1440px wide. The build's audit checks that the HTML is right; only a person
checks that it looks right.
