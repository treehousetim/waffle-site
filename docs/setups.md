# Setups: where the site fits

Every project is one of the setups in Waffle's
[docs/setups.md](https://github.com/treehousetim/waffle/blob/main/docs/setups.md);
that document is the overview and defines the terms. This one is the site's
side: what it does, where it is hosted and how it is published in each.

| Setup | The site | Hosted on | Published by | Talks to the app |
|---|---|---|---|---|
| **2. App + Site** | the main domain, pages from the app's data | its own droplet, or one droplet with the app behind an edge | `./tools/release.sh`, then the deploy workflow (docs/releasing.md); data changes by scoped rebuild (docs/data-pages.md, decision 8) | through its own Caddy (`/api/site/*` forwarded with the site key) |
| **2a. Back office + Site** | as setup 2 | as setup 2 | as setup 2 | as setup 2 |
| **3. Site** | a static site, no server of its own | a static host: DigitalOcean App Platform's free static sites out of the box | `./tools/release.sh`, as in every setup; the release workflow builds and hands the files to the host (below) | from the browser, straight to the app's site API (below) |
| **4. One app, several sites** | one of several; its site key says which | as setup 2 | as setup 2 | as setup 2; the app answers this site's key with this site's records |

Setups 1 and 5 have no site.

**Locally, every setup is the same**: the dev server and Caddy in Docker
(docs/building.md), fixtures for waffle data, nothing indexable.

## Setup 3: a static site, published by a GitHub release

**Status: designed, not built.** The site builds as it does today; the
workflow, the app spec and the cross-origin settings below are still to
build.

Setup 3 publishes the way every other setup does: `./tools/release.sh` cuts
`vN` on a clean `main`, with its changelog section, after the whole suite
passes (docs/releasing.md), and publishing the GitHub release starts the
workflow. Only the last step differs: instead of copying files to a droplet,
the workflow hands them to the static host. Commits to `main` publish
nothing.

### The flow

```
./tools/release.sh ──► tag vN, GitHub release published
                          ▼
GitHub Actions (on: release published): check out vN, install from the
lockfile, type check, build with live waffle data, SEO audit
                          │ any error stops here; the live site is untouched
                          ▼
the built files committed to the `publish` branch as "vN", and pushed
                          ▼
DigitalOcean App Platform: a static site serving `publish`,
redeployed on every push to it
```

- **The site is built and checked on GitHub's runner, not by the host.** The
  host only serves files. So the supply-chain rules (docs/supply-chain.md),
  the type check and the audit gate every release, whatever the host.
- **App Platform deploys from a branch, not a tag**, so the workflow keeps a
  `publish` branch holding only built files, one commit per release, each
  named for its tag. Its history is the release history.
- **Rollback is a release, as elsewhere:** re-run the workflow for an older
  tag (it accepts a tag when started by hand) and `publish` moves to that
  build. Nothing is edited on the host.
- **Data changes** (docs/data-pages.md, decision 8) rebuild the current
  release's tag, scoped to the affected pages, and push to `publish` the same
  way, as "vN + data".
- **No hosting secret.** The workflow needs only permission to push to its own
  repository; App Platform watches the branch. The only secret is the site
  key, for build-time reads, in Doppler as in every setup.
- **Any other static host** that serves a directory from a branch, or accepts
  an upload, works the same way: replace the last step.

### The App Platform app spec

`.do/app.yaml`, committed, applied once by the user (`doctl apps create
--spec .do/app.yaml`, or in the control panel):

```yaml
name: acme-site
static_sites:
  - name: site
    github:
      repo: acme/acme-site
      branch: publish
      deploy_on_push: true
    source_dir: /
    error_document: 404.html
domains:
  - domain: www.acme.com
    type: PRIMARY
  - domain: acme.com
    type: ALIAS
```

Check the field names against DigitalOcean's current app spec reference when
building this, and the free tier's current limits (number of static sites,
bandwidth) against the site's traffic.

### What changes without a server of its own

1. **Forms and live areas go straight to the app.** No Caddy forwards
   `/api/site/*`, so islands and forms call the app's origin, taken from the
   build settings (`WAFFLE_APP_URL`).
2. **The content security policy names the app's origin** in `connect-src`
   and `form-action`, and nothing else; `astro.config.mjs` adds it in setup 3
   only.
3. **No site key in the browser.** The app's public site API endpoints accept
   these requests without one and protect themselves: the site's origin
   allow-listed (CORS), the honeypot, rate limits, size limits (Waffle's
   docs/setups.md, setup 3).
4. **Redirects and `410`s from data** (docs/data-pages.md, decision 7) need
   the host's own redirect rules instead of the Caddy snippet; App Platform
   supports routes and redirects in the app spec, generated by the build.
5. **Headers only a server can send** (refusing to be framed, HSTS) are the
   host's. The content security policy itself is in every page, so it holds
   on any host. Record what the host sends.
6. **Trailing slashes and the 404 page**: check that the host serves
   `/prices/` from `prices/index.html`, redirects `/prices` to it, and answers
   unknown paths with `404.html` and a 404 status. The end-to-end test's
   assumptions about Caddy do not cover a host that is not Caddy.

### To build

- the static deploy workflow, on `release: published` like the droplet one and
  chosen at setup instead of it: build the tag, commit the files to
  `publish`, push; started by hand with a tag for rollback
- `.do/app.yaml`, written by setup from the site's names
- a setup setting for the topology (`server` or `static`), read in
  `src/core/lib/settings.js`, that switches the forms' target, the content
  security policy's app origin and the redirect output
- a site with no waffle app at all: today a production build requires
  `WAFFLE_APP_URL` (settings failure list); setup 3 without an app needs a
  data mode that reads nothing and a site with no forms or islands
- tests for each, and a failure list in this document first (AGENTS.md §7)
