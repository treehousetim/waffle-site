#!/usr/bin/env bash
#
# deploy/deploy.sh — bring this release into service.
#
#   bash /opt/waffle_site/releases/v7/deploy/deploy.sh v7
#
# Runs on the server, from inside the release it deploys. The poller
# (deploy/pull.sh) has, by this point, downloaded the release GitHub Actions
# built, checked it and unpacked it into releases/v7/ (or, for a data
# rebuild like v7.d12, laid it over a copy of the live release), and it runs
# this release's own copy of this script, so the deploy logic is always the
# new release's. Nothing here fetches anything.
#
# Every release stays on disk under releases/, and `current` is a link to the
# one being served. Switching is one rename, so a visitor never sees half of
# one release and half of another. Rolling back is the poller deploying the
# older tag: waffle_site-pull deploy v6.
#
# Never edit files on the server: the poller refuses a release that has
# changed since it was unpacked. docs/releasing.md has the failure list; the
# numbers below cite it.
#
set -euo pipefail

# ---------------------------------------------------------------------------
# 1. Arguments and where things are.
# ---------------------------------------------------------------------------
TAG="${1:-}"

# vN is a release; vN.dM is a data rebuild of it.
if [[ ! "$TAG" =~ ^v[1-9][0-9]*(\.d[1-9][0-9]*)?$ ]]; then
    echo "error: a release tag like v7 (or a data rebuild of one, like v7.d12) is required." >&2
    echo "usage: deploy.sh <tag>" >&2
    exit 2
fi

RELEASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ROOT="$(cd "$RELEASE_DIR/../.." && pwd)"
SLUG="${SLUG:-waffle_site}"
STATE_DIR="$APP_ROOT/shared/deploy"
CURRENT="$APP_ROOT/current"
PULL_BIN="${PULL_BIN:-/usr/local/sbin/${SLUG}-pull}"

if [ "$(basename "$RELEASE_DIR")" != "$TAG" ]; then
    echo "error: this is releases/$(basename "$RELEASE_DIR"), not ${TAG}; run the deploy.sh inside the release you mean." >&2
    exit 1
fi

cd "$RELEASE_DIR"
mkdir -p "$STATE_DIR"

PREV=""
if [ -L "$CURRENT" ]; then PREV="$(basename "$(readlink "$CURRENT")")"; fi

# Every Compose call is wrapped: `up` needs WAFFLE_SITE_KEY to interpolate,
# and the rest would warn about it. Compose runs from this release, and the
# project's name (docker-compose.yml's `name:`) is the same in every one, so
# every release shares the certificate volume.
COMPOSE=(doppler run -- docker compose -f docker-compose.yml -f docker-compose.prod.yml)

# The paths Caddy sees: production mounts APP_ROOT read-only at /srv/site.
IN_CADDY="/srv/site/releases/${TAG}"
CADDYFILE_LIVE="/srv/site/current/docker/caddy/Caddyfile"

echo "==> deploying ${TAG} in ${RELEASE_DIR}"
echo "    previous: ${PREV:-none}"

# ---------------------------------------------------------------------------
# 2. (1) Complete. The poller checks this too; a release run by hand is not.
# ---------------------------------------------------------------------------
echo "==> checking the release is complete"

MISSING=0
for required in \
    dist/index.html \
    dist/404.html \
    dist/robots.txt \
    dist/sitemap-index.xml \
    dist/build.txt \
    docker-compose.yml \
    docker-compose.prod.yml \
    docker/caddy/Caddyfile
do
    if [ ! -e "$RELEASE_DIR/$required" ]; then
        echo "error: missing ${required}" >&2
        MISSING=1
    fi
done

if [ "$MISSING" -ne 0 ]; then
    echo "error: ${TAG} is not a complete release; refusing to deploy it." >&2
    exit 1
fi
echo "    complete"

# The poller is server config, installed by hand; a release can carry a newer
# one. Said, never done: a release never changes the server's config.
if [ -f "$PULL_BIN" ] && ! cmp -s "$PULL_BIN" "$RELEASE_DIR/deploy/pull.sh"; then
    echo "warning: the installed poller differs from this release's deploy/pull.sh. To install it, as root:" >&2
    echo "         install -m 755 ${RELEASE_DIR}/deploy/pull.sh ${PULL_BIN}" >&2
fi

# ---------------------------------------------------------------------------
# 3. (2) Doppler. The one secret, WAFFLE_SITE_KEY, is injected into Caddy's
#    environment by `doppler run`, never written to disk. The server's token
#    is scoped to APP_ROOT, which covers every release under it.
# ---------------------------------------------------------------------------
echo "==> checking Doppler"

