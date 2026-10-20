#!/usr/bin/env bash
#
# deploy/assemble.sh — make a scoped release from the one being served, and
# deploy it (docs/scoped-builds.md).
#
#   bash deploy/assemble.sh v7 123
#
# Runs on the server, after .github/workflows/rebuild.yml has rsync'd what
# the scoped build changed to releases/v7.d123.incoming/. The served release
# is copied with hard links (cheap, and the copy shares nothing it changes:
# each changed file replaces its link rather than writing into it), the changed files are
# laid over the copy, the pages that no longer exist are removed, and
# deploy.sh switches to the result as to any release. The served release is
# never touched (failure 15), so rolling back is deploying it again.
#
set -euo pipefail

CODE="${1:-}"
RUN="${2:-}"

if [[ ! "$CODE" =~ ^v[1-9][0-9]*$ ]] || [[ ! "$RUN" =~ ^[1-9][0-9]*$ ]]; then
    echo "error: usage: assemble.sh <release tag, like v7> <run number>" >&2
    exit 2
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

NEW="${CODE}.d${RUN}"
INCOMING="releases/${NEW}.incoming"

if [ ! -d "$INCOMING" ] || [ ! -f "$INCOMING/pages-manifest.json" ]; then
    echo "error: nothing to assemble: ${INCOMING}/ is missing or incomplete." >&2
    exit 1
fi

if [ ! -L current ]; then
    echo "error: no release is being served; a scoped release needs one to start from." >&2
    exit 1
fi

BASE="$(readlink current)"

# (15) Only over the code it was built from: the served release's manifest
# must name the same release tag.
SERVED="$(sed -n 's/^ *"release": *"\([^"]*\)".*/\1/p' "$BASE/pages-manifest.json" 2>/dev/null | head -n 1)"

if [ "$SERVED" != "$CODE" ]; then
    echo "error: ${BASE} was built from ${SERVED:-an unknown release}, not ${CODE}; refusing to lay this scoped build over it." >&2
    echo "       the next change notice rebuilds against whatever is served then." >&2
    exit 1
fi

echo "==> assembling ${NEW} from ${BASE}"
rm -rf "releases/${NEW}"
cp -al "$BASE" "releases/${NEW}"
# --remove-destination: each changed file replaces the hard link instead of
# writing through it into the served release.
cp -a --remove-destination "$INCOMING/." "releases/${NEW}/"
rm -f "releases/${NEW}/.scoped-remove"

while IFS= read -r dir; do
    [ -z "$dir" ] && continue

    # Only a page's directory, never a path that climbs out of the release.
    if [[ ! "$dir" =~ ^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$ ]]; then
        echo "error: refusing to remove '${dir}': not a page directory." >&2
        rm -rf "releases/${NEW}"
        exit 1
    fi

    rm -rf "releases/${NEW}/${dir}"
    echo "    removed /${dir}/"
done < "$INCOMING/.scoped-remove"

rm -rf "$INCOMING"

exec bash "$APP_DIR/deploy/deploy.sh" "$NEW"
