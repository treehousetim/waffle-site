#!/usr/bin/env bash
#
# deploy/pull.sh — the server's half of a release: pull it from GitHub, check
# it, unpack it, and hand it to its own deploy/deploy.sh.
#
#   waffle_site-pull check          # what the timer runs every minute
#   waffle_site-pull deploy v7      # deploy one tag, older ones included
#   waffle_site-pull status         # live, previous, failed
#   waffle_site-pull retry          # forget a failure so check tries it again
#
# Installed by hand as /usr/local/sbin/waffle_site-pull and run by
# deploy/systemd/waffle_site-deploy.timer as the deploy user
# (docs/pull-based-deployments.md). Nothing pushes to this server: CI only
# attaches files to the GitHub release.
#
# Two kinds of file arrive on the latest release:
#   <slug>-vN.tar.gz       a release: the server's files and the built site
#   <slug>-vN.dM.tar.gz    a data rebuild of vN (rebuild.yml): only the pages a
#                          change notice changed, laid over the live release by
#                          its own deploy/assemble.sh into releases/vN.dM
# each with its .sha256.
#
# Settings come from the systemd unit's environment and are not secret. The
# two secrets come from Doppler (the prod config the server's token reads):
# GITHUB_RELEASES_TOKEN, read-only on this repository, and the optional
# DEPLOY_ALERT_WEBHOOK. Neither ever goes on a command line.
#
# A release is trusted only as far as GitHub Actions built it: every file
# must have been uploaded by the workflow's own bot, and a release kept on
# disk is checked against the list of files it was unpacked with before it
# is deployed again, or built on.
#
# The numbers cite the failure list in docs/pull-based-deployments.md.
#
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/waffle_site}"
SLUG="${SLUG:-waffle_site}"
REPO="${REPO:-}"
DEPLOY_AUTHORS="${DEPLOY_AUTHORS:-}"
KEEP="${KEEP:-5}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
ASSET_UPLOADER="${ASSET_UPLOADER:-github-actions[bot]}"
ASSET_WAIT_MINUTES="${ASSET_WAIT_MINUTES:-15}"
API_ALERT_MINUTES="${API_ALERT_MINUTES:-60}"
API="${GITHUB_API:-https://api.github.com}"

RELEASES="$APP_ROOT/releases"
STATE="$APP_ROOT/shared/deploy"
MANIFESTS="$STATE/manifests"
CURRENT="$APP_ROOT/current"
HEADER="$STATE/github-header"

usage() {
    echo "usage: $(basename "$0") check | deploy <tag> | status | retry" >&2
    exit 2
}

log() { printf '%s\n' "$*"; }

# A secret from Doppler, read from APP_ROOT so the token scoped there applies.
secret() { (cd "$APP_ROOT" && doppler secrets get "$1" --plain 2>/dev/null) || true; }

live_tag() { if [ -L "$CURRENT" ]; then basename "$(readlink "$CURRENT")"; fi; }

# A key for a once-only alert, safe as a file name whatever the tag holds.
key() { printf '%s' "$1" | sha256sum | cut -c1-16; }

# Every refusal and failure is logged; with a key it is also sent once.
# Slack reads <, > and & as markup, so they are escaped. The webhook reaches
# curl on its standard input (-K -), never in its arguments (16).
alert() {
    local name="$1" message="$2" url text
    echo "alert: ${message}" >&2
    if [ -n "$name" ]; then
        [ -e "$STATE/alerted/$name" ] && return 0
        : > "$STATE/alerted/$name"
    fi
    url="$(secret DEPLOY_ALERT_WEBHOOK)"
    [ -n "$url" ] || return 0
    text="${SLUG}: ${message}"
    text="${text//&/&amp;}"; text="${text//</&lt;}"; text="${text//>/&gt;}"
    printf 'url = "%s"\n' "$url" | curl -fsS -m 10 -K - -H 'Content-Type: application/json' \
        -d "$(jq -n --arg text "$text" '{text: $text}')" >/dev/null \
        || echo "warning: the alert could not be sent" >&2
}

# (16) The token reaches curl through a file only this user can read, never
# its arguments, which every process on the server can see. Gone at exit.
open_github() {
    local token
    token="$(secret GITHUB_RELEASES_TOKEN)"
    if [ -z "$token" ]; then
        alert no-token "GITHUB_RELEASES_TOKEN is not set in Doppler, or Doppler cannot be read; nothing can be deployed"   # (13)
        exit 1
    fi
    rm -f "$STATE/alerted/no-token"
    trap 'rm -f "$HEADER"' EXIT
    ( umask 077; printf 'Authorization: Bearer %s\n' "$token" > "$HEADER" )
}

