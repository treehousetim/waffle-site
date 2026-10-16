#!/usr/bin/env bash
#
# tools/test.sh — the only supported way to run the test suite.
#
#   ./tools/test.sh                          # everything
#   ./tools/test.sh --coverage               # everything, src/lib held to 100% — the gate
#   ./tools/test.sh --group=unit             # one group: unit, infra or e2e
#   ./tools/test.sh --changed                # only the groups your edits touch
#   ./tools/test.sh tests/unit/seo.test.js   # one file
#   ./tools/test.sh --filter=canonical       # tests whose name matches
#
# Runs Node's own test runner in a throwaway node:26 container, the same image
# and the same node_modules volume as tools/npm.sh, installing exactly the
# lockfile first when it has changed. Then, for a whole run or the infra
# group, Caddy itself validates docker/caddy/Caddyfile.
#
# Groups are directories: tests/unit (src/lib, at 100% coverage), tests/infra
# (the scripts, the Caddyfile, the workflow, the rules about the repository)
# and tests/e2e (the whole site built twice and audited, leaving an artifact
# under coverage/e2e/). tests/infra/structure.test.js fails on a test file
# outside them.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOCKER="${TEST_DOCKER:-docker}"
IMAGE="node:26"
GROUPS_ALL="unit infra e2e"

COVERAGE=0
CHANGED=0
PICKED=""
FILES=()
NODE_ARGS=()

for arg in "$@"; do
    case "$arg" in
        --coverage) COVERAGE=1 ;;
        --changed) CHANGED=1 ;;
        --group=*)
            group="${arg#--group=}"
            case " $GROUPS_ALL " in
                *" $group "*) PICKED="$PICKED $group" ;;
                *) echo "error: unknown group '$group'; the groups are: $GROUPS_ALL" >&2; exit 2 ;;
            esac ;;
        --filter=*) NODE_ARGS+=("--test-name-pattern=${arg#--filter=}") ;;
        -h|--help)
            sed -n '3,22p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
            exit 0 ;;
        -*) echo "error: unknown option $arg (see --help)" >&2; exit 2 ;;
        *) FILES+=("$arg") ;;
    esac
done

# --changed: the groups a change can have affected (tools/changed-groups.sh).
# Not a substitute for the gate: it does not enforce coverage.
if [ "$CHANGED" -eq 1 ]; then
    SELECTED="$("$ROOT/tools/changed-groups.sh")"

    if [ -z "$(printf '%s' "$SELECTED" | tr -d ' ')" ]; then
        echo "==> --changed: nothing the suite covers has changed."
        exit 0
    fi

    echo "==> --changed selected: $SELECTED"
    PICKED="$PICKED $SELECTED"
fi

