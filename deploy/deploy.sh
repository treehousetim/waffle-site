#!/usr/bin/env bash
#
# deploy/deploy.sh — bring a release that is ALREADY ON DISK into service.
#
#   bash deploy/deploy.sh v7
#
# Runs on the server. .github/workflows/deploy.yml has, by this point, built
# the site on the runner and rsync'd it to releases/v7/, and the rest of the
# tree (this script, the Compose files, the Caddyfile) next to it. This script
# never fetches anything and the server needs no access to GitHub.
#
# Every release stays on disk under releases/, and `current` is a link to the
# one being served. Switching is one rename, so a visitor never sees half of
# one release and half of another, and going back is the same command with
# the older tag:
#
#   bash deploy/deploy.sh v6        # instant, if releases/v6 is still here
#
# Idempotent: running it twice with the same tag is a no-op beyond a reload.
# Never edit files on the server. The next deploy's rsync --delete reverts them.
# docs/releasing.md has the failure list; the numbers below cite it.
#
set -euo pipefail

# ---------------------------------------------------------------------------
# 1. Arguments and working directory.
# ---------------------------------------------------------------------------
TAG="${1:-}"

# vN is a release; vN.dM is a scoped data rebuild of it (deploy/assemble.sh).
if [[ ! "$TAG" =~ ^v[1-9][0-9]*(\.d[1-9][0-9]*)?$ ]]; then
    echo "error: a release tag like v7 (or a data rebuild of one, like v7.d12) is required." >&2
    echo "usage: deploy.sh <tag>" >&2
    exit 2
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

# Deploy state. The workflow's rsync excludes it, so --delete never removes it.
STATE_DIR="$APP_DIR/.deploy"
mkdir -p "$STATE_DIR" "$APP_DIR/releases"

PREV="$( [ -f "$STATE_DIR/tag" ] && cat "$STATE_DIR/tag" || echo "" )"
RELEASE="releases/${TAG}"

# How many releases to keep for an instant rollback.
KEEP=5

# Every Compose call is wrapped: `up` needs WAFFLE_SITE_KEY to interpolate,
# and the rest would warn about it.
COMPOSE=(doppler run -- docker compose -f docker-compose.yml -f docker-compose.prod.yml)

echo "==> deploying ${TAG} in ${APP_DIR}"
echo "    previous: ${PREV:-none recorded}"

# ---------------------------------------------------------------------------
# 2. (1) Prove the runner did its half. A half-finished rsync, or a tag that
#    was never shipped, would otherwise be discovered as a 404 on every page.
# ---------------------------------------------------------------------------
echo "==> checking the release is complete"

MISSING=0
for required in \
    "${RELEASE}/index.html" \
    "${RELEASE}/404.html" \
    "${RELEASE}/robots.txt" \
    "${RELEASE}/sitemap-index.xml" \
    "docker-compose.yml" \
    "docker-compose.prod.yml" \
    "docker/caddy/Caddyfile"
do
    if [ ! -e "$APP_DIR/$required" ]; then
        echo "error: missing ${required}" >&2
        MISSING=1
    fi
done

if [ "$MISSING" -ne 0 ]; then
    echo "error: ${TAG} is not a complete release here; refusing to deploy it." >&2
    echo "       the workflow builds the site on the runner and rsyncs it to ${RELEASE}/." >&2
    exit 1
fi
echo "    complete"

# ---------------------------------------------------------------------------
# 3. (2) Doppler. The one secret, WAFFLE_SITE_KEY, is injected into Caddy's
#    environment by `doppler run`, never written to disk here.
#
#    The server holds its own service token, scoped to prod-serve:
#      doppler configure set token <token> --scope /opt/waffle_site
#    Rotating the key: change it in Doppler (and in the waffle app), redeploy.
# ---------------------------------------------------------------------------
echo "==> checking Doppler"

if ! command -v doppler >/dev/null 2>&1; then
    echo "error: the Doppler CLI is not installed on this host." >&2
    echo "       see https://docs.doppler.com/docs/install-cli" >&2
    exit 1
fi

if ! doppler secrets --only-names >/dev/null 2>&1; then
    echo "error: Doppler is installed but cannot read secrets from ${APP_DIR}." >&2
    echo "       check: doppler configure get token --scope ${APP_DIR}" >&2
    exit 1
fi

if [ -z "$(doppler secrets get WAFFLE_SITE_KEY --plain 2>/dev/null || true)" ]; then
    echo "error: WAFFLE_SITE_KEY is not set in Doppler's prod-serve config." >&2
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
SITE_HOST="$(sed -n 's/^ *SITE_ADDRESS: *//p' "$APP_DIR/docker-compose.prod.yml" | tr -d '"' | head -n 1)"

if [ -z "$SITE_HOST" ]; then
    echo "error: no SITE_ADDRESS in docker-compose.prod.yml; Caddy would not know its hostname." >&2
    exit 1
fi

echo "==> checking DNS for ${SITE_HOST}"
if [ "${SKIP_DNS_CHECK:-}" = "1" ]; then
    echo "    skipped (SKIP_DNS_CHECK=1)"
elif ! bash "$APP_DIR/deploy/check-dns.sh" "$SITE_HOST"; then
    if [ -z "$PREV" ]; then
        echo "error: refusing the first deploy until ${SITE_HOST} points here; Caddy cannot get a certificate otherwise." >&2
        echo "       behind a proxy such as Cloudflare? Re-run with SKIP_DNS_CHECK=1." >&2
        exit 1
    fi
    echo "warning: carrying on, because ${PREV} is already live; fix DNS before the certificate next renews." >&2
fi