# GET from the API into a file; prints the HTTP status, 000 when unreachable.
api_get() {
    curl -sS -m 30 -H @"$HEADER" -H 'Accept: application/vnd.github+json' \
        -o "$2" -w '%{http_code}' "${API}$1" 2>/dev/null || printf '000'
}

# (1) GitHub failing is reported once it has lasted API_ALERT_MINUTES, then
# once more only after it has recovered and failed again.
api_failing() {
    local since now
    [ -f "$STATE/api-failing-since" ] || date +%s > "$STATE/api-failing-since"
    since="$(cat "$STATE/api-failing-since")"
    now="$(date +%s)"
    echo "error: GitHub's API answered $1" >&2
    if [ $((now - since)) -ge $((API_ALERT_MINUTES * 60)) ]; then
        alert api-failing "GitHub's API has been failing (last answer: $1) since $(date -d "@$since" '+%Y-%m-%d %H:%M' 2>/dev/null || echo "$since"); nothing can be deployed"
    fi
    exit 1
}

api_ok() { rm -f "$STATE/api-failing-since" "$STATE/alerted/api-failing"; }

# The release's JSON, checked; leaves TAG and AUTHOR set.
read_release() {
    local path="$1" code
    code="$(api_get "$path" "$STATE/release.json")"
    case "$code" in
        200) ;;
        404) api_ok; log "no release published yet"; exit 0 ;;   # (2)
        *) api_failing "HTTP ${code}" ;;
    esac
    TAG="$(jq -er '.tag_name' "$STATE/release.json" 2>/dev/null)" || api_failing "something that is not a release"
    AUTHOR="$(jq -r '.author.login // ""' "$STATE/release.json")"
    api_ok
}

# The URL of an asset by name, if it has finished uploading and the
# workflow's bot uploaded it (17).
asset_url() {
    jq -r --arg name "$1" --arg uploader "$ASSET_UPLOADER" \
        '.assets[] | select(.name == $name and .state == "uploaded" and .uploader.login == $uploader) | .url' \
        "$STATE/release.json" | head -n 1
}

# Whether an asset by name was uploaded by anyone else.
asset_foreign() {
    jq -e --arg name "$1" --arg uploader "$ASSET_UPLOADER" \
        'any(.assets[]; .name == $name and .uploader.login != $uploader)' "$STATE/release.json" >/dev/null
}

# The newest data rebuild of a release the bot has attached, as its run
# number: <slug>-vN.d<run>.tar.gz. Nothing when there is none (20).
latest_rebuild() {
    jq -r --arg prefix "$SLUG-$1.d" --arg uploader "$ASSET_UPLOADER" \
        '[.assets[] | select(.state == "uploaded" and .uploader.login == $uploader)
          | .name | select(startswith($prefix) and endswith(".tar.gz"))
          | ltrimstr($prefix) | rtrimstr(".tar.gz") | select(test("^[1-9][0-9]*$")) | tonumber]
         | max // empty' "$STATE/release.json"
}

# Every file and link in a release, with each file's checksum: written when it
# is unpacked, compared before it is deployed again or built on (18).
manifest() {
    (
        cd "$1"
        find . -type f -print0 | sort -z | xargs -0 -r sha256sum
        find . ! -type d ! -type f -printf '%y %p -> %l\n' | sort
    )
}

unchanged() {
    local tag="$1"
    if [ -f "$MANIFESTS/$tag" ] && manifest "$RELEASES/$tag" | cmp -s - "$MANIFESTS/$tag"; then
        return 0
    fi
    alert "changed-$(key "$tag")" "release ${tag} on this server has changed since it was unpacked; refusing to deploy it. Remove ${RELEASES}/${tag} to download it again"
    return 1
}

