#!/usr/bin/env bash
#
# deploy/render-crontab.sh TEMPLATE SITE_URL [HEARTBEAT_URL]
#
# Prints deploy/crontab with its placeholders filled in. Called by deploy.sh;
# separate so it can be run by the test suite.
#
#   __SITE_URL__   https://<the hostname>
#   __HEARTBEAT__  after the site answers, a ping to an outside dead-man's
#                  switch (e.g. healthchecks.io), so the site being down is
#                  noticed by something that is not the site. Empty when no
#                  URL is set.
#
# Both URLs are refused unless they are plain https addresses: they land in a
# crontab, where a quote is shell and a % is a newline.
set -euo pipefail

TEMPLATE="$1"
SITE_URL="$2"
HEARTBEAT_URL="${3:-}"

if [ ! -f "$TEMPLATE" ]; then
    echo "error: no crontab template at $TEMPLATE" >&2
    exit 1
fi

RENDERED="$(cat "$TEMPLATE")"

if [[ "$RENDERED" != *__SITE_URL__* ]]; then
    echo "error: $TEMPLATE contains no __SITE_URL__ placeholder." >&2
    exit 1
fi

PLAIN='^https://[A-Za-z0-9./_:-]+$'

if [[ ! "$SITE_URL" =~ $PLAIN ]]; then
    echo "error: the site URL is not a plain https URL; refusing to put it in the crontab." >&2
    exit 1
fi

PING=""

if [ -n "$HEARTBEAT_URL" ]; then
    if [[ ! "$HEARTBEAT_URL" =~ $PLAIN ]]; then
        echo "error: HEARTBEAT_URL is not a plain https URL; refusing to put it in the crontab." >&2
        exit 1
    fi

    PING=" && curl -fsS -m 10 -o /dev/null $HEARTBEAT_URL"
fi

# bash 5.2 reads `&` in a replacement as "the text matched", so the ping's `&&`
# would come out as the placeholder twice. Off where the option exists; older
# bash never had it.
shopt -u patsub_replacement 2>/dev/null || true

RENDERED="${RENDERED//__SITE_URL__/$SITE_URL}"
RENDERED="${RENDERED//__HEARTBEAT__/$PING}"

printf '%s\n' "$RENDERED"
