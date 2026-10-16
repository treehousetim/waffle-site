# Prebuilt templates (planned)

**Status: planned, not built.** This records the plan for shipping a set of
complete example sites with waffle-site, so the decisions made so far are not
lost. Nothing here exists in the code yet; today the repository ships one
example, the electrician.

## The idea

waffle-site ships a set of complete example sites, one per kind of business.
`tools/setup.sh` asks "what kind of business?", installs that one into `src/`,
and leaves the rest behind. The template repository builds and tests every one
of them on every change, so none of them can rot.

This is separate from a catalogue of add-ons (team pages, careers, events)
fetched from outside the repository in the way Waffle Iron serves waffle apps.
That may come later; this plan covers only the set that ships in the core.

## The set

Picked so that between them they need most of the components a small-business
site needs.

| # | Template | schema.org type | Pages beyond the basics | From the waffle app |
|---|---|---|---|---|
| 1 | Electrician | `Electrician` | services, towns, emergency | price guide, quote form |
| 2 | Plumber | `Plumber` | services, towns, emergency | price guide, quote form |
| 3 | HVAC | `HVACBusiness` | services, maintenance plans, towns | plans, booking form |
| 4 | Dental clinic | `Dentist` | treatments, team, insurance, new patients | appointment request |
| 5 | Law firm | `LegalService` | practice areas, attorneys, case results | consultation form |
| 6 | Restaurant | `Restaurant` | menu, hours, private events | menu, reservations |
| 7 | Salon / spa | `BeautySalon` | services and prices, stylists | price list, booking |
| 8 | Real estate | `RealEstateAgent` | listings, neighbourhoods, agents | listings |
| 9 | SaaS product | `SoftwareApplication` | features, pricing plans, changelog | plans, signup |
| 10 | Agency / consultancy | `ProfessionalService` | services, case studies, team | enquiry form |
| 11 | Photographer | `ProfessionalService`, with `ImageGallery` and `Photograph` | portfolio by category, a page per shoot, packages, about, areas, FAQ | packages and prices, booked dates, enquiry form |

The trades (1-3) share almost all their structure. Plumber could be dropped in
favour of the photographer to keep the set at ten; undecided.

### What the photographer needs that the others do not

- **Images as the content**: galleries with responsive `srcset`, AVIF and WebP,
  lazy loading below the fold and the first image loaded eagerly.
- **A full-screen gallery viewer**: keyboard and swipe, from a script file (the
  content security policy allows nothing inline), plain links without script.
- **Image SEO**: descriptive alt text and file names, `Photograph` structured
  data with creator and copyright, an image sitemap, and `og:image` from the
  shoot itself.
- **New audit rules, for every template**: a byte budget per page and per image,
  a warning on an image served far larger than it is displayed, and an error on
  generic alt text (`alt="image"`, `IMG_4021`).
- **Availability on the enquiry form**: booked dates from the waffle app
  (`GET /api/site/availability`).
- **Client galleries** (proofing, downloads) belong to the waffle app; the site
  only links to them.
- **Example photographs** must be ones the template is licensed to ship.
  Without them, the template ships clearly labelled generated placeholders for
  the photographer to replace.

## Shape of the repository

```
src/                       # shared: layouts, components, lib, styles, scripts
  components/              # grows: TeamGrid, MenuSection, ListingCard, PlanTable, Gallery, CaseStudy...
  layouts/                 # generalised: OfferingPage (service, treatment, practice area), PlacePage, PersonPage
templates/
  electrician/
    template.json          # label, schema.org type, palette, endpoints, nav and footer
    site.ts                # the example business
    data/                  # offerings, places, people, reviews
    pages/                 # thin .astro files on the shared layouts
    content/blog/          # 6-8 posts each
    fixtures/api/site/     # what its waffle endpoints return
    public/                # logo, link-preview image
    theme.css              # palette tokens only
    tests/site.test.js     # what this template must build: its pages, its structured data
  photographer/ ...
tools/template.sh          # list | apply <name> | preview <name>
```

- `tools/setup.sh` gains one question and runs `tools/template.sh apply <name>`,
  which copies the chosen template into `src/` and `public/` and removes
  `templates/`, so a site carries only its own.
- The gate applies each template to a scratch copy, builds it as production and
  as development, audits it, and runs its own tests. Every template must build
  clean, and none may use a real-looking phone number (only 555-01xx).

## Changes the core needs first

1. Generalise the layouts: `ServicePage` and `AreaPage` become `OfferingPage`
   and `PlacePage`, plus a new `PersonPage`.
2. Type the business details per kind of business (a restaurant's menu and
   reservations, a dentist's accepted insurance, a SaaS with no address).
3. A parser and fixture for each new endpoint (menu, listings, plans, slots,
   availability), each at 100% coverage like `src/lib/prices.js`.
4. Palettes as token files; purple stays the electrician's.
5. `tools/template.sh`, with its tests.

## Order

Build the mechanism with three of the most different templates first:
**electrician** (exists), **photographer** and **dental clinic**. Together they
exercise the generalised layouts, typed business details, galleries and image
rules, people pages and a second kind of form. Then fill in the rest, each
mostly data and copy.

## Costs

- Eleven sites of believable, clearly fictional copy to keep good: 25-35 pages
  and 6-8 posts each.
- Every core change touches every template. The gate catches breakage; keeping
  template pages thin over shared layouts keeps the fixing small.
- About a minute added to the gate for the extra builds.
- The waffle side multiplies: each new endpoint needs a matching waffle module
  before a template runs on live data rather than fixtures.

## Open decisions

- Ten or eleven: keep Plumber, or let the photographer replace it?
- In the template repository itself, does electrician stay installed in `src/`
  (with a test that it matches `templates/electrician/`), or does `src/` hold
  no business and every template is previewed with `template.sh preview`? The
  second keeps one source of truth.
- Pair each template's endpoints with a Waffle Iron module, so one install
  covers both sides?
- Where licensed example photographs come from, for the photographer.
