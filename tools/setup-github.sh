#!/usr/bin/env bash
#
# tools/setup-github.sh — connect GitHub Actions to Doppler for deploys.
#
#   ./tools/setup-github.sh                    # repo from the git remote
#   ./tools/setup-github.sh --rotate-token     # replace an existing token
#
# Does docs/fresh-install.md steps 13-14 in one go, once Doppler's prod-deploy
# config is filled (step 12) and both CLIs are signed in:
#
#   1. checks prod-deploy holds the deploy credentials and nothing more
#   2. creates the `prod` GitHub environment, deployable from v* tags only,
#      and `prod-rebuild`, deployable from the default branch only (scoped
#      rebuilds from the app's change notices, docs/scoped-builds.md)
#   3. issues each a read-only Doppler token for prod-deploy and pipes it
#      straight into its DOPPLER_TOKEN secret: never printed, never on a
#      command line
#
# Safe to re-run. It replaces an existing token only with --rotate-token.
# Required reviewers stay a manual choice (Settings -> Environments -> prod).
# Runs on macOS, Linux and WSL2. The numbers below cite the failure list in
# docs/fresh-install.md's appendix.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

GH="${SETUP_GH:-gh}"
DOPPLER="${SETUP_DOPPLER:-doppler}"
CONFIG="prod-deploy"

# What prod-deploy may hold. Anything else is a production secret that would
# reach the CI runner (5). Doppler adds its own DOPPLER_* names to every config.
REQUIRED="DROPLET_HOST DROPLET_USER DROPLET_SSH_KEY DROPLET_SSH_KNOWN_HOSTS"
OPTIONAL="DEPLOY_ALERT_WEBHOOK"

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
    BOLD=''; RED=''; GREEN=''; YELLOW=''; RESET=''
fi

step() { printf '\n%s==> %s%s\n' "$BOLD" "$1" "$RESET"; }
ok()   { printf '  %s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
warn() { printf '  %s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
die()  { printf '\n%serror:%s %s\n' "$RED" "$RESET" "$1" >&2; exit "${2:-1}"; }

usage() {
    cat <<'EOF'
Usage: ./tools/setup-github.sh [options]

Creates the `prod` GitHub environment (v* tags only) and `prod-rebuild` (the
default branch only), each with its own read-only Doppler token for the
prod-deploy config.

Options:
  --repo <owner/name>  the GitHub repository (default: from the git remote)
  --project <name>     the Doppler project (default: package.json's name, the slug)
  --rotate-token       replace an existing DOPPLER_TOKEN
  -h, --help           this help
EOF
}

REPO=""; PROJECT=""; ROTATE=0
while [ "$#" -gt 0 ]; do
    case "$1" in
        --repo) REPO="${2:-}"; shift 2 ;;
        --project) PROJECT="${2:-}"; shift 2 ;;
        --rotate-token) ROTATE=1; shift ;;
        -h|--help) usage; exit 0 ;;
        *) usage >&2; die "unknown option: $1" 2 ;;
    esac
done

# ---------------------------------------------------------------------------
# Tools and sign-in, before anything changes (1, 2).
# ---------------------------------------------------------------------------
step "Checking the CLIs"

command -v "$GH" >/dev/null 2>&1 \
    || die "gh (the GitHub CLI) is not installed. macOS: brew install gh · Linux: https://github.com/cli/cli#installation"
"$GH" auth status >/dev/null 2>&1 \
    || die "gh is not signed in. Run: gh auth login"
ok "gh signed in"

command -v "$DOPPLER" >/dev/null 2>&1 \
    || die "doppler (the Doppler CLI) is not installed. macOS: brew install dopplerhq/cli/doppler · Linux: https://docs.doppler.com/docs/install-cli"
"$DOPPLER" me --json >/dev/null 2>&1 \
    || die "doppler is not signed in. Run: doppler login"
ok "doppler signed in"

# ---------------------------------------------------------------------------
# Which repository and which Doppler project (3).
# ---------------------------------------------------------------------------
if [ -z "$REPO" ]; then
    REPO="$("$GH" repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
    [ -n "$REPO" ] || die "could not work out the GitHub repository from this checkout. Pass --repo owner/name."
fi

if [ -z "$PROJECT" ]; then
    # The slug: package.json's name after setup.sh.
    PROJECT="$(sed -n 's/^  "name": "\([^"]*\)".*/\1/p' package.json | head -n 1)"
    [ -n "$PROJECT" ] || die "could not work out the Doppler project from package.json. Pass --project."
fi
ok "repository ${REPO}, Doppler project ${PROJECT}"

# ---------------------------------------------------------------------------
# prod-deploy: exists (4), holds nothing it should not (5), lacks nothing (6).
# Names only; no value is ever read.
# ---------------------------------------------------------------------------
step "Checking Doppler's ${CONFIG} config"

"$DOPPLER" configs get "$CONFIG" --project "$PROJECT" --json >/dev/null 2>&1 \
    || die "Doppler project ${PROJECT} has no ${CONFIG} config. Create it and fill it first (docs/fresh-install.md, steps 3 and 12)."

NAMES="$("$DOPPLER" secrets --only-names --project "$PROJECT" --config "$CONFIG" --json 2>/dev/null \
         | grep -o '"[A-Z][A-Z0-9_]*"' | tr -d '"' | grep -v '^DOPPLER_' | sort -u || true)"

EXTRA=""
for name in $NAMES; do
    case " $REQUIRED $OPTIONAL " in
        *" $name "*) ;;
        *) EXTRA="$EXTRA $name" ;;
    esac
