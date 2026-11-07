#!/usr/bin/env bash
#
# deploy/assemble.sh — make a data rebuild's release from the release this
# script is in (docs/scoped-builds.md).
#
#   bash /opt/waffle_site/releases/v7/deploy/assemble.sh <incoming> <out>
#
# Run by the poller (deploy/pull.sh) from the live release, once it has
# downloaded a data rebuild, checked it and unpacked it into <incoming>: the
# pages the rebuild changed, .scoped-remove (the page directories that no
# longer exist), .scoped-base (the release it was built over) and build.txt
# (its own name, like v7.d12). This release is copied to <out> with hard
# links (cheap, and the copy shares nothing it changes: each changed file
# replaces its link rather than writing into it), the changes are laid over
# the copy's dist/, and the pages that no longer exist are removed. This
# release is never touched (failure 15), so rolling back is deploying it
# again. The poller then deploys <out> with its own deploy.sh.
#
set -euo pipefail

INCOMING="${1:-}"
OUT="${2:-}"

if [ -z "$INCOMING" ] || [ -z "$OUT" ]; then
    echo "error: usage: assemble.sh <incoming> <out>" >&2
    exit 2
fi

BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HERE="$(basename "$BASE")"

for required in .scoped-base .scoped-remove build.txt pages-manifest.json; do
    if [ ! -f "$INCOMING/$required" ]; then
        echo "error: the data rebuild in ${INCOMING} is incomplete: no ${required}." >&2
        exit 1
    fi
done

NEW="$(head -n 1 "$INCOMING/build.txt")"
if [[ ! "$NEW" =~ ^(v[1-9][0-9]*)\.d[1-9][0-9]*$ ]]; then
    echo "error: the data rebuild's build.txt names '${NEW}', not a data rebuild like v7.d12." >&2
    exit 1
fi
CODE="${BASH_REMATCH[1]}"

# (21) Over the release it was built over, and nothing else.
BUILT_OVER="$(head -n 1 "$INCOMING/.scoped-base")"
if [ "$BUILT_OVER" != "$HERE" ]; then
    echo "error: ${NEW} was built over ${BUILT_OVER}, not ${HERE}; refusing to lay it over this release." >&2
    exit 1
fi

# (15) Only over the code it was built from: this release's manifest must
# name the same release tag.
SERVED="$(grep -o '"release": *"[^"]*"' "$BASE/dist/pages-manifest.json" 2>/dev/null | head -n 1 | sed 's/.*"\([^"]*\)"$/\1/' || true)"
if [ "$SERVED" != "$CODE" ]; then
    echo "error: ${HERE} was built from ${SERVED:-an unknown release}, not ${CODE}; refusing to lay ${NEW} over it." >&2
    exit 1
fi

echo "==> assembling ${NEW} from ${HERE}"
rm -rf "$OUT"
cp -al "$BASE" "$OUT"
# --remove-destination: each changed file replaces the hard link instead of
# writing through it into this release.
cp -a --remove-destination "$INCOMING/." "$OUT/dist/"
rm -f "$OUT/dist/.scoped-remove" "$OUT/dist/.scoped-base"

while IFS= read -r dir; do
    [ -z "$dir" ] && continue

    # Only a page's directory, never a path that climbs out of the release.
    if [[ ! "$dir" =~ ^[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$ ]]; then
        echo "error: refusing to remove '${dir}': not a page directory." >&2
        rm -rf "$OUT"
        exit 1
    fi

    rm -rf "${OUT:?}/dist/${dir}"
    echo "    removed /${dir}/"
done < "$INCOMING/.scoped-remove"

echo "    assembled ${NEW}"
