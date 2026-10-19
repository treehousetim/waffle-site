#!/usr/bin/env bash
#
# tools/use-example.sh — make one example the site. Run once, by
# tools/setup.sh (which asks which), in a fresh copy of the template.
#
#   ./tools/use-example.sh --list           # name<TAB>label, one per line
#   ./tools/use-example.sh photographer     # install it, remove the rest
#
# The template holds several complete example sites under examples/<name>/
# (docs/examples.md). Installing one copies its src/ in beside the core
# (src/core/), its public/ and api-fixtures/ to the top level, its
# PLAYBOOK.md to docs/playbook.md for the agent, and its checks.js to
# tests/e2e/site.checks.js, then removes examples/ and the template's own
# setup tests (tests/infra/setup.test.js): from here on the code is the
# site's own. docs/create-project.md has the failure list; the numbers
# below cite it.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

usage() {
    sed -n '7,8p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

if [ "$#" -ne 1 ]; then
    usage >&2
    exit 2
fi

# The examples: directories holding an example.json.
list() {
    for dir in examples/*/; do
        name="$(basename "$dir")"
        [ -f "examples/${name}/example.json" ] || continue
        label="$(sed -n 's/^ *"label": "\([^"]*\)".*/\1/p' "examples/${name}/example.json" | head -n 1)"
        printf '%s\t%s\n' "$name" "${label:-$name}"
    done
}

if [ "$1" = "--list" ]; then
    [ -d examples ] || exit 0
    list
    exit 0
fi

NAME="$1"

# (17) Already a site: there is nothing to choose from, and nothing to undo.
if [ ! -d examples ]; then
    echo "error: there is no examples/ directory: this is already a site, not the template." >&2
    exit 1
fi

# (18) A name that is not an example, or that could be a path.
if [[ ! "$NAME" =~ ^[a-z][a-z0-9-]{0,40}$ ]] || [ ! -f "examples/${NAME}/example.json" ]; then
    echo "error: there is no example '${NAME}'. The examples are:" >&2
    list | cut -f1 | sed 's/^/         /' >&2
    exit 2
fi

SOURCE="examples/${NAME}"

# (19) An example missing a part a site needs is refused before anything moves.
for required in src/site.ts src/fonts.ts src/pages/index.astro src/pages/404.astro PLAYBOOK.md checks.js; do
    if [ ! -e "${SOURCE}/${required}" ]; then
        echo "error: ${SOURCE} has no ${required}; it is not a complete example." >&2
        exit 1
    fi
done

# (20) The core is never overwritten by an example.
if [ -e "${SOURCE}/src/core" ]; then
    echo "error: ${SOURCE}/src/core exists; an example may not replace the core." >&2
    exit 1
fi

cp -R "${SOURCE}/src/." src/
rm -rf public api-fixtures
if [ -d "${SOURCE}/public" ]; then cp -R "${SOURCE}/public" public; else mkdir public; fi
if [ -d "${SOURCE}/api-fixtures" ]; then cp -R "${SOURCE}/api-fixtures" api-fixtures; else mkdir api-fixtures; fi
cp "${SOURCE}/PLAYBOOK.md" docs/playbook.md
cp "${SOURCE}/checks.js" tests/e2e/site.checks.js
rm -rf examples
# The setup scripts' own tests need the template (its examples and
# placeholders) and fail in a site, where both are gone; they stay with the
# template.
rm -f tests/infra/setup.test.js

echo "installed the ${NAME} example: src/, public/, api-fixtures/, docs/playbook.md and tests/e2e/site.checks.js are the site's own now."