# ---------------------------------------------------------------------------
# 5. (4) Validate the Caddyfile before anything restarts. A throwaway
#    container with the same mounts and environment; no ports published.
# ---------------------------------------------------------------------------
echo "==> validating docker/caddy/Caddyfile"
if ! "${COMPOSE[@]}" run --rm --no-deps -T caddy \
        caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>"$STATE_DIR/caddy-validate.log"; then
    cat "$STATE_DIR/caddy-validate.log" >&2
    echo "error: Caddy cannot load docker/caddy/Caddyfile; nothing was changed." >&2
    exit 1
fi
echo "    valid"

# ---------------------------------------------------------------------------
# 6. (5) Switch. `current` is replaced by a rename, which is atomic: every
#    request is answered from one release or the other, never a mixture.
#    The link is relative, so it resolves the same on the host and inside
#    the container (/srv/site/current).
# ---------------------------------------------------------------------------
switch_to() {
    ln -sfn "$1" "$APP_DIR/current.next"
    mv -fT "$APP_DIR/current.next" "$APP_DIR/current"
}

echo "==> switching current to ${RELEASE}"
switch_to "$RELEASE"

# ---------------------------------------------------------------------------
# 7. Bring Caddy up (a first deploy, or a changed Compose file recreates it)
#    and reload it, which picks up a changed Caddyfile without dropping a
#    connection.
# ---------------------------------------------------------------------------
echo "==> starting Caddy"
"${COMPOSE[@]}" up -d --remove-orphans
"${COMPOSE[@]}" exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null

# ---------------------------------------------------------------------------
# 8. (6) Prove the site is serving THIS release over HTTPS with a valid
#    certificate: the home page that comes back must be byte for byte the
#    one in ${RELEASE}. Checked from this host with the real hostname, which
#    leaves out the cloud firewall and DNS caching.
#
#    If it is not, and a previous release exists, `current` goes back to it,
#    so a bad release never stays live.
# ---------------------------------------------------------------------------
echo "==> verifying https://${SITE_HOST} serves ${TAG}"
HTTPS_WAIT_SECONDS=60
[ -z "$PREV" ] && HTTPS_WAIT_SECONDS=180
EXPECTED="$(sha256sum "$APP_DIR/${RELEASE}/index.html" | cut -d' ' -f1)"
waited=0

served() {
    curl -fsS --max-time 10 --resolve "${SITE_HOST}:443:127.0.0.1" "https://${SITE_HOST}/" 2>/dev/null | sha256sum | cut -d' ' -f1
}

while [ "$(served || true)" != "$EXPECTED" ]; do
    if [ "$waited" -ge "$HTTPS_WAIT_SECONDS" ]; then
        echo "error: https://${SITE_HOST}/ is not serving ${TAG} with a valid certificate after ${HTTPS_WAIT_SECONDS}s." >&2

        if [ -n "$PREV" ] && [ -d "$APP_DIR/releases/${PREV}" ]; then
            switch_to "releases/${PREV}"
            echo "       current is back on ${PREV}." >&2
        fi

        echo "       The usual causes, in order:" >&2
        echo "         - DNS: bash deploy/check-dns.sh ${SITE_HOST}" >&2
        echo "         - the firewall: ports 80 and 443 must be open to everyone; Let's Encrypt checks from outside" >&2
        echo "         - Let's Encrypt's rate limit, if the certificate store was wiped repeatedly" >&2
        echo "       Caddy says why: ${COMPOSE[*]} logs --tail=80 caddy" >&2
        exit 1
    fi
    sleep 5
    waited=$((waited + 5))
done
echo "    serving ${TAG} after ${waited}s"

# ---------------------------------------------------------------------------
# 9. The crontab: the heartbeat, when HEARTBEAT_URL is set in Doppler. A URL
#    it will not use is a warning, never a failed deploy this late.
# ---------------------------------------------------------------------------
echo "==> installing crontab"
HEARTBEAT_URL="$(doppler secrets get HEARTBEAT_URL --plain 2>/dev/null || true)"

if ! CRON_RENDERED="$(bash "$APP_DIR/deploy/render-crontab.sh" "$APP_DIR/deploy/crontab" "https://${SITE_HOST}" "$HEARTBEAT_URL")"; then
    echo "warning: installing the crontab without the heartbeat ping" >&2
    CRON_RENDERED="$(bash "$APP_DIR/deploy/render-crontab.sh" "$APP_DIR/deploy/crontab" "https://${SITE_HOST}")"
fi

printf '%s\n' "$CRON_RENDERED" | crontab -
echo "    $(crontab -l | grep -c '^[^#]*curl') cron job(s) installed"

# ---------------------------------------------------------------------------
# 10. (7) Record what is deployed, LAST, so a failed deploy leaves the
#     previous tag in place. Then keep the newest releases for rollback and
#     remove the rest, never the one serving or the one before it.
# ---------------------------------------------------------------------------
if [ -n "$PREV" ] && [ "$PREV" != "$TAG" ]; then
    printf '%s\n' "$PREV" > "$STATE_DIR/previous-tag"
fi
printf '%s\n' "$TAG" > "$STATE_DIR/tag"

PROTECT=" ${TAG} ${PREV} "
COUNT=0
for dir in $(ls -1t "$APP_DIR/releases"); do
    COUNT=$((COUNT + 1))
    if [ "$COUNT" -gt "$KEEP" ] && [[ "$PROTECT" != *" ${dir} "* ]]; then
        rm -rf "${APP_DIR:?}/releases/${dir}"
        echo "    removed old release ${dir}"
    fi
done

echo "==> deployed ${TAG} successfully"
echo "    rollback: bash deploy/deploy.sh ${PREV:-<an older tag>}   (instant while it is in releases/)"
echo "    or re-run the release workflow for that tag."
