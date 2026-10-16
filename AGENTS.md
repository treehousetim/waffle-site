# AGENTS.md — project instructions

- Always write unit tests before writing code.
- E2E tests are important and should be used to verify complex features are working.
- At the end of E2E tests, produce a verifiable and repeatable artifact.
- If you must test a system in isolation, FIRST write all the ways it could fail, THEN write the code.
- Update tests before modifying the way a feature works.
- Group E2E and unit tests in a way that we can limit the number of tests required to be run when modifying or adding to an area of the system.

This is the instruction file for anyone (human or AI agent) working in this repository. It is written to be sufficient on its own: if you have no other context, follow this document.

---

## 1. What this project is, and where it is

> **Replace this paragraph** with what the site is for: the business, who its customers are, the towns or market it serves, and which waffle app it fronts. Two or three sentences. Everything below it is the template and applies as written.

The template ships as a working example: a local electrician, Waffle Site, with service pages, town pages, a price guide read from the waffle app, a quote form the app receives, and a 24-article blog. Rewrite it for the real business; keep the structure.

### First session in a new project

If `package.json`'s `name` is still `waffle_site`, or the paragraph above still says **Replace this paragraph**, the project has not been set up yet. Before anything else:

1. **Name it, with the script — never by hand.** Ask the user for the slug, display name, the site's hostname and the waffle app's hostname. Offer the suggestions from `./tools/setup.sh --suggest "$(basename "$PWD")"` (one per line: slug, name, host, app host); placeholders are fine if they do not have them yet. Then run `./tools/setup.sh --slug <slug> --name "<name>" --host <host> --app <app> --yes`, adding `--no-git` if the user wants to make the first commit themselves. If the script refuses an answer, show its message and ask again; do not work around it.
2. **Fill in this section's first paragraph.** Interview the user: the business, its customers, where it works, what makes it different. Draft two or three sentences, show them, and write them only once the user agrees.
3. **Replace the example business** in `src/site.ts` (name, phone, address, hours, licence, profiles), `src/data/` (services, towns, reviews) and the images in `public/`. Ask for each real value; never invent a phone number, an address, a licence number or a review.
4. **Rewrite the pages and posts** for the real business (docs/pages.md, docs/blog.md), one page at a time, showing the user each before moving on.
5. **Deployment only when asked.** Follow docs/fresh-install.md; `./tools/setup-github.sh` does the GitHub half. Secret values are the user's to type into Doppler: never ask for one in chat, never put one on a command line or in a file, and never create or fill a Doppler config on their behalf.

---

## 2. Stack

Use exactly these majors, latest patch a week old or more at install time (docs/supply-chain.md).

| Layer | Choice | Version |
|---|---|---|
| Site generator | Astro, static output | `astro` 7 |
| Language | TypeScript for `.astro` and `.ts`; JavaScript with JSDoc types in `src/lib/` | `typescript` 6 (`@astrojs/check` does not yet support 7) |
| Type check | `@astrojs/check` | 0.9 |
| Sitemap, feed | `@astrojs/sitemap` 3, `@astrojs/rss` 4 | |
| Images | `sharp`, through Astro's `<Image>` and `src/components/Photo.astro` | 0.35 |
| Typeface | Inter, self-hosted in `public/fonts/` (SIL Open Font License) | 4 (fontsource 5.3); approved 2026-10-15: one consistent face on every device, 48 KB |
| HTML parsing (the audit) | `node-html-parser` | 9, dev only |
| Tests | Node's built-in `node:test` and its coverage, in `node:26` | |
| Node | 26 LTS | run only through `tools/npm.sh` and `tools/test.sh`, in `node:26`; not needed on the host |
| Web server | Caddy | 2.11 (`caddy:2.11`): serves the files, proxies `/api/site/*`, gets its own certificate |
| Secrets | Doppler CLI | the **only** source of secrets |
| Runtime | Docker Compose v2.24+ | |
| Hosting | One DigitalOcean droplet, deployed by GitHub Actions on `release: published` | |

There is no application server in production, no database and no PHP. Anything stateful belongs to the waffle app (§6).

