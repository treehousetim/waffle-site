# Pull-based deploys from GitHub Releases

How a release, and a data rebuild, reach the server. Nothing pushes to it:
the server checks GitHub every minute, and when there is something newer it
pulls it, checks it, switches to it atomically, checks the site is serving it
over HTTPS, and switches back if not. CI never has any access to the server.

`<slug>` below is the project's slug (`waffle_site` here), and
`/opt/<slug>` its directory on the server.

## Overview

```
./tools/release.sh ──▶ GitHub Release N
                          │  deploy.yml builds it and attaches <slug>-N.tar.gz + .sha256
a change notice ──▶ rebuild.yml builds what changed and attaches <slug>-N.dRUN.tar.gz + .sha256 to N
                          ▼
server: <slug>-deploy.timer, every minute ──▶ <slug>-pull check   (deploy/pull.sh)
   ├─ a newer release? guards: a release number? newer than live? approved publisher? the bot's files? checksum?
   │    └─ unpack into /opt/<slug>/releases/N
   ├─ or a newer data rebuild of the live release? the same guards, then
   │    └─ built over what is live? the live release's assemble.sh copies it into releases/N.dRUN
   │       and lays the changed pages over the copy
   ├─ then that release's own deploy/deploy.sh:
   │    ├─ complete? Doppler readable? DNS here? its Caddyfile valid?
   │    ├─ /opt/<slug>/current → releases/<tag>; Caddy started if needed, and reloaded
   │    ├─ https://<host>/build.txt names this release, with a valid certificate
   │    └─ if not: current back to the previous release, its containers recreated
   └─ alert on any failure or refusal; keep the newest releases, prune the rest
```

## The pieces

