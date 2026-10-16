#!/usr/bin/env bash
#
# tools/rename-project.sh — make Waffle Site yours. Run once, by
# tools/setup.sh (which asks the questions), before the first release.
#
#   ./tools/rename-project.sh <slug> "<Display Name>" <hostname> [<app hostname>]
#   ./tools/rename-project.sh acme "Acme" www.acme.com app.acme.com
#
# Replaces the four names the template ships under, everywhere outside
# node_modules/, .git/, dist/ and coverage/:
#
#   app.waffle-site.example.com  the waffle app this site fronts (default:
#                                app.<the domain of the hostname>)
#   waffle-site.example.com      the site's hostname: Caddy's certificate,
#                                canonical URLs, the deploy's DNS check
#   Waffle Site                  the name people read: titles, the footer
#   waffle_site                  the slug: the Doppler project, /opt/<slug>
#                                on the server, the npm package and volumes
#
# Lines containing `treehousetim/waffle` point at the templates themselves
# and are left alone. Then VERSION starts at 0 and CHANGELOG.md starts fresh,
# recording which version of the template this came from.
# docs/create-project.md has the details and the failure list.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ "$#" -lt 3 ] || [ "$#" -gt 4 ]; then
    sed -n '7,8p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    exit 2
fi

SLUG="$1"
NAME="$2"
HOST="$3"

LABEL='[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?'
HOST_RE="^${LABEL}(\.${LABEL})+$"

# Every check happens before any file is touched (failure list 1-4).
if [[ ! "$SLUG" =~ ^[a-z][a-z0-9_]{1,30}$ ]]; then
    echo "error: the slug must be 2-31 lowercase letters, digits and underscores, starting with a letter." >&2
    exit 2
fi

# In a variable, not inline: bash quotes an escaped space inside [[ =~ ]] by
# adding a backslash to the bracket expression, which would then allow one.
NAME_RE='^[A-Za-z0-9][A-Za-z0-9 ._-]{0,59}$'
if [[ ! "$NAME" =~ $NAME_RE ]]; then
    echo "error: the display name must be 1-60 letters, digits, spaces, dots, dashes and underscores, starting with a letter or digit." >&2
    exit 2
fi

if [[ ! "$HOST" =~ $HOST_RE ]]; then
    echo "error: the hostname must be a lowercase DNS name with at least one dot, e.g. www.acme.com." >&2
    exit 2
fi

# The app's default: app. on the site's domain (www.acme.com -> app.acme.com).
DOMAIN="${HOST#www.}"
APP="${4:-app.${DOMAIN}}"

if [[ ! "$APP" =~ $HOST_RE ]]; then
    echo "error: the app hostname must be a lowercase DNS name with at least one dot, e.g. app.acme.com." >&2
    exit 2
fi

if [ "$APP" = "$HOST" ]; then
    echo "error: the site and the waffle app need different hostnames: each runs its own Caddy and certificate." >&2
    exit 2
fi

KEEP='treehousetim/waffle'
# Files that describe the rename, and must keep the placeholders to do so.
EXCLUDED='^(\./)?(tools/rename-project\.sh|tools/setup\.sh|tools/use-example\.sh|docs/create-project\.md|LICENSE|tests/infra/setup\.test\.js)$'

FILES=""
for file in $(grep -rIl --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
                   --exclude-dir=coverage --exclude-dir=.astro \
                   -e 'waffle_site' -e 'Waffle Site' -e 'waffle-site\.example\.com' . || true); do
    if [[ "$file" =~ $EXCLUDED ]]; then
        continue
    fi
    # Not grep -q: it exits at the first match, the first grep then dies of
    # SIGPIPE, and under pipefail the file would be skipped.
    if grep -v -e "$KEEP" "$file" | grep -e 'waffle_site' -e 'Waffle Site' -e 'waffle-site\.example\.com' >/dev/null; then
        FILES="$FILES $file"
    fi
done

if [ -z "$FILES" ]; then
    echo "nothing to rename: no placeholder is left."
    exit 0
fi

for file in $FILES; do
    # The app's hostname first, since the site's is inside it. The checks
    # above mean none of the four can hold a character sed reads as special.
    sed -i.rename-bak \
        -e "/${KEEP//\//\\/}/!{" \
        -e "s|app\.waffle-site\.example\.com|${APP}|g" \
        -e "s|waffle-site\.example\.com|${HOST}|g" \
        -e "s|Waffle Site|${NAME}|g" \
        -e "s|waffle_site|${SLUG}|g" \
        -e "}" \
        "$file"
    rm -f "$file.rename-bak"
    echo "  renamed in ${file#./}"
done

# A new project starts its own release stream (docs/releasing.md): VERSION 0,
# never released, and a fresh changelog whose first line records the template
# version it started from. The line names treehousetim/waffle-site, so no
# later run renames it.
STARTED_FROM="$(tr -d ' \t\r\n' < VERSION 2>/dev/null || true)"
if [[ "$STARTED_FROM" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] && [ "$STARTED_FROM" != "0.0.0" ]; then
    ORIGIN_LINE="Started from [treehousetim/waffle-site v${STARTED_FROM}](https://github.com/treehousetim/waffle-site/releases/tag/v${STARTED_FROM})."
else
    ORIGIN_LINE="Started from [treehousetim/waffle-site](https://github.com/treehousetim/waffle-site)."
fi
printf '0\n' > VERSION
cat > CHANGELOG.md <<CHANGELOG
# Changelog

All notable changes to this site are recorded here, in the format of
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Releases are numbered
1, 2, 3: \`./tools/release.sh\` cuts the next one (docs/releasing.md).

${ORIGIN_LINE}

## [Unreleased]
CHANGELOG
echo "  started VERSION at 0 and a fresh CHANGELOG.md"

echo
echo "Done: slug ${SLUG}, name \"${NAME}\", site ${HOST}, waffle app ${APP}."
echo "  - replace the example's logo, link-preview image and photos (docs/playbook.md)"
echo "  - create the Doppler project '${SLUG}' with configs prod-serve and prod-deploy (docs/fresh-install.md)"
echo "  - fill in section 1 of AGENTS.md with what the site is for"