**Standing rule: do not substitute frameworks and do not add frameworks or libraries that are not on this list.** No CSS framework, no UI framework (Astro components are enough; ask before adding Vue or similar islands), no analytics script, no third-party embed (the content security policy blocks them, deliberately). You may ask the user for permission to add to the list; small libraries are encouraged over writing everything from scratch, but permission must be granted. When choosing between candidates, the one with the most installs wins, recency breaks ties, and an abandoned package is never chosen. Record each approval in the table above with its date and reason.

---

## 3. Directory layout

```
package.json, package-lock.json   # the only dependency manifest; .npmrc turns install scripts off
astro.config.mjs                  # reads settings once (src/lib/settings.js); sitemap; nothing inline
VERSION                           # the last released version, and the only place one is written
src/
  site.ts                         # the business (NAP, hours, licence), navigation, footer, noindex list
  settings.ts                     # the build's settings and the waffle client, for pages
  content.config.ts               # the blog's front matter schema
  content/blog/*.md               # blog posts: the only Markdown on the site
  data/                           # services, towns, reviews, photos: lists several pages share
  pages/                          # one .astro file per page; the path is the URL
    services/<slug>.astro         # one per service, on layouts/ServicePage.astro
    areas/<slug>.astro            # one per town, on layouts/AreaPage.astro
    blog/                         # index (paginated), [slug], tags/[tag], rss.xml
    robots.txt.ts
  layouts/                        # Base (every page), BlogPost, ServicePage, AreaPage
  components/                     # the shared parts: Hero, Section, CardGrid, Faq, QuoteForm, Seo...
  lib/                            # pure logic, held to 100% coverage: settings, seo, jsonld, audit, posts, prices, forms, waffle-api
  lib/clients/                    # the network and the disk, and nothing else; outside coverage
  scripts/                        # browser scripts (bundled to files, never inline)
  styles/global.css               # design tokens and base styles
  assets/photos/                  # the photographs, resized and converted by the build (docs/design.md)
public/                           # copied as is: favicon, logo, default link preview
api-fixtures/api/site/*.json      # the waffle app's answers, for development builds and tests
docker/caddy/Caddyfile            # the web server, local and production
docker-compose.yml, docker-compose.prod.yml
deploy/                           # deploy.sh, check-dns.sh, crontab + render-crontab.sh
tools/
  npm.sh                          # the only way npm is run
  test.sh                         # the only way tests are run
  audit.mjs                       # the SEO audit, after every build
  release.sh, setup.sh, rename-project.sh, setup-github.sh, changed-groups.sh
tests/
  unit/                           # src/lib, one file per module
  infra/                          # the scripts, the Caddyfile, the workflow, the repository's rules
  e2e/                            # the site built twice and audited; writes coverage/e2e/site-build.json
  support/                        # shell helpers, the E2E artifact
docs/                             # indexed in README.md's Documentation table
.github/workflows/deploy.yml
AGENTS.md                         # this file; CLAUDE.md contains only "See @AGENTS.md"
README.md, CHANGELOG.md, OPEN-QUESTIONS.md, RESOLVED_QUESTIONS.md
```

---

## 4. Pages and content

- **Every page except a blog post is an `.astro` file in `src/pages/`**, built on `Base` (directly or through a layout). `title` and `description` are required props; `astro check` fails without them. docs/pages.md is the walkthrough.
- **Blog posts are Markdown** in `src/content/blog/`, one template, front matter checked by a strict schema (docs/blog.md).
- **One `<h1>` per page**, rendered by `Hero` or the blog template.
- **Nothing inline.** No `<script>` with code, no `<style>` element in the output, no `style=` or `on*=` attributes. Component `<style>` blocks and `src/scripts/` are written to files by the build. The content security policy blocks anything inline, and the audit fails it.
- **Shared facts live in one place.** The business's name, address, phone, hours and licence are in `src/site.ts`; services, towns and reviews in `src/data/`. Never retype them into a page.
- **Town pages say something true about that town** and no other, or they are not written (docs/pages.md, "Town pages").
- **Never invent facts about a real business**: phone numbers, addresses, licence numbers, prices, reviews or credentials. Ask. The example's 555-01xx numbers are reserved for fiction.
- **No review markup.** Reviews are shown as text; a business marking up its own reviews breaks search engines' rules.
- **Photos go through `Photo.astro`, by name from `src/data/photos.ts`**, never as a raw `<img>` or from `public/`, so every one is resized, converted to WebP, sized and described. The example photos are Unsplash stand-ins under the Unsplash License, not MIT; never add a photo whose licence you have not checked, and record its credit (docs/design.md).
- **Design follows docs/design.md**: the tokens in `src/styles/global.css`, purple for actions, amber for emergencies only. Look at a changed page at 390px and 1440px wide before calling it done.
- **The build is the check.** A page is done when `./tools/npm.sh run build` reports no errors and no warnings. docs/seo.md lists every rule.