| Piece | What it is |
| --- | --- |
| `.github/workflows/deploy.yml` | On `release: published`: the `build` job (read-only) installs packages in a container that sees only the package files, builds the site in a container on a copy of the tree, and packs the tag's own server files with the built site; the `attach` job, the only one that can write and which runs no package manager, uploads `<slug>-N.tar.gz` and its `.sha256` to the release. No secrets. |
| `.github/workflows/rebuild.yml` | On a change notice: waits until the server serves the latest release and its newest data rebuild, builds what changed (docs/scoped-builds.md), and attaches `<slug>-N.dRUN.tar.gz` and its `.sha256` to that release. The same two jobs, no secrets. |
| `deploy/pull.sh` | The poller, installed by hand as `/usr/local/sbin/<slug>-pull`: `check`, `deploy <tag>`, `status`, `retry`. |
| `deploy/systemd/<slug>-deploy.service` + `.timer` | Run `<slug>-pull check` every minute as the `deploy` user. The service holds the settings: `APP_ROOT`, `SLUG`, `REPO`, `DEPLOY_AUTHORS`, `KEEP`. None is secret. |
| `deploy/deploy.sh` | Inside each release: brings that release into service, as above. The poller runs the new release's copy, so the deploy logic is always the new release's. |
| `deploy/assemble.sh` | Inside each release: makes a data rebuild's release from it, a copy by hard links with the changed pages laid over. |
| `/opt/<slug>/releases/<tag>/` | One directory per release or data rebuild: the Compose files, the Caddyfile, `deploy/`, and the built site in `dist/`. The newest `KEEP` (5) stay, and always the live and previous ones. |
| `/opt/<slug>/current` | The link to the live release. Caddy serves `current/dist` and reads `current/docker/caddy/Caddyfile`, so a switch is a rename and a reload. |
| `/opt/<slug>/shared/deploy/` | The deploy's state: the lock, the files each release was unpacked with, what failed, what is held. Hidden from Caddy. |
| The front Caddy | `/opt/edge`, set up once per server ([Waffle's docs/edge.md](https://github.com/treehousetim/waffle/blob/main/docs/edge.md)): ports 80 and 443 and every certificate. Caddy here serves plain HTTP on the `edge` network and publishes no port. |

The poller, the units, Docker, Doppler and the firewall are **server config**:
installed by hand (docs/fresh-install.md) and never changed by a release.
When a release carries a newer `deploy/pull.sh` than the installed one, its
deploy says so, with the command to install it.

## Secrets

All in Doppler's `prod`, read by the deploy user's service token scoped to
`/opt/<slug>` (which covers every release under it). There is no `.env` file,
and CI holds no secret.

- **`WAFFLE_SITE_KEY`**: the site's one secret (docs/waffle-api.md), in
  Caddy's environment through `doppler run`.
- **`GITHUB_RELEASES_TOKEN`**: a fine-grained GitHub token that can read this
  repository's contents and change nothing. The poller uses it to see the
  latest release and download its files. It reaches `curl` through a file
  only the deploy user can read, removed when the run ends, never through
  `curl`'s arguments.
- **`DEPLOY_ALERT_WEBHOOK`** (optional): a Slack incoming-webhook URL, passed
  to `curl` on its standard input. Every refusal and failure is also in the
  journal (`journalctl -u <slug>-deploy`).

## What is trusted

The server runs what is in the release tarball, as the deploy user, who can
run Docker and so is as good as root. Everything here protects that file:

- **Who built it.** The poller deploys only files the workflow's own bot
  (`github-actions[bot]`) uploaded, so a person with write access cannot slip
  in their own tarball before CI's is attached. The checksum only catches a
  damaged download: it comes from the same place.
- **What built it.** In CI, npm runs only in containers: the install sees the
  three package files and nothing else, and the build works on its own copy
  of the tree and hands back only `dist/`, plain files only. The server's
  files in the release (the Compose files, the Caddyfile, `deploy/`) are the
  tag's own, which nothing npm ran could change. The build keeps its network,
  because a production build reads the waffle app's live data; there is no
  token or secret on the runner for it to take.
- **Which tag.** A tag ruleset lets only the owner create or move a tag,
  and the poller refuses a release older than live or published by someone
  not in `DEPLOY_AUTHORS`.
- **What is on disk.** A release kept on disk is checked against the list of
  files and checksums it was unpacked with before it is deployed again or
  built on, and Caddy mounts the server's directory read-only.

## Commands on the server

| Command | Use |
| --- | --- |
| `<slug>-pull status` | Live, previous, failed and held releases, the lock, what is kept. |
| `<slug>-pull deploy N` | Deploy one tag, older ones included: **the rollback**. It holds the server there until something newer is published, or `retry`. A data rebuild (`N.dRUN`) deploys this way only while it is still on disk. |
| `<slug>-pull retry` | Forget a failed release and a hold, so the next tick deploys the latest again. |
| `journalctl -fu <slug>-deploy` | Watch a deploy. |

There is no database, so rolling back is only ever the files.

## Failure list

Each has a test in `tests/infra/pull.test.js`, which runs `deploy/pull.sh`
against stand-ins for GitHub and Doppler, and `deploy/assemble.sh` for real.
`deploy/deploy.sh`'s own list is in docs/releasing.md.

1. GitHub is unreachable, answers an error, or answers something that is not a
   release: nothing changes and the tick fails; it is reported once it has
   lasted `API_ALERT_MINUTES` (60), never read as "nothing to do".
2. No release has been published yet: nothing to do.
3. The latest release's tag is not a release number: refused, reported once.
4. The latest release, and its newest data rebuild, are what is live: nothing
   to do, quietly.
5. The latest release is older than the one live (an old tag marked latest
   again): refused, reported once. Versions compare as numbers, so `10` is
   newer than `9`, and a data rebuild counts as its release.
6. The release was published by someone not in `DEPLOY_AUTHORS`: refused,
   reported once.
7. The release's files are not attached yet, or still uploading: wait without
   failing; reported once if still missing after `ASSET_WAIT_MINUTES` (15).
8. A tarball does not match its checksum: refused, nothing kept, reported
   once. This holds for a named `deploy N` and for a data rebuild too.
9. The unpacked tree is incomplete: refused before anything changes.
10. A tick starts while a deploy runs: the lock skips it.
11. A release or data rebuild that failed is not retried on every tick: only
    after `retry`, or when a newer one appears.
12. The release's deploy fails: its tag is recorded, it is reported, and the
    previous release is serving (deploy.sh switched back, or never switched).
13. The release token is missing, or Doppler cannot be read: nothing is
    fetched; reported once.
14. A run was interrupted halfway through unpacking: the half-unpacked
    directory is removed before unpacking again. `current` is always a whole
    release, because it moves by a rename.
15. The disk fills with releases: the newest `KEEP` stay, data rebuilds among
    them, and always the live and previous ones.
16. The release token or the alert webhook appears on a command line, or the
    token is left on disk.
17. A release's or data rebuild's files were uploaded by someone other than
    the workflow's bot: refused, reported once, never by their file names.
18. A release on disk has changed since it was unpacked (a file edited, added
    or removed): refused, reported once. Removing its directory downloads it
    again.
19. The poller is run as anyone but the deploy user: refused before it
    touches anything, so its lock and state stay the deploy user's.
20. A data rebuild is deployed only over the live release it was made from:
    the newest one attached to the latest release, newer than what is live;
    one attached to an older release never is. The live release is copied,
    never changed, so rolling back to it works.
21. A data rebuild built over something other than what is live (its
    `.scoped-base`): refused, reported once, not retried. rebuild.yml waits
    for the server before building, so this means the server fell behind; the
    next change notice rebuilds over what is live then.
22. The live release has changed since it was unpacked when a data rebuild is
    to be built over it: refused, reported once.
23. A rollback by name is undone by the next tick: after `deploy N`, the
    server holds there until something newer than what was newest is
    published, or `retry`. A rollback while GitHub cannot be read holds
    whatever the first check after it finds.

A tag that is not a release number is never repeated in an alert, and alerts are escaped
for Slack, so a crafted tag cannot post a link or mention a channel.
