/**
 * tools/setup-github.sh (docs/fresh-install.md, its appendix's failure list).
 * Stand-in `gh` and `doppler` log every call; the token goes through a pipe
 * the stand-in `gh secret set` reads, and nowhere else.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fakeBin, run } from '../support/shell.js';

const DEPLOY_KEYS = 'DROPLET_HOST DROPLET_USER DROPLET_SSH_KEY DROPLET_SSH_KNOWN_HOSTS';

function setupGithub(args = [], env = {}) {
    const bin = fakeBin({
        gh: `
            case "$1 $2" in
                "auth status") exit "\${FAKE_GH_AUTH_EXIT:-0}" ;;
                "repo view")
                    case "$*" in
                        *defaultBranchRef*) echo "\${FAKE_GH_BRANCH-main}" ;;
                        *) [ -n "\${FAKE_GH_REPO:-}" ] || exit 1; echo "$FAKE_GH_REPO" ;;
                    esac ;;
                "secret list") printf '%b' "\${FAKE_GH_SECRETS:-}" ;;
                "secret set")  cat >> "$(dirname "$0")/secret.stdin" ;;
                "api -X")      cat >/dev/null ;;
                *)
                    case "$*" in
                        *environments/prod-rebuild/*) printf '%b' "\${FAKE_GH_REBUILD_POLICIES:-}" ;;
                        *) printf '%b' "\${FAKE_GH_POLICIES:-}" ;;
                    esac ;;
            esac`,
        doppler: `
            case "$1" in
                me) exit "\${FAKE_DOPPLER_AUTH_EXIT:-0}" ;;
                configs)
                    case "$2" in
                        get)    exit "\${FAKE_DOPPLER_CONFIG_EXIT:-0}" ;;
                        tokens) echo "dp.st.prod-deploy.FAKETOKEN0123456789" ;;
                    esac ;;
                secrets)
                    printf '{'; sep=''
                    for name in DOPPLER_CONFIG DOPPLER_PROJECT \${FAKE_DEPLOY_KEYS-${DEPLOY_KEYS}}; do
                        printf '%s"%s":{}' "$sep" "$name"; sep=','
                    done
                    printf '}\\n' ;;
            esac`,
    });
    const result = run('bash', ['tools/setup-github.sh', ...args], { bin: bin.dir, env: { FAKE_GH_REPO: 'acme/site', ...env } });
    const stdin = join(bin.dir, 'secret.stdin');

    return {
        ...result,
        calls: bin.calls(),
        stdin: existsSync(stdin) ? readFileSync(stdin, 'utf8') : null,
    };
}

const called = (calls, needle) => calls.some((call) => call.includes(needle));

test('(10, 11) creates the tag-gated and the branch-gated environments, and pipes a read-only token into each', () => {
    const result = setupGithub();

    assert.equal(result.status, 0, result.output);
    assert.ok(called(result.calls, 'gh api -X PUT repos/acme/site/environments/prod '));
    assert.ok(called(result.calls, 'gh api -X PUT repos/acme/site/environments/prod-rebuild '));
    assert.ok(called(result.calls, 'environments/prod/deployment-branch-policies -f name=v* -f type=tag'));
    assert.ok(called(result.calls, 'environments/prod-rebuild/deployment-branch-policies -f name=main -f type=branch'));
    assert.equal(result.calls.filter((call) => call.startsWith('doppler configs tokens create')).length, 2);
    assert.ok(called(result.calls, '--access read'));
    assert.ok(called(result.calls, 'secret set DOPPLER_TOKEN --env prod '));
    assert.ok(called(result.calls, 'secret set DOPPLER_TOKEN --env prod-rebuild '));
    assert.equal(result.stdin.trim(), 'dp.st.prod-deploy.FAKETOKEN0123456789\ndp.st.prod-deploy.FAKETOKEN0123456789');
    assert.equal(called(result.calls, 'FAKETOKEN'), false, 'the token appeared on a command line');
    assert.equal(result.output.includes('FAKETOKEN'), false, 'the token was printed');
});

test('names the Doppler project after package.json, unless told otherwise', () => {
    assert.ok(called(setupGithub().calls, '--project waffle_site'));
    assert.ok(called(setupGithub(['--project', 'acme']).calls, '--project acme'));
});

test('(1, 2) stops before changing anything when a CLI is missing or signed out', () => {
    for (const env of [{ FAKE_GH_AUTH_EXIT: '1' }, { FAKE_DOPPLER_AUTH_EXIT: '1' }]) {
        const result = setupGithub([], env);

        assert.equal(result.status, 1);
        assert.equal(called(result.calls, 'api -X'), false);
    }

    assert.match(setupGithub([], { SETUP_GH: '/nonexistent/gh' }).stderr, /gh \(the GitHub CLI\) is not installed/);
    assert.match(setupGithub([], { SETUP_DOPPLER: '/nonexistent/doppler' }).stderr, /doppler \(the Doppler CLI\) is not installed/);
});

test('(3) refuses to guess the repository, and uses --repo when given', () => {
    assert.match(setupGithub([], { FAKE_GH_REPO: '' }).stderr, /Pass --repo owner\/name/);
    assert.ok(called(setupGithub(['--repo', 'acme/other'], { FAKE_GH_REPO: '' }).calls, 'repos/acme/other/environments/prod'));
});

test('(4) issues no token when prod-deploy does not exist', () => {
    const result = setupGithub([], { FAKE_DOPPLER_CONFIG_EXIT: '1' });

    assert.match(result.stderr, /has no prod-deploy config/);
    assert.equal(called(result.calls, 'tokens create'), false);
});

test('(5) refuses a prod-deploy that holds anything but deploy credentials', () => {
    const result = setupGithub([], { FAKE_DEPLOY_KEYS: `${DEPLOY_KEYS} WAFFLE_SITE_KEY` });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /holds more than deploy credentials: WAFFLE_SITE_KEY/);
    assert.equal(called(result.calls, 'tokens create'), false);
    assert.equal(setupGithub([], { FAKE_DEPLOY_KEYS: `${DEPLOY_KEYS} DEPLOY_ALERT_WEBHOOK` }).status, 0);
});

test('(6) warns about a missing deploy credential, and carries on', () => {
    const result = setupGithub([], { FAKE_DEPLOY_KEYS: 'DROPLET_HOST DROPLET_USER' });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /missing: DROPLET_SSH_KEY DROPLET_SSH_KNOWN_HOSTS/);
});

test('(7) refuses an environment that lets anything but its own rule deploy', () => {
    const prod = setupGithub([], { FAKE_GH_POLICIES: 'tag v*\\nbranch main\\n' });
    const rebuild = setupGithub([], { FAKE_GH_REBUILD_POLICIES: 'branch main\\ntag v*\\n' });

    assert.equal(prod.status, 1);
    assert.match(prod.stderr, /the prod environment already lets these deploy, besides v\* tags:\n\s+branch main/);
    assert.equal(rebuild.status, 1);
    assert.match(rebuild.stderr, /the prod-rebuild environment already lets these deploy, besides the main branch:\n\s+tag v\*/);
});