---

## 5. Layering rules

- **`src/lib/` is pure.** No `node:fs`, `node:http` or other system modules, no `fetch`, no `process.env`, no `astro:` imports, no `console`. Everything it needs comes in as an argument. That is what makes it testable, and `tests/infra/structure.test.js` enforces it.
- **`src/lib/clients/` is the only code that reaches the network or the disk**, is thin, and is outside coverage. Decisions about what comes back are made in `src/lib/`.
- **The environment is read in three places only:** `astro.config.mjs`, `src/settings.ts` and `tools/audit.mjs`, each passing `process.env` to `src/lib/settings.js`, which is where it is interpreted. The structure test fails on a fourth.
- **Data from outside is parsed before it is rendered.** Every waffle endpoint gets a parser in `src/lib/` that checks every field and refuses anything else (`src/lib/prices.js` is the example). A link from outside is never put in an `href` unparsed.
- **Every module in `src/lib/` has `tests/unit/<name>.test.js`**, enforced.

---

## 6. The waffle app

The site has no server code; the waffle app it fronts is the system of record. docs/waffle-api.md is the contract.

- **Build time:** pages read `/api/site/*` through `waffle.get()` from `src/settings.ts`. Development and tests read `api-fixtures/`; production reads the app. A new endpoint gets a fixture, a parser with tests, and its waffle-side endpoint.
- **Run time:** the browser posts to `/api/site/*` on this site; Caddy forwards it to the app with `X-Site-Key` and without the visitor's cookies. Forms work without script (docs/forms.md).
- **Anything that stores, sends or decides belongs in the waffle app**, not here. Build it there, as a slice or a [Waffle Iron](https://github.com/treehousetim/waffle-iron) module.

---

## 7. Testing rules

**Write tests first, then the code that makes them pass.** Every module, script and rule ships with its tests in the same change. The task is not done until `./tools/test.sh --coverage` is green.

**Failure lists.** Before building anything that talks to something outside this process, or that has to be tested in isolation, write down every way it can fail — numbered, one line each, in the feature's doc (`docs/<feature>.md`) — and then write a test for each before writing the code. Tests and code comments cite the numbers.

**A green run must never be bought by skipping a test, marking it todo, stubbing out the thing under test, or loosening an assertion.** Fix the code, or fix a genuinely wrong expectation.

**Changing how something works starts with its tests.** Change the expectation, watch it fail for the right reason, then change the code.

### Runner and groups

`./tools/test.sh` is the **only** way tests are run. It runs Node's test runner in `node:26` against the same `node_modules` volume as `tools/npm.sh`, installing exactly the lockfile when it changed, then has Caddy validate the Caddyfile.

```bash
./tools/test.sh                    # everything
./tools/test.sh --coverage         # everything, src/lib at 100% lines, branches and functions: the gate
./tools/test.sh --group=unit       # unit, infra or e2e
./tools/test.sh --changed          # the groups your edits touch (tools/changed-groups.sh)
./tools/test.sh tests/unit/seo.test.js
./tools/test.sh --filter=canonical
```

**Iterate with `--changed` or `--group`; gate with `--coverage`.** The groups are directories:

- `unit`: `src/lib/`, one file per module, at 100% coverage. Pure, fast.
- `infra`: every shell script run against stand-in `docker`, `gh`, `doppler`, `dig` and `curl`; the Caddyfile, Compose files and workflow asserted by shape; the repository's own rules (`structure.test.js`).
- `e2e`: `tests/e2e/site-build.test.js` builds the site as production (against a stand-in waffle app over real HTTP) and as development, audits both, checks what search engines and visitors see, and writes `coverage/e2e/site-build.json`: the facts it observed, every check, and a SHA-256 of both, so an unchanged site writes the same digest.

`tests/infra/structure.test.js` fails a test file outside the three directories.

**Coverage is a ratchet at 100%** for `src/lib/` (minus `src/lib/clients/`). Pages and components are covered by the end-to-end test and the audit, not by coverage numbers.

---

## 8. Secrets and the Doppler workflow

Doppler is the **only** source of secrets, and the site has one: `WAFFLE_SITE_KEY`.

- One Doppler project, named for the slug, with two configs inheriting nothing: `prod-serve` (the server: `WAFFLE_SITE_KEY`, optional `HEARTBEAT_URL`) and `prod-deploy` (GitHub Actions: `DROPLET_HOST`, `DROPLET_USER`, `DROPLET_SSH_KEY`, `DROPLET_SSH_KNOWN_HOSTS`, optional `DEPLOY_ALERT_WEBHOOK`). **No secret values ever live in this repository.**
- **Local:** no Doppler and no `.env` file, anywhere. Every value has a default in `docker-compose.yml`, and none is secret.
- **CI** holds exactly one GitHub secret, `DOPPLER_TOKEN`, on the `prod` environment (with a `v*` tag rule), scoped to `prod-deploy`, loaded only after npm has run. The site key never reaches the runner. Never click Doppler's "Add missing value" on `prod-deploy`.
- **Production:** the server's own token reads `prod-serve`; `deploy.sh` wraps every Compose call in `doppler run --`, so the key lives in Caddy's environment and never on disk. Rotation: change it in Doppler and in the waffle app, then redeploy.
- **Tests never use Doppler.**

---

## 9. Release flow

`./tools/release.sh` is the release (docs/releasing.md).

1. Record what changed under `## [Unreleased]` in `CHANGELOG.md` as you go; a release with nothing there is refused.
2. Run `./tools/release.sh` on a clean `main` that matches `origin/main` (`--dry-run` first if you like). It bumps `VERSION`, dates the changelog section, runs `./tools/test.sh --coverage` (red puts it all back), commits, tags `vN`, pushes `main` and the tag together, and publishes the GitHub release.
3. Publishing deploys: the workflow builds the production site on the runner (type check, build with live waffle data, audit), rsyncs it to `releases/vN/` on the server, and `deploy.sh` switches `current` to it and proves it is being served over HTTPS, switching back if not.

**Versions:** a site is numbered 1, 2, 3 (`0` never released); the template itself uses semver and never deploys. **Rollback** is `deploy.sh` with the older tag, instant while it is in `releases/`. **Never edit files on the server.**

---

## 10. Gotchas

- **Astro inlines small scripts and styles unless told not to.** `astro.config.mjs` sets `build.inlineStylesheets: 'never'` and `vite.build.assetsInlineLimit: 0`. Remove either and the content security policy silently breaks the page in production; the audit fails it first.
- **Front matter values containing `: ` must be quoted**, or YAML reads a nested mapping and the build fails with "Nested mappings are not allowed".
- **Data is as fresh as the last build.** When the waffle app's prices change, release (or re-run the workflow for the current tag).
- **`/pricing` and `/pricing/` are one page**: Caddy redirects to the slash, and canonical URLs and internal links always use it.
- **The `caddy_data` volume is the certificate store.** Never `docker compose down -v` on the server.
- **`node_modules` is a Docker volume**, not a folder on disk; editors will not find it. The dev server and the suite share it.
- **The dev server is for writing pages**; `docker compose up -d` serves `dist/` behind the real Caddyfile for checking headers, redirects and the 404 page.
- **TypeScript is pinned to 6** until `@astrojs/check` supports 7.
- **The build's year is the footer's year.** A build on 1 January changes every page's footer, and so every file hash in the E2E artifact (not its digest).

## 11. Open questions

Unresolved decisions are tracked in `OPEN-QUESTIONS.md`. If the brief is silent on something you need, add it there rather than guessing. When one is answered, move it to `RESOLVED_QUESTIONS.md` with a line saying where it was settled.
