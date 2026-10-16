#!/usr/bin/env bash
#
# tools/changed-groups.sh — prints the test groups a working-tree change affects.
#
# Used by `tools/test.sh --changed`, and usable on its own:
#
#   ./tools/changed-groups.sh          # e.g. "e2e unit"
#
# Mapping is by directory, so a path belongs to a group by construction:
#
#   unit   src/lib/ and its tests
#   e2e    anything that changes what the site builds: pages, components,
#          layouts, content, styles, settings, astro.config.mjs, the audit
#   infra  the scripts, the server config, the workflow, the documents the
#          infra tests read
#
# A change to src/lib also selects e2e: pages are built from it.
#
set -euo pipefail

cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

groups=""

changed="$(git diff --name-only HEAD 2>/dev/null || true
           git ls-files --others --exclude-standard 2>/dev/null || true)"

for file in $changed; do
    case "$file" in
        src/lib/*|tests/unit/*)                  groups="$groups unit e2e" ;;
        tests/e2e/*|tests/support/*)            groups="$groups e2e" ;;
        src/*|public/*|api-fixtures/*|astro.config.mjs|tsconfig.json|tools/audit.mjs)
                                                 groups="$groups e2e" ;;
        tests/infra/*|tools/*|deploy/*|docker/*|docker-compose*.yml|.github/*|package.json|package-lock.json|.npmrc|VERSION|CHANGELOG.md|*.md)
                                                 groups="$groups infra" ;;
    esac
done

# Deduplicated, stable order, one line.
printf '%s\n' "$(printf '%s\n' $groups | sort -u | tr '\n' ' ' | sed 's/ $//')"