# Download a tarball and its checksum into $STATE/download and check one
# against the other. Returns non-zero, having said why, when it must not be
# used.
download() {
    local tag="$1" tarball="$SLUG-$1.tar.gz" url_tar url_sum expected actual
    if asset_foreign "$tarball" || asset_foreign "$tarball.sha256"; then
        alert "foreign-$(key "$tag")" "release ${tag}'s files were not uploaded by ${ASSET_UPLOADER}; refusing them"   # (17)
        return 1
    fi

    url_tar="$(asset_url "$tarball")"
    url_sum="$(asset_url "$tarball.sha256")"
    if [ -z "$url_tar" ] || [ -z "$url_sum" ]; then
        alert "assets-$(key "$tag")" "release ${tag} has no tarball and checksum attached; did its build fail?"
        return 1
    fi

    rm -rf "$STATE/download"
    mkdir -p "$STATE/download"
    if ! curl -sSfL -m 600 -H @"$HEADER" -H 'Accept: application/octet-stream' -o "$STATE/download/$tarball" "$url_tar" \
        || ! curl -sSfL -m 60 -H @"$HEADER" -H 'Accept: application/octet-stream' -o "$STATE/download/$tarball.sha256" "$url_sum"; then
        rm -rf "$STATE/download"
        echo "error: could not download ${tag}; trying again on the next tick" >&2
        return 1
    fi

    expected="$(cut -d' ' -f1 < "$STATE/download/$tarball.sha256")"
    actual="$(sha256sum "$STATE/download/$tarball" | cut -d' ' -f1)"
    if [ "$expected" != "$actual" ]; then
        rm -rf "$STATE/download"
        alert "checksum-$(key "$tag")" "release ${tag}'s tarball does not match its checksum; refusing it"   # (8)
        return 1
    fi
}

# Unpack a downloaded tarball into a directory, refusing it unless every
# required path is there (9).
unpack() {
    local tag="$1" dir="$2" required
    shift 2
    tar -xzf "$STATE/download/$SLUG-$tag.tar.gz" --no-same-owner -C "$dir"
    rm -rf "$STATE/download"
    for required in "$@"; do
        if [ ! -e "$dir/$required" ]; then
            alert "incomplete-$(key "$tag")" "release ${tag} is incomplete (no ${required}); refusing it"
            return 1
        fi
    done
}

# A release into releases/<tag>, ready to deploy.
fetch() {
    local tag="$1" dir="$RELEASES/$1"
    if [ -d "$dir" ]; then
        unchanged "$tag"
        return
    fi

    download "$tag" || return 1
    rm -rf "$dir.partial"   # (14)
    mkdir -p "$dir.partial"
    if ! unpack "$tag" "$dir.partial" dist/index.html dist/build.txt deploy/deploy.sh deploy/assemble.sh docker-compose.prod.yml docker/caddy/Caddyfile; then
        rm -rf "$dir.partial"
        return 1
    fi

    manifest "$dir.partial" > "$MANIFESTS/$tag"
    mv "$dir.partial" "$dir"
}

# A data rebuild into releases/<tag>: the live release, copied by its own
# assemble.sh, with the rebuild laid over it. The live release is checked
# first and never changed (22).
fetch_rebuild() {
    local tag="$1" live="$2" dir="$RELEASES/$1" base
    if [ -d "$dir" ]; then
        unchanged "$tag"
        return
    fi

    unchanged "$live" || return 1
    download "$tag" || return 1
    rm -rf "$dir.incoming" "$dir.partial"   # (14)
    mkdir -p "$dir.incoming"
    if ! unpack "$tag" "$dir.incoming" .scoped-base .scoped-remove build.txt pages-manifest.json; then
        rm -rf "$dir.incoming"
        return 1
    fi

    # (21) Built over what was being served when it was built; anything else
    # would lose or bring back pages. Not retried: the next change notice
    # rebuilds over what is live then.
    base="$(head -n 1 "$dir.incoming/.scoped-base")"
    if [ "$base" != "$live" ]; then
        rm -rf "$dir.incoming"
        printf '%s\n' "$tag" > "$STATE/failed-tag"
        alert "stale-$(key "$tag")" "the data rebuild ${tag} was not built over ${live}, which is live; not deploying it. The next change notice rebuilds over what is live"
        return 1
    fi

    if ! bash "$RELEASES/$live/deploy/assemble.sh" "$dir.incoming" "$dir.partial"; then
        rm -rf "$dir.incoming" "$dir.partial"
        printf '%s\n' "$tag" > "$STATE/failed-tag"
        alert "assemble-$(key "$tag")" "the data rebuild ${tag} could not be laid over ${live}; not deploying it. journalctl -u ${SLUG}-deploy says why"
        return 1
    fi

    rm -rf "$dir.incoming"
    manifest "$dir.partial" > "$MANIFESTS/$tag"
    mv "$dir.partial" "$dir"
}

# Hand the release to its own deploy.sh, which switches `current`, checks the
# site is serving it and switches back on failure.
run_deploy() {
    local tag="$1"
    log "==> deploying ${tag}"
    if bash "$RELEASES/$tag/deploy/deploy.sh" "$tag"; then
        rm -f "$STATE/failed-tag"
        log "==> ${tag} is live"
        return 0
    fi
    printf '%s\n' "$tag" > "$STATE/failed-tag"   # (11)
    alert "failed-$(key "$tag")" "the deploy of ${tag} failed; $(live_tag || true) is serving. journalctl -u ${SLUG}-deploy says why; ${SLUG}-pull retry tries it again"   # (12)
    return 1
}

