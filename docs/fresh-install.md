# Fresh install, from nothing

Every account, credential and command, in order, from an empty Doppler
workplace to the site serving on its own hostname. `waffle_site` below is the
slug `tools/setup.sh` set, `waffle-site.example.com` the site's hostname, and
`app.waffle-site.example.com` the waffle app's.

## Part 0 — Decide before you start

- The site's hostname (often `www.` plus your domain), and where its DNS is
  managed.
- The waffle app this site fronts, and its hostname. The site and the app each
  run their own Caddy with their own certificate, so they need different
  hostnames, and usually different droplets: both want ports 80 and 443.
- The server: a single DigitalOcean droplet (Ubuntu LTS). The site is static
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

## Part B — Doppler

**3. The project and its two configs.** Create project `waffle_site` and delete
the environments Doppler starts it with. Create two, named for who reads them,
each the root config of its own environment and inheriting nothing:

- `prod-serve` — the site's production secrets, read only by the server.
- `prod-deploy` — the four deploy credentials, read only by GitHub Actions. It
  must not inherit from `prod-serve`: the CI runner that reads it must never
  see a production secret.

There is no local config: local development needs no secrets.

**4. Sign the CLI in** on your workstation: `doppler login`.

**5. The site key.** The one production secret: how the waffle app knows a
request came through this site (docs/waffle-api.md). Generate it and pipe it
in, so it never appears on a command line:

```bash
openssl rand -hex 32 | tr -d '\n' | doppler secrets set WAFFLE_SITE_KEY -p waffle_site -c prod-serve >/dev/null
```

The waffle app needs the same value in its own `prod-serve` config. Copy it
across in the Doppler dashboard; never paste it into a chat, a ticket or a
file.

## Part C — The server

**6. Create the droplet** (Ubuntu LTS) with your own SSH key, and point an A
record for `waffle-site.example.com` at it. Firewall: 22 from your addresses;
80, 443 and 443/udp from anywhere. Port 80 stays open for good: Let's Encrypt
validates over it, and Caddy redirects everything else on it to HTTPS.

**7. Install what the deploy needs**, as root:

