# Releasing

`./tools/release.sh` is the release. Publishing the GitHub release it creates
is what deploys a site: GitHub Actions builds it and attaches it to the
release, and the server pulls it from there (docs/pull-based-deployments.md).

```bash
./tools/release.sh --dry-run     # what it would do; changes nothing
./tools/release.sh               # the next release
gh run watch                     # the build it started
```

**CI** (`.github/workflows/ci.yml`) runs the same gate on every push to
`main` and every pull request, with no secret, no environment and a
read-only token, so a pull request from anyone can be tested safely. It is
the check, not the release: releasing still runs the gate itself, before
anything is tagged. A project started from this template keeps it; on a
private repository its runs count against the account's Actions minutes.

## Versions

`VERSION` holds the last released version and is the only place one is
written (`tests/infra/release.test.js` fails if `package.json` grows one).

- **A site** is numbered 1, 2, 3, and tagged with the number alone; `0`
  means never released. A release number is the only shape the workflow
  builds and the server deploys; a data rebuild of `N` is `N.dRUN`
  (docs/scoped-builds.md).
- **The template itself** uses semver (`--patch`, `--minor`, `--major`),
  tagged with the version alone (`0.4.2`), and never deploys: the workflow's jobs are skipped in `treehousetim/waffle-site`.

## What the script does

Every check runs before anything changes, the gate runs before anything is
committed, and `main` and the tag are pushed together:

1. Checks: on `main`, clean, level with `origin/main`, the tag is free,
   `[Unreleased]` in `CHANGELOG.md` has notes, `gh` is signed in.
2. Bumps `VERSION` and moves `[Unreleased]` under a dated heading.
3. Runs `./tools/test.sh --coverage`. Red puts both files back and stops.
4. Commits, tags, pushes `main` and the tag atomically, and publishes the
   GitHub release with the changelog section as its notes.

## What the pipeline does

`.github/workflows/deploy.yml` runs on `release: published`. It holds no
secret and cannot reach the server; every action is pinned to a commit.

1. Refuses a tag that is not a release number, and checks out the tag,
   keeping no token.
2. Reads the hostname and the waffle app's URL from `docker-compose.prod.yml`.
3. Installs exactly the lockfile and verifies its registry signatures, in a
   container that sees only the package files.
4. Builds as a production build, in a container working on its own copy of
   the tree: type check, Astro build with the waffle app's live data, SEO
   audit. Any of them failing stops the release here.
5. Takes only the built site, plain files only, adds `build.txt` naming the
   release, and packs it with the tag's own server files (the Compose files,
   the Caddyfile, `deploy/`) as `waffle_site-N.tar.gz`.
6. The `attach` job, the only one that can write, uploads it and its
   `.sha256` to the release.

Within a minute the server finds it and deploys it
(docs/pull-based-deployments.md): `journalctl -fu waffle_site-deploy` or
`waffle_site-pull status` on the server. Nothing is cloned and nothing is
built there.

## What deploy.sh does

Every release stays on disk under `releases/`, and `current` is a link to the
one being served. The poller runs the new release's own `deploy/deploy.sh`,
from inside it. In order:

1. Refuses anything but `N` or `N.dM`, a tag other than the release it is
   in, and a release that is not complete.
2. Checks Doppler can be read and holds `WAFFLE_SITE_KEY`.
3. Checks DNS points here (a refusal on the first deploy, a warning after).
4. Has Caddy validate this release's Caddyfile, with this release's
   redirects.
5. Switches `current` to `releases/<tag>` with one rename, starts Caddy if
   needed and reloads it. Caddy reads the site and its Caddyfile through
   `current`, so nothing restarts.
6. Fetches `build.txt` over HTTPS with the real hostname: it must name this
   release. If it does not within the wait, `current` goes back to the
   previous release, its containers are recreated from its own Compose files,
   and the deploy fails.
7. Installs its block of the crontab, leaving the app's lines alone, and
   records the release before it.

## Rolling back

Deploy the older tag again, on the server:

```bash
sudo -u deploy waffle_site-pull deploy 6
```

Instant while it is still in `releases/`, downloaded again from its GitHub
release if not. The server holds there until something newer is published,
or `waffle_site-pull retry`. There is no database, so nothing else needs
rolling back.

**Never edit files on the server.** The poller refuses a release that has
changed since it was unpacked.

## Failure lists

### tools/release.sh

Each has a test in `tests/infra/release-script.test.js`.

1. A release is cut from a branch other than `main`.
2. Uncommitted changes are left out of, or slip into, a release.
3. `main` differs from `origin/main`, so what is tagged is not what is shared.
4. A release goes out with nothing in its changelog section.
5. The tag already exists, here or on `origin`.
6. The gate is red and the release goes out anyway, or leaves a half-made
   commit behind.
7. The next version is worked out wrongly, or a site is given a semver bump.
8. `VERSION` holds something that is neither shape.
9. The changelog section is not moved under a dated heading.
10. `main` is pushed without the tag, or the tag without `main`.
11. `gh` is not signed in, discovered after the push.
12. A dry run changes something.

### deploy/deploy.sh

Each has a test in `tests/infra/deploy.test.js`, which runs the real script
from inside a release against stand-in `docker`, `doppler`, `curl` and
`crontab`. The poller's own list is in docs/pull-based-deployments.md.

1. A tag that is not `N` or `N.dM`, a tag other than the release the script
   is in, or an incomplete release, is put into service.
2. The stack starts without Doppler, or without the site key, and every form
   fails.
3. A first deploy starts while DNS points elsewhere, so no certificate can be
   issued (docs/https.md).
4. A Caddyfile Caddy cannot load takes the site down at the reload.
5. Visitors see a half-switched site, mixing two releases.
6. A release that is not actually being served, or not over valid HTTPS, is
   reported as deployed, and stays live.
7. A failed deploy records itself as the release before the next one, or the
   crontab replaces the app's jobs on a shared server.