# (15) The newest KEEP releases stay, and the live and previous ones always.
# Data rebuilds share files with the release they were built on by hard
# links, so removing either leaves the other whole.
prune() {
    local live previous
    live="$(live_tag || true)"
    previous="$(cat "$STATE/previous-tag" 2>/dev/null || true)"
    find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -name 'v*' -printf '%f\n' \
        | grep -E '^v[0-9]+(\.d[0-9]+)?$' | sort -V -r | tail -n +"$((KEEP + 1))" \
        | while read -r old; do
            [ "$old" = "$live" ] || [ "$old" = "$previous" ] || rm -rf "${RELEASES:?}/$old" "${MANIFESTS:?}/$old"
        done
}

lock() {
    exec 9>"$STATE/lock"
    if ! flock -n 9; then   # (10)
        log "a deploy is already running; skipping this tick"
        exit 0
    fi
}

settings() {
    [ -n "$REPO" ] || { echo "error: REPO is not set; the systemd unit sets it" >&2; exit 2; }
    [ -n "$DEPLOY_AUTHORS" ] || { echo "error: DEPLOY_AUTHORS is not set; the systemd unit sets it" >&2; exit 2; }
}

# (20) The latest release is live, or a data rebuild of it is: deploy its
# newest data rebuild, if that is newer than what is live.
check_rebuild() {
    local release="$1" live="$2" have=0 run tag foreign
    [[ "$live" == *.d* ]] && have="${live##*.d}"

    # (17) Only the bot's are counted; anyone else's are named once, never
    # by their file names, which nobody has checked.
    foreign="$(jq -r --arg prefix "$SLUG-$release.d" --arg uploader "$ASSET_UPLOADER" \
        '[.assets[] | select((.name | startswith($prefix)) and .uploader.login != $uploader) | .name] | sort | join(" ")' "$STATE/release.json")"
    if [ -n "$foreign" ]; then
        alert "foreign-$(key "$foreign")" "release ${release} has data-rebuild files not uploaded by ${ASSET_UPLOADER}; ignoring them"
    fi

    run="$(latest_rebuild "$release")"
    [ -n "$run" ] && [ "$run" -gt "$have" ] || exit 0   # (4)
    tag="${release}.d${run}"

    if [ "$(cat "$STATE/failed-tag" 2>/dev/null || true)" = "$tag" ]; then
        log "${tag} failed before; ${SLUG}-pull retry tries it again"   # (11)
        exit 0
    fi
    if [ -z "$(asset_url "$SLUG-$tag.tar.gz.sha256")" ]; then
        log "waiting for ${tag}'s checksum"   # (7)
        exit 0
    fi

    fetch_rebuild "$tag" "$live" || exit 0
    run_deploy "$tag" || exit 1
    prune
    exit 0
}

# What is newest on GitHub: the latest release, or its newest data rebuild.
newest() {
    local run
    run="$(latest_rebuild "$TAG" 2>/dev/null || true)"
    printf '%s\n' "${TAG}${run:+.d$run}"
}

# (23) A deploy by name (a rollback) holds the server there: check deploys
# nothing until something newer than what was newest then is published, or
# until retry. Held while GitHub could not be read, it holds whatever the
# first check after finds.
held() {
    local hold newest_now
    [ -f "$STATE/hold" ] || return 1
    hold="$(cat "$STATE/hold")"
    newest_now="$(newest)"
    if [ "$hold" = unknown ]; then
        printf '%s\n' "$newest_now" > "$STATE/hold"
        hold="$newest_now"
    fi
    if [ "$hold" = "$newest_now" ]; then
        log "holding at $(live_tag || true), deployed by name; ${SLUG}-pull retry deploys the latest again"
        return 0
    fi
    rm -f "$STATE/hold"
    return 1
}