done
if [ -n "$EXTRA" ]; then
    die "${CONFIG} holds more than deploy credentials:${EXTRA}
       The CI runner reads this config, so these would reach it. Delete them from
       ${CONFIG} (they belong in prod-serve; was \"Add missing value\" clicked?), then run this again."
fi

MISSING=""
for name in $REQUIRED; do
    case " $(printf '%s' "$NAMES" | tr '\n' ' ') " in
        *" $name "*) ;;
        *) MISSING="$MISSING $name" ;;
    esac
done
if [ -n "$MISSING" ]; then
    warn "${CONFIG} is missing:${MISSING}. Deploys will fail until they are set (docs/fresh-install.md, step 12)."
else
    ok "${CONFIG} holds the deploy credentials and nothing else"
fi

# ---------------------------------------------------------------------------
# Two environments, each holding its own read-only DOPPLER_TOKEN:
#
#   prod          deployable from v* release tags only (deploy.yml)
#   prod-rebuild  deployable from the default branch only (rebuild.yml: a
#                 change notice's repository_dispatch runs there)
#
# Each lets nothing else deploy (7), its rule is added once (8), and its
# token is read-only (11), piped (10), and not replaced unasked (9).
# ---------------------------------------------------------------------------
BRANCH="$("$GH" repo view "$REPO" --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || true)"
[ -n "$BRANCH" ] || die "could not read ${REPO}'s default branch."

environment() {
    local name="$1" type="$2" pattern="$3" what="$4" policies others

    step "The ${name} environment"

    policies="$("$GH" api "repos/${REPO}/environments/${name}/deployment-branch-policies" \
                 --jq '.branch_policies[] | "\(.type // "branch") \(.name)"' 2>/dev/null || true)"

    others="$(printf '%s\n' "$policies" | grep -v -F -x "${type} ${pattern}" | grep -v '^$' || true)"
    if [ -n "$others" ]; then
        die "the ${name} environment already lets these deploy, besides ${what}:
$(printf '%s\n' "$others" | sed 's/^/         /')
       Anything that can deploy can read DOPPLER_TOKEN. Remove them in
       Settings -> Environments -> ${name}, then run this again."
    fi

    "$GH" api -X PUT "repos/${REPO}/environments/${name}" --input - >/dev/null <<'JSON'
{"deployment_branch_policy": {"protected_branches": false, "custom_branch_policies": true}}
JSON
    ok "environment ${name} exists, deployable by rule only"

    if printf '%s\n' "$policies" | grep -F -x "${type} ${pattern}" >/dev/null; then
        ok "${what} rule already there"
    else
        "$GH" api -X POST "repos/${REPO}/environments/${name}/deployment-branch-policies" \
            -f name="$pattern" -f type="$type" >/dev/null
        ok "${what} rule added"
    fi

    # Not grep -q: under pipefail its early exit can fail the pipe, which would
    # read as "no token" and replace a working one.
    if "$GH" secret list --env "$name" --repo "$REPO" --json name --jq '.[].name' 2>/dev/null | grep -x 'DOPPLER_TOKEN' >/dev/null \
       && [ "$ROTATE" -eq 0 ]; then
        ok "its DOPPLER_TOKEN is already set; left alone (--rotate-token replaces it)"
    else
        local token_name
        token_name="github-actions-${name}-$(date -u +%Y%m%d%H%M%S)"
        # From Doppler straight into GitHub: the value is never in a variable,
        # an argument, or the terminal.
        "$DOPPLER" configs tokens create "$token_name" --project "$PROJECT" --config "$CONFIG" --access read --plain \
            | "$GH" secret set DOPPLER_TOKEN --env "$name" --repo "$REPO" >/dev/null \
            || die "the token was not stored. If Doppler created ${token_name}, revoke it under ${CONFIG} -> Access."
        ok "read-only token ${token_name} stored as the ${name} environment's DOPPLER_TOKEN"
        if [ "$ROTATE" -eq 1 ]; then
            warn "revoke the previous github-actions-${name}-* token under ${CONFIG} -> Access in Doppler"
        fi
    fi
}

environment prod tag 'v*' 'v* tags'
environment prod-rebuild branch "$BRANCH" "the ${BRANCH} branch"

step "Done"
cat <<EOF
  GitHub Actions can now deploy ${REPO} from a v* release tag (prod), and
  rebuild from the app's change notices (prod-rebuild, from ${BRANCH}).
  Optional: require a reviewer for each deploy in Settings -> Environments -> prod.
EOF