if ! command -v doppler >/dev/null 2>&1; then
    echo "error: the Doppler CLI is not installed on this host." >&2
    echo "       see https://docs.doppler.com/docs/install-cli" >&2
    exit 1
fi

if ! doppler secrets --only-names >/dev/null 2>&1; then
    echo "error: Doppler is installed but cannot read secrets from ${RELEASE_DIR}." >&2
    echo "       check: doppler configure get token --scope ${APP_ROOT}" >&2
    exit 1
fi

if [ -z "$(doppler secrets get WAFFLE_SITE_KEY --plain 2>/dev/null || true)" ]; then
    echo "error: WAFFLE_SITE_KEY is not set in Doppler's prod config." >&2
    echo "       the waffle app needs it to accept the site's forms (docs/waffle-api.md)." >&2
    exit 1
fi
echo "    reachable, WAFFLE_SITE_KEY set"

# ---------------------------------------------------------------------------
# 4. (3) DNS, before anything starts (docs/https.md).
#
#    Caddy can only get a certificate for a hostname whose DNS leads here. On
#    the first deploy that is a refusal; afterwards a warning, because the
#    site is already live and an emergency fix should not wait on DNS.
#    SKIP_DNS_CHECK=1 for a hostname behind a proxy such as Cloudflare.
# ---------------------------------------------------------------------------
SITE_HOST="$(sed -n 's/^ *SITE_ADDRESS: *//p' docker-compose.prod.yml | tr -d '"' | head -n 1)"

if [ -z "$SITE_HOST" ]; then
    echo "error: no SITE_ADDRESS in docker-compose.prod.yml; Caddy would not know its hostname." >&2
    exit 1
fi

echo "==> checking DNS for ${SITE_HOST}"
if [ "${SKIP_DNS_CHECK:-}" = "1" ]; then
    echo "    skipped (SKIP_DNS_CHECK=1)"
elif ! bash "$RELEASE_DIR/deploy/check-dns.sh" "$SITE_HOST"; then
    if [ -z "$PREV" ]; then
        echo "error: refusing the first deploy until ${SITE_HOST} points here; Caddy cannot get a certificate otherwise." >&2
        echo "       behind a proxy such as Cloudflare? Re-run with SKIP_DNS_CHECK=1." >&2
        exit 1
    fi
    echo "warning: carrying on, because ${PREV} is already live; fix DNS before the certificate next renews." >&2
fi

# ---------------------------------------------------------------------------
# The server's front Caddy (Waffle's docs/edge.md) owns ports 80 and
# 443 and reaches this Caddy over the `edge` network. Without it, Compose
# cannot start Caddy at all, and nobody could reach the site.
# ---------------------------------------------------------------------------
if ! docker network inspect edge >/dev/null 2>&1; then
    echo "error: there is no edge network, so the server's front Caddy is not set up; set it up first (Waffle's docs/edge.md)." >&2
    exit 1
fi

# ---------------------------------------------------------------------------
# 5. (4) Validate this release's Caddyfile, with this release's redirects,
#    before anything restarts. A throwaway container; no ports published.
# ---------------------------------------------------------------------------
echo "==> validating docker/caddy/Caddyfile"
if ! "${COMPOSE[@]}" run --rm --no-deps -T -e SITE_ROOT="${IN_CADDY}/dist" caddy \
        caddy validate --config "${IN_CADDY}/docker/caddy/Caddyfile" --adapter caddyfile >/dev/null 2>"$STATE_DIR/caddy-validate.log"; then
    cat "$STATE_DIR/caddy-validate.log" >&2
    echo "error: Caddy cannot load this release's docker/caddy/Caddyfile; nothing was changed." >&2
    exit 1
fi
echo "    valid"

# ---------------------------------------------------------------------------
# 6. (5) Switch. `current` is replaced by a rename, which is atomic: every
#    request is answered from one release or the other, never a mixture.
#    The link is relative, so it resolves the same on the host and inside
#    the container. Caddy reads its Caddyfile and the site through it, so a
#    reload picks up both.
# ---------------------------------------------------------------------------
switch_to() {
    ln -sfn "releases/$1" "$APP_ROOT/current.next"
    mv -fT "$APP_ROOT/current.next" "$CURRENT"
}

reload() {
    "${COMPOSE[@]}" exec -T caddy caddy reload --config "$CADDYFILE_LIVE" --adapter caddyfile >/dev/null
}

echo "==> switching current to releases/${TAG}"
switch_to "$TAG"