- Docker Engine and the Compose plugin from Docker's own apt repository
  (https://docs.docker.com/engine/install/ubuntu/). Compose **v2.24 or later**:
  `docker-compose.prod.yml` uses `!override` and `!reset`.
- The Doppler CLI (https://docs.doppler.com/docs/install-cli).
- `curl`, `rsync` and `bind9-dnsutils` (for `dig`) from Ubuntu's own
  repositories. No certbot, no Node, no PHP: Caddy is the whole server.

Then the deploy user and the directory:

```bash
adduser --disabled-password --gecos '' deploy
usermod -aG docker deploy
mkdir -p /opt/waffle_site && chown deploy:deploy /opt/waffle_site
```

Install a **deploy key** for `deploy`: a new ed25519 keypair made on your
workstation (`ssh-keygen -t ed25519 -f ~/.ssh/waffle_site_deploy`), its public
half in `/home/deploy/.ssh/authorized_keys`. Its private half goes to Doppler
in step 10 and nowhere else.

**8. Give the server its Doppler token.** Doppler → `prod-serve` → Access → a
**read-only service token**. Type it interactively, as `deploy`, scoped to the
site's directory:

```bash
sudo -iu deploy
doppler configure set token dp.st.prod-serve.XXXX --scope /opt/waffle_site
cd /opt/waffle_site && doppler secrets --only-names      # must list WAFFLE_SITE_KEY
```

**9. Optional: a heartbeat and a deploy alert.**

- `HEARTBEAT_URL` in **`prod-serve`**: an `https://` URL from a dead-man's
  switch (healthchecks.io or similar). The crontab pings it every five minutes
  after the site answers, so something outside notices when it stops.
- `DEPLOY_ALERT_WEBHOOK` in **`prod-deploy`**: a Slack incoming-webhook URL the
  release workflow posts to when a deploy fails.

HTTPS needs nothing installed: Caddy gets the certificate on the first deploy
and renews it on its own (docs/https.md).

## Part D — GitHub

**10. Fill Doppler `prod-deploy`** — exactly four keys:

```bash
doppler secrets set -p waffle_site -c prod-deploy DROPLET_HOST=waffle-site.example.com DROPLET_USER=deploy
doppler secrets set -p waffle_site -c prod-deploy DROPLET_SSH_KEY < ~/.ssh/waffle_site_deploy
ssh-keyscan -t ed25519 waffle-site.example.com | doppler secrets set -p waffle_site -c prod-deploy DROPLET_SSH_KNOWN_HOSTS
```

> Doppler will say this config is "missing" keys compared with `prod-serve`.
> **Ignore it and never click "Add missing value"**: that would hand the CI
> runner the site key.

**11. The `prod` environment and its token, in one command**, once
`prod-deploy` is filled and `gh` and `doppler` are signed in:

```bash
./tools/setup-github.sh
```

It creates the `prod` environment with only a `v*` tag rule, checks that
`prod-deploy` holds the deploy credentials and nothing more, and pipes a new
read-only token straight from Doppler into the environment's `DOPPLER_TOKEN`
secret, never shown or put on a command line. Safe to re-run; it replaces an
existing token only with `--rotate-token`. Required reviewers stay a manual
choice (Settings → Environments → prod).

**12. Protect `main`** (Settings → Branches): pull requests required.

## Part E — The waffle app

**13.** The site reads `GET /api/site/prices` while it builds and forwards
`/api/site/forms/<name>` from visitors (docs/waffle-api.md has the contract).
The waffle app needs those endpoints and the same `WAFFLE_SITE_KEY` before the
first release, or the production build fails on the price guide.

## Part F — The first release

**14.** Record the first release's notes under `## [Unreleased]` in
`CHANGELOG.md`, commit, then (docs/releasing.md):

```bash
./tools/release.sh      # v1: version, changelog, gate, tag, push, GitHub release
gh run watch            # the build and deploy it started
```

| Symptom | Cause |
| --- | --- |
| `release tag is not vN` | the release was not cut by `./tools/release.sh`; delete it and run the script |
| `could not reach the waffle app` / `answered HTTP …` | the build could not read `/api/site/prices` (Part E) |
| `audit: … errors` | a page breaks an SEO rule; the build log names the page and the rule (docs/seo.md) |
| `is not a complete release here` | the rsync of `dist/` to `releases/vN/` did not finish |
| `Doppler is installed but cannot read secrets` | step 8 skipped, not scoped to `/opt/waffle_site`, or not set as `deploy` |
| `WAFFLE_SITE_KEY is not set in Doppler` | step 5 |
| `has no A record` / `points at …, but this server is …` | DNS (step 6) is missing, wrong, or still spreading |
| `Caddy cannot load docker/caddy/Caddyfile` | a Caddyfile change that does not parse; nothing was changed |
| `is not serving vN with a valid certificate` | ports 80/443 closed, DNS, or Let's Encrypt's rate limit; `logs --tail=80 caddy` says which |
| rsync fails on the host key | server rebuilt; re-capture `DROPLET_SSH_KNOWN_HOSTS` |

## Appendix — every configuration key

| Key | Where | Required | Purpose |
| --- | --- | --- | --- |
| `SITE_ADDRESS` | `docker-compose.prod.yml` | yes | the hostname; set by `tools/setup.sh` |
| `WAFFLE_APP_URL` | `docker-compose.prod.yml` | yes | the waffle app's origin; set by `tools/setup.sh` |
| `WAFFLE_SITE_KEY` | Doppler `prod-serve` | yes | step 5 |
| `HEARTBEAT_URL` | Doppler `prod-serve` | no | step 9 |
| `DROPLET_HOST`, `DROPLET_USER`, `DROPLET_SSH_KEY`, `DROPLET_SSH_KNOWN_HOSTS` | Doppler `prod-deploy` | yes | step 10 |
| `DEPLOY_ALERT_WEBHOOK` | Doppler `prod-deploy` | no | step 9 |
| `DOPPLER_TOKEN` | GitHub `prod` environment | yes | step 11 |
| `SITE_ENV`, `SITE_URL`, `WAFFLE_DATA` | the build's environment | set by the workflow | docs/building.md |

## Appendix — `tools/setup-github.sh` failure list

Each has a test in `tests/infra/setup-github.test.js`, which runs the script
against stand-in `gh` and `doppler` commands.

1. `gh` is missing or not signed in, and the script fails halfway.
2. `doppler` is missing or not signed in.
3. The repository cannot be worked out (no GitHub remote), and the script
   guesses.
4. The `prod-deploy` config does not exist, and a token is issued for nothing.
5. `prod-deploy` holds keys beyond the deploy credentials (somebody clicked
   "Add missing value"), and a token that can read the site key is handed to CI.
6. A deploy credential is missing, and the first release fails at the SSH step
   instead of here.
7. The `prod` environment already allows a branch or another tag pattern to
   deploy, and the script leaves it that way without saying.
8. A re-run adds a second `v*` rule.
9. A re-run silently replaces a working `DOPPLER_TOKEN`.
10. The token appears in the terminal or on a command line.
11. The token can write to Doppler.