test('(8) adds each rule only once, and the rebuild rule for whatever the default branch is', () => {
    const again = setupGithub([], { FAKE_GH_POLICIES: 'tag v*\\n', FAKE_GH_REBUILD_POLICIES: 'branch main\\n' });

    assert.equal(called(again.calls, '-f name=v*'), false);
    assert.equal(called(again.calls, '-f name=main'), false);
    assert.ok(called(setupGithub([], { FAKE_GH_BRANCH: 'trunk' }).calls, '-f name=trunk -f type=branch'));
    assert.match(setupGithub([], { FAKE_GH_BRANCH: '' }).stderr, /could not read acme\/site's default branch/);
});

test('(9) leaves an existing token alone unless told to rotate it', () => {
    const kept = setupGithub([], { FAKE_GH_SECRETS: 'DOPPLER_TOKEN\\n' });
    assert.match(kept.stdout, /DOPPLER_TOKEN is already set; left alone/);
    assert.equal(called(kept.calls, 'tokens create'), false);

    const rotated = setupGithub(['--rotate-token'], { FAKE_GH_SECRETS: 'DOPPLER_TOKEN\\n' });
    assert.ok(called(rotated.calls, 'tokens create'));
    assert.match(rotated.stdout, /revoke the previous github-actions-prod-\* token/);
    assert.match(rotated.stdout, /revoke the previous github-actions-prod-rebuild-\* token/);
});

test('an unknown option is refused', () => {
    assert.equal(setupGithub(['--fast']).status, 2);
});