# Brings Caddy up on a first deploy, or recreates it when this release's
# Compose files change it; otherwise it keeps running and the reload is all.
echo "==> starting Caddy"
"${COMPOSE[@]}" up -d --remove-orphans
reload

# ---------------------------------------------------------------------------
# 7. (6) Prove the site is serving THIS release over HTTPS with a valid
#    certificate: build.txt, written by the release's build, must name it.
#    Checked from this host with the real hostname, which leaves out the
#    cloud firewall and DNS caching.
#
#    If it is not, and a previous release exists, `current` goes back to it
#    and its containers are recreated from its own Compose files, so a bad
#    release never stays live.
# ---------------------------------------------------------------------------
echo "==> verifying https://${SITE_HOST} serves ${TAG}"
HTTPS_WAIT_SECONDS=60
[ -z "$PREV" ] && HTTPS_WAIT_SECONDS=180
waited=0

served() {
    curl -fsS --max-time 10 --resolve "${SITE_HOST}:443:127.0.0.1" "https://${SITE_HOST}/build.txt" 2>/dev/null | head -n 1
}

while [ "$(served || true)" != "$TAG" ]; do
    if [ "$waited" -ge "$HTTPS_WAIT_SECONDS" ]; then
        echo "error: https://${SITE_HOST}/ is not serving ${TAG} with a valid certificate after ${HTTPS_WAIT_SECONDS}s." >&2

        if [ -n "$PREV" ] && [ "$PREV" != "$TAG" ] && [ -d "$APP_ROOT/releases/${PREV}" ]; then
            switch_to "$PREV"
            (cd "$APP_ROOT/releases/${PREV}" && "${COMPOSE[@]}" up -d --remove-orphans && reload) || true
            echo "       current is back on ${PREV}." >&2
        fi

        echo "       The usual causes, in order:" >&2
        echo "         - DNS: bash deploy/check-dns.sh ${SITE_HOST}" >&2
        echo "         - the firewall: ports 80 and 443 must be open to everyone; Let's Encrypt checks from outside" >&2
        echo "         - Let's Encrypt's rate limit, if the certificate store was wiped repeatedly" >&2
        echo "         - the front Caddy not naming ${SITE_HOST} (Waffle's docs/edge.md)" >&2
        echo "       The front Caddy says why: cd /opt/edge && docker compose logs --tail=80 caddy" >&2
        exit 1
    fi
    sleep 5
    waited=$((waited + 5))
done
echo "    serving ${TAG} after ${waited}s"

# ---------------------------------------------------------------------------
# 8. The crontab: the heartbeat, when HEARTBEAT_URL is set in Doppler. A URL
#    it will not use is a warning, never a failed deploy this late. The
#    deploy user's crontab is shared with the app beside this site, so only
#    this site's own block is replaced.
# ---------------------------------------------------------------------------
echo "==> installing crontab"
HEARTBEAT_URL="$(doppler secrets get HEARTBEAT_URL --plain 2>/dev/null || true)"

if ! CRON_RENDERED="$(bash "$RELEASE_DIR/deploy/render-crontab.sh" "$RELEASE_DIR/deploy/crontab" "https://${SITE_HOST}" "$HEARTBEAT_URL")"; then
    echo "warning: installing the crontab without the heartbeat ping" >&2
    CRON_RENDERED="$(bash "$RELEASE_DIR/deploy/render-crontab.sh" "$RELEASE_DIR/deploy/crontab" "https://${SITE_HOST}")"
fi

CRON_OTHERS="$(crontab -l 2>/dev/null | sed "/^# BEGIN ${SLUG}\$/,/^# END ${SLUG}\$/d" || true)"
{
    [ -z "$CRON_OTHERS" ] || printf '%s\n' "$CRON_OTHERS"
    printf '# BEGIN %s\n%s\n# END %s\n' "$SLUG" "$CRON_RENDERED" "$SLUG"
} | crontab -
echo "    $(crontab -l | sed -n "/^# BEGIN ${SLUG}\$/,/^# END ${SLUG}\$/p" | grep -c '^[^#]*curl') cron job(s) installed"

# ---------------------------------------------------------------------------
# 9. (7) Record the release before this one, LAST, so a failed deploy leaves
#    it as it was. The poller keeps the newest releases and removes the rest.
# ---------------------------------------------------------------------------
if [ -n "$PREV" ] && [ "$PREV" != "$TAG" ]; then
    printf '%s\n' "$PREV" > "$STATE_DIR/previous-tag"
fi

echo "==> deployed ${TAG} successfully"
echo "    rollback: ${SLUG}-pull deploy ${PREV:-<an older tag>}   (instant while it is in releases/)"
