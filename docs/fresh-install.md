# Fresh install, from nothing

Every account, credential and command, in order, from an empty Doppler
workplace to the site serving on its own hostname. `waffle_site` below is the
slug `tools/setup.sh` set, `waffle-site.example.com` the site's hostname, and
`app.waffle-site.example.com` the waffle app's.

## Part 0 — Decide before you start

- The site's hostname (often `www.` plus your domain), and where its DNS is
  managed.
- The waffle app this site fronts, and its hostname. The site and the app each
  run their own Caddy, behind the server's front Caddy ([Waffle's docs/edge.md](https://github.com/treehousetim/waffle/blob/main/docs/edge.md)),
  which holds both certificates; so they need different
  hostnames, and can share one droplet.
- The server: a single DigitalOcean droplet (Debian 13). The site is static
  files behind Caddy, so the smallest droplet is plenty. IPv4 is enough; an
  AAAA record is only for a droplet with IPv6 turned on (`deploy/check-dns.sh`
  refuses one pointing anywhere else).

## Part A — Workstation

**1.** Install Docker (Compose v2.24+), the Doppler CLI and `gh`. Node is not
needed: npm runs in a container (docs/supply-chain.md).

**2.** Run the gate once, so you know the tree you are about to ship is green:

```bash
./tools/test.sh --coverage
```

## Part B — Accounts and keys

Keys go into Doppler, through its website or piped in as below, and nowhere
else: never into a file, a chat, a ticket or a command line.

| Account | What to create | Where it goes |
| --- | --- | --- |
| [Doppler](https://www.doppler.com) | Project `waffle_site`, one config, `prod`; a read-only service token for the server | Step 9 |
| [GitHub](https://github.com) | A fine-grained token that can read this repository's contents (step 4) | Doppler `prod`: `GITHUB_RELEASES_TOKEN` |
| The waffle app | The site key, issued on the app's Sites page once the app is running (step 5) | Doppler `prod`: `WAFFLE_SITE_KEY` |
| [healthchecks.io](https://healthchecks.io) | Optional: a check's ping URL | Doppler `prod`: `HEARTBEAT_URL` |
| [Slack](https://slack.com) | Optional: an incoming-webhook URL for failed or refused deploys | Doppler `prod`: `DEPLOY_ALERT_WEBHOOK` |

**3. Doppler.** Create the project `waffle_site` with the one config `prod`,
read only by the server. There is no local config: local development needs no
secrets. Sign the CLI in on your workstation: `doppler login`.

**4. The server's GitHub token.** GitHub → Settings → Developer settings →
Fine-grained tokens → **Generate new token**: resource owner the repository's
owner, **Only select repositories** → this one, **Repository permissions** →
**Contents: Read-only** and nothing else, an expiry you will notice (a year).
It can read the code and download releases, and change nothing. Paste it into
Doppler `prod` as `GITHUB_RELEASES_TOKEN`. When it expires the server reports
it; make a new one and replace the value.

**5. The site key.** How the waffle app knows a request came through this
site (docs/waffle-api.md). The app issues it, so it comes after the app is
running: in the app, as an owner, **Sites** → add this site → **Issue a key**.
The key is shown once, and the app keeps only its hash. Paste it straight
into Doppler `prod` as `WAFFLE_SITE_KEY`, through the website; never into a
chat, a ticket or a file. A new key replaces the old one at once, so issuing
one again means pasting it here and deploying again.

**6. Optional:** `HEARTBEAT_URL` (an `https://` URL from a dead-man's switch;
the crontab pings it every five minutes after the site answers) and
`DEPLOY_ALERT_WEBHOOK` (a Slack incoming webhook the server posts to when a
deploy fails or is refused), both in `prod`.

## Part C — The server

**7. Create the droplet** (Debian 13) with only your own SSH key, and point an
A record for `waffle-site.example.com` at it. Firewall: 22 from your addresses; 80, 443
and 443/udp from anywhere. Port 80 stays open for good: Let's Encrypt
validates over it, and the front Caddy redirects everything else on it to
HTTPS.
Password logins stay off: only keys open it.

**8. Install what the deploy needs**, as root:

- Docker Engine and the Compose plugin from Docker's own apt repository
  (https://docs.docker.com/engine/install/debian/). Compose **v2.24 or later**:
  `docker-compose.prod.yml` uses `!override` and `!reset`.
- The Doppler CLI from Doppler's own apt repository
  (https://docs.doppler.com/docs/install-cli).
- `jq` and `bind9-dnsutils` (for `dig`) from Debian's own repositories.
  `curl` is already there, and `unattended-upgrades`, which installs Debian's
  security updates on its own. No certbot, no Node, no PHP: Caddy is the
  whole server.

Then the deploy user and its directories:

```bash
adduser --disabled-password --gecos '' deploy
usermod -aG docker deploy
mkdir -p /opt/waffle_site/releases /opt/waffle_site/shared/deploy
chown -R deploy:deploy /opt/waffle_site
```

**9. Give the server its Doppler token.** Doppler → `prod` → Access →
**Generate** a read-only service token. As `deploy`, so the token is the
deploy user's and scoped to the site's directory:

```bash
sudo -iu deploy
read -rs -p 'Doppler token: ' T && printf %s "$T" | doppler configure set token --scope /opt/waffle_site; unset T
cd /opt/waffle_site && doppler secrets --only-names      # must list the prod keys
exit
```

`read -s` keeps the token off the screen and out of the shell's history, and
piping it in keeps it out of every command's arguments, which any process on
the server can read.

**10. Install the poller and its timer**, from your workstation's copy of the
repository, as root on the server. They are server config, so a release never
changes them (docs/pull-based-deployments.md):

```bash
# on your workstation
scp deploy/pull.sh deploy/systemd/waffle_site-deploy.service deploy/systemd/waffle_site-deploy.timer root@waffle-site.example.com:

# on the server, as root
install -m 755 ~/pull.sh /usr/local/sbin/waffle_site-pull
install -m 644 ~/waffle_site-deploy.service ~/waffle_site-deploy.timer /etc/systemd/system/
rm ~/pull.sh ~/waffle_site-deploy.service ~/waffle_site-deploy.timer
systemctl daemon-reload
systemctl enable --now waffle_site-deploy.timer
```

Fill in the two settings the template leaves empty in
`deploy/systemd/waffle_site-deploy.service` first, and commit them: `REPO`,
the GitHub repository as `owner/name`, and `DEPLOY_AUTHORS`, the GitHub logins
whose releases deploy. The poller refuses to run while either is empty.

**11. The front Caddy**, which owns ports 80 and 443 for every project on the
server and holds their certificates: set it up once per server, before the
first deploy, as [Waffle's docs/edge.md](https://github.com/treehousetim/waffle/blob/main/docs/edge.md) says; its Caddyfile must name
`waffle-site.example.com`. It gets the certificate as soon as DNS points here, and
renews it on its own (docs/https.md). A deploy refuses to start without it.

## Part D — GitHub

**12. Protect the tags.** Settings → Rules → Rulesets → **New tag ruleset**:
target every tag, restrict creations, updates and deletions, with only you on
the bypass list. Then only you can create or move a release tag.

**13. Protect `main`** (Settings → Branches): pull requests required.

## Part E — The waffle app

**14.** The site reads the app's public `/api/site/*` endpoints while it
builds and forwards `/api/site/forms/<name>` from visitors (docs/waffle-api.md
has the contract). The app needs those endpoints and the same
`WAFFLE_SITE_KEY` before the first release, or the production build fails.
For change notices, the app also needs `SITE_REPOSITORY` and
`SITE_DISPATCH_TOKEN` (docs/scoped-builds.md).

## Part F — The first release

**15.** Record the first release's notes under `## [Unreleased]` in
`CHANGELOG.md`, commit, then (docs/releasing.md):

```bash
./tools/release.sh      # 1: version, changelog, gate, tag, push, GitHub release
gh run watch            # the build, which attaches waffle_site-1.tar.gz to the release
```

Within a minute of the files being attached, the server deploys it. Watch it
there:

```bash
journalctl -fu waffle_site-deploy
sudo -u deploy waffle_site-pull status
```

| Symptom | Cause |
| --- | --- |
| `release tag is not a release number` | the release was not cut by `./tools/release.sh`; delete it and run the script |
| `could not reach the waffle app` / `answered HTTP …` | the build could not read the app's `/api/site/*` (Part E) |
| `audit: … errors` | a page breaks an SEO rule; the build log names the page and the rule (docs/seo.md) |
| `GITHUB_RELEASES_TOKEN is not set in Doppler` | the key is missing from `prod` (step 4), or the token in step 9 is not the deploy user's |
| `GitHub's API has been failing (last answer: HTTP 401)` | the GitHub token expired or was revoked; make a new one (step 4) |
| `waiting for 1's files`, then `still has no tarball` | the build failed; `gh run view` says why |
| `published by …, who is not in DEPLOY_AUTHORS` | add that login to the unit's `DEPLOY_AUTHORS` (step 10) |
| `Doppler is installed but cannot read secrets` | step 9 skipped, not scoped to `/opt/waffle_site`, or not set as `deploy` |
| `WAFFLE_SITE_KEY is not set in Doppler` | step 5 |
| `has no A record` / `points at …, but this server is …` | DNS (step 7) is missing, wrong, or still spreading; fix it, then `waffle_site-pull retry` |
| `Caddy cannot load this release's docker/caddy/Caddyfile` | a Caddyfile change that does not parse; nothing was changed |
| `there is no edge network` | the front Caddy is not set up (step 11) |
| `is not serving 1 with a valid certificate` | ports 80/443 closed, DNS, Let's Encrypt's rate limit, or the front Caddy not naming `waffle-site.example.com`; `cd /opt/edge && docker compose logs --tail=80 caddy` says which |

## Appendix — every configuration key

| Key | Where | Required | Purpose |
| --- | --- | --- | --- |
| `SITE_ADDRESS` | `docker-compose.prod.yml` | yes | the hostname; set by `tools/setup.sh` |
| `WAFFLE_APP_URL` | `docker-compose.prod.yml` | yes | the waffle app's origin; set by `tools/setup.sh` |
| `WAFFLE_SITE_KEY` | Doppler `prod` | yes | step 5 |
| `GITHUB_RELEASES_TOKEN` | Doppler `prod` | yes | step 4; read by the poller, never by Caddy |
| `HEARTBEAT_URL` | Doppler `prod` | no | step 6 |
| `DEPLOY_ALERT_WEBHOOK` | Doppler `prod` | no | step 6 |
| `APP_ROOT`, `SLUG`, `REPO`, `DEPLOY_AUTHORS`, `KEEP` | `deploy/systemd/waffle_site-deploy.service` | yes | the poller's settings, none secret |
| `SITE_ENV`, `SITE_URL`, `WAFFLE_DATA` | the build's environment | set by the workflow | docs/building.md |
