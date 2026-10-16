# Releasing

`./tools/release.sh` is the release. Publishing the GitHub release it creates
is what deploys a site.

```bash
./tools/release.sh --dry-run     # what it would do; changes nothing
./tools/release.sh               # the next release
gh run watch                     # the build and deploy it started
```

## Versions

`VERSION` holds the last released version and is the only place one is
written (`tests/infra/release.test.js` fails if `package.json` grows one).

- **A site** is numbered 1, 2, 3, tagged `v1`, `v2`, `v3`; `0` means never
  released. `vN` is the only shape the workflow deploys.
- **The template itself** uses semver (`--patch`, `--minor`, `--major`) and
  never deploys: the workflow's job is skipped in `treehousetim/waffle-site`.

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

`.github/workflows/deploy.yml` runs on `release: published`, against the `prod`
GitHub environment, whose `v*` tag rule blocks a release cut from anything
else. Every action is pinned to a commit.

1. Refuses a tag that is not `vN`, and checks out the tag.
2. Reads the hostname and the waffle app's URL from `docker-compose.prod.yml`.
3. Installs exactly the lockfile, verifies its registry signatures, then builds as a production
   build: type check, Astro build with the waffle app's live data, SEO audit.
   Any of them failing stops the release here, before the server is touched.
4. Loads the four deploy credentials from Doppler (only now, after npm has run
   third-party code), rsyncs the tree to `/opt/waffle_site` and `dist/` to
   `/opt/waffle_site/releases/vN/`.
5. Runs `deploy/deploy.sh vN` on the server.

Nothing is cloned and nothing is built on the server.

## What deploy.sh does

Every release stays on disk under `releases/`, and `current` is a link to the
one being served. In order:

1. Refuses anything but `vN`, and a release that is not complete on disk.
2. Checks Doppler can be read and holds `WAFFLE_SITE_KEY`.
3. Checks DNS points here (a refusal on the first deploy, a warning after).
4. Has Caddy validate the Caddyfile.
5. Switches `current` to `releases/vN` with one rename, starts Caddy if needed
   and reloads it.
6. Fetches the home page over HTTPS with the real hostname and compares it, byte
   for byte, with `releases/vN/index.html`. If it does not match within the
   wait, `current` goes back to the previous release and the deploy fails.
7. Installs the crontab, records the tag, and removes old releases beyond the
   newest five, never the one serving or the one before.

## Rolling back

Deploy the older tag again. While it is still in `releases/`, it is instant:

```bash
ssh deploy@waffle-site.example.com "cd /opt/waffle_site && bash deploy/deploy.sh v6"
```

Or re-run the release workflow for that tag, which rebuilds it from scratch.
There is no database, so nothing else needs rolling back.

**Never edit files on the server.** The next deploy's `rsync --delete` would
overwrite them anyway.

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
against stand-in `docker`, `doppler`, `curl` and `crontab`.

1. A tag that is not `vN`, or a release that is missing or incomplete on disk,
   is put into service.
2. The stack starts without Doppler, or without the site key, and every form
   fails.
3. A first deploy starts while DNS points elsewhere, so no certificate can be
   issued (docs/https.md).
4. A Caddyfile Caddy cannot load takes the site down at the reload.
5. Visitors see a half-switched site, mixing two releases.
6. A release that is not actually being served, or not over valid HTTPS, is
   reported as deployed, and stays live.
7. A failed deploy records its tag as deployed, or old releases fill the disk,
   or the release being served is removed.