TARGETED=0
if [ -n "$PICKED" ] || [ ${#FILES[@]} -gt 0 ] || [ ${#NODE_ARGS[@]} -gt 0 ]; then
    TARGETED=1
fi

# What to run: the named files, else the named groups, else everything.
TEST_PATHS=()
if [ ${#FILES[@]} -gt 0 ]; then
    TEST_PATHS=("${FILES[@]}")
else
    for group in ${PICKED:-$GROUPS_ALL}; do
        TEST_PATHS+=("tests/${group}/")
    done
fi

SLUG="$(sed -n 's/^  "name": "\([^"]*\)".*/\1/p' package.json | head -n 1)"
VOLUME="${SLUG:-site}_node_modules"
CACHE="${SLUG:-site}_npm_cache"
USER_ID="$(id -u):$(id -g)"

command -v "$DOCKER" >/dev/null 2>&1 || { echo "error: Docker is needed: the suite runs in a container." >&2; exit 1; }

"$DOCKER" run --rm -v "${VOLUME}:/nm" -v "${CACHE}:/cache" "$IMAGE" chown "$USER_ID" /nm /cache

in_node() {
    "$DOCKER" run --rm --init \
        --user "$USER_ID" \
        -v "${ROOT}:/app" \
        -v "${VOLUME}:/app/node_modules" \
        -v "${CACHE}:/cache" \
        -w /app \
        -e HOME=/tmp \
        -e NPM_CONFIG_CACHE=/cache \
        -e NPM_CONFIG_IGNORE_SCRIPTS=true \
        -e NPM_CONFIG_UPDATE_NOTIFIER=false \
        -e ASTRO_TELEMETRY_DISABLED=1 \
        -e CI=1 \
        "$IMAGE" "$@"
}

# ---------------------------------------------------------------------------
# Dependencies: exactly the lockfile, reinstalled only when it changed.
# ---------------------------------------------------------------------------
LOCK_SHA="$( (sha256sum package-lock.json 2>/dev/null || shasum -a 256 package-lock.json) | cut -d' ' -f1)"

if ! in_node sh -c "[ \"\$(cat node_modules/.lock-sha 2>/dev/null)\" = '${LOCK_SHA}' ]"; then
    echo "==> installing the lockfile (npm ci)"
    in_node sh -c "npm ci --no-audit --no-fund >/dev/null && echo '${LOCK_SHA}' > node_modules/.lock-sha"
fi

# ---------------------------------------------------------------------------
# The suite. With --coverage on a whole run, the unit tests run alone first,
# instrumented, with src/lib held to 100% of lines, branches and functions
# (src/lib/clients only reaches the network and the disk, and is outside it).
# The other groups then run without instrumentation: they build the site in
# child processes, whose coverage would mean nothing.
# ---------------------------------------------------------------------------
STATUS=0
COVERAGE_ARGS=(--experimental-test-coverage
               "--test-coverage-include=src/lib/**"
               "--test-coverage-exclude=src/lib/clients/**"
               --test-reporter=spec --test-reporter-destination=stdout
               --test-reporter=lcov --test-reporter-destination=coverage/lcov.info)

mkdir -p coverage

if [ "$COVERAGE" -eq 1 ] && [ "$TARGETED" -eq 0 ]; then
    echo "==> unit tests, coverage minimum 100%"
    in_node node --test "${COVERAGE_ARGS[@]}" \
        --test-coverage-lines=100 --test-coverage-branches=100 --test-coverage-functions=100 \
        tests/unit/ || STATUS=$?

    echo "==> infra and e2e tests"
    rest=0
    in_node node --test tests/infra/ tests/e2e/ || rest=$?
    if [ "$STATUS" -eq 0 ]; then STATUS=$rest; fi
elif [ "$COVERAGE" -eq 1 ]; then
    echo "==> tests with a coverage report (targeted run: no minimum)"
    in_node node --test "${COVERAGE_ARGS[@]}" ${NODE_ARGS[@]+"${NODE_ARGS[@]}"} "${TEST_PATHS[@]}" || STATUS=$?
else
    echo "==> tests: ${TEST_PATHS[*]}"
    in_node node --test ${NODE_ARGS[@]+"${NODE_ARGS[@]}"} "${TEST_PATHS[@]}" || STATUS=$?
fi

# ---------------------------------------------------------------------------
# Caddy validates its own configuration: the shape tests read the file, this
# proves Caddy can load it, with the environment production gives it.
# ---------------------------------------------------------------------------
case " ${PICKED:-$GROUPS_ALL} " in
    *" infra "*)
        if [ ${#FILES[@]} -eq 0 ]; then
            echo "==> caddy validate docker/caddy/Caddyfile"
            if ! "$DOCKER" run --rm \
                    -e SITE_ADDRESS=site.example.test -e SITE_ROOT=/srv/site/current \
                    -e WAFFLE_APP_URL=https://app.example.test -e WAFFLE_SITE_KEY=validate \
                    -v "${ROOT}/docker/caddy/Caddyfile:/etc/caddy/Caddyfile:ro" \
                    caddy:2.11 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>coverage/caddy-validate.log; then
                cat coverage/caddy-validate.log >&2
                echo "error: Caddy cannot load docker/caddy/Caddyfile." >&2
                if [ "$STATUS" -eq 0 ]; then STATUS=1; fi
            else
                echo "    valid"
            fi
        fi ;;
esac

exit "$STATUS"