check() {
    local live code
    settings
    lock
    open_github
    read_release "/repos/${REPO}/releases/latest"
    held && exit 0
    live="$(live_tag || true)"
    code="${live%%.d*}"

    if [ -n "$live" ] && [ "$TAG" = "$code" ]; then
        check_rebuild "$TAG" "$live"
    fi

    if [[ ! "$TAG" =~ ^v[1-9][0-9]*$ ]]; then
        # Not repeated: a tag that is not vN is text nobody has checked.
        alert "refused-$(key "$TAG")" "the latest release's tag is not vN; not deploying it"   # (3)
        exit 0
    fi
    if [ -n "$code" ] && [ "${TAG#v}" -le "${code#v}" ]; then
        alert "refused-$(key "$TAG")" "the latest release, ${TAG}, is older than ${live}, which is live; not deploying it"   # (5)
        exit 0
    fi
    if [[ " ${DEPLOY_AUTHORS} " != *" ${AUTHOR} "* ]]; then
        alert "refused-$(key "$TAG")" "release ${TAG} was published by ${AUTHOR:-nobody}, who is not in DEPLOY_AUTHORS; not deploying it"   # (6)
        exit 0
    fi
    if [ "$(cat "$STATE/failed-tag" 2>/dev/null || true)" = "$TAG" ]; then
        log "${TAG} failed before; ${SLUG}-pull retry tries it again"   # (11)
        exit 0
    fi

    if asset_foreign "$SLUG-$TAG.tar.gz" || asset_foreign "$SLUG-$TAG.tar.gz.sha256"; then
        alert "foreign-$(key "$TAG")" "release ${TAG}'s files were not uploaded by ${ASSET_UPLOADER}; refusing them"   # (17)
        exit 0
    fi

    # (7) CI attaches the files a few minutes after the release is published.
    if [ -z "$(asset_url "$SLUG-$TAG.tar.gz")" ] || [ -z "$(asset_url "$SLUG-$TAG.tar.gz.sha256")" ]; then
        [ -f "$STATE/waiting-$TAG" ] || date +%s > "$STATE/waiting-$TAG"
        if [ $(($(date +%s) - $(cat "$STATE/waiting-$TAG"))) -ge $((ASSET_WAIT_MINUTES * 60)) ]; then
            alert "assets-$(key "$TAG")" "release ${TAG} still has no tarball after ${ASSET_WAIT_MINUTES} minutes; did its build fail?"
        else
            log "waiting for ${TAG}'s files"
        fi
        exit 0
    fi
    rm -f "$STATE"/waiting-*

    fetch "$TAG" || exit 0
    run_deploy "$TAG" || exit 1
    prune
}

deploy_tag() {
    local tag="$1"
    [[ "$tag" =~ ^v[1-9][0-9]*(\.d[1-9][0-9]*)?$ ]] || { echo "error: '${tag}' is not vN or vN.dM" >&2; exit 2; }
    local hold=unknown
    settings
    lock
    open_github
    if [ "$(api_get "/repos/${REPO}/releases/latest" "$STATE/release.json")" = 200 ] \
        && TAG="$(jq -er '.tag_name' "$STATE/release.json" 2>/dev/null)"; then
        hold="$(newest)"
    fi
    if [ -d "$RELEASES/$tag" ]; then
        unchanged "$tag" || exit 1
    elif [[ "$tag" == *.d* ]]; then
        echo "error: ${tag} is a data rebuild, which deploys only from disk, and it is not in ${RELEASES}; deploy its release, ${tag%%.d*}" >&2
        exit 1
    else
        read_release "/repos/${REPO}/releases/tags/${tag}"
        fetch "$tag" || exit 1
    fi
    run_deploy "$tag" || exit 1
    printf '%s\n' "$hold" > "$STATE/hold"
    prune
}

status() {
    log "live:     $(live_tag || true)"
    log "previous: $(cat "$STATE/previous-tag" 2>/dev/null || true)"
    log "failed:   $(cat "$STATE/failed-tag" 2>/dev/null || true)"
    log "held:     $(cat "$STATE/hold" 2>/dev/null || true)"
    if (exec 9>"$STATE/lock"; flock -n 9); then log "lock:     free"; else log "lock:     held (a deploy is running)"; fi
    log "kept:     $(find "$RELEASES" -mindepth 1 -maxdepth 1 -type d -printf '%f ' 2>/dev/null)"
}

# (19) As anyone else, even for `status`, the lock and the state could end up
# owned by them, and every later tick by the deploy user would fail.
if [ "$(id -un)" != "$DEPLOY_USER" ]; then
    echo "error: run this as ${DEPLOY_USER}, not $(id -un): sudo -u ${DEPLOY_USER} $(basename "$0") ..." >&2
    exit 1
fi

mkdir -p "$RELEASES" "$STATE/alerted" "$MANIFESTS"

case "${1:-}" in
    check) check ;;
    deploy) [ -n "${2:-}" ] || usage; deploy_tag "$2" ;;
    status) status ;;
    retry) rm -f "$STATE/failed-tag" "$STATE/hold" "$STATE"/alerted/failed-*; log "the next check tries the latest release again" ;;
    *) usage ;;
esac
