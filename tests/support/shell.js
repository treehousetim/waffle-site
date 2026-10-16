/**
 * Running the repository's shell scripts from a test: in a scratch directory,
 * with stand-in commands (docker, gh, doppler, dig...) first on PATH, so a
 * script under test never reaches the network, Docker or a real account.
 */
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Scratch directories, all removed when the test process exits. */
const scratchDirs = new Set();
process.on('exit', () => {
    for (const dir of scratchDirs) {
        rmSync(dir, { recursive: true, force: true });
    }
});

/** A fresh directory, removed when the test process exits. */
export function scratch(prefix = 'waffle-site-') {
    const dir = mkdtempSync(join(tmpdir(), prefix));
    scratchDirs.add(dir);

    return dir;
}

/**
 * A directory of stand-in commands. Each is a bash script; every call is
 * appended to <dir>/calls.log as "name arg arg..." so a test can assert what
 * was run and with what.
 *
 * @param {Record<string, string>} commands  name -> bash body
 */
export function fakeBin(commands) {
    const dir = scratch('fake-bin-');

    for (const [name, body] of Object.entries(commands)) {
        const file = join(dir, name);
        writeFileSync(file, `#!/usr/bin/env bash\nprintf '%s\\n' "${name} $*" >> "${dir}/calls.log"\n${body}\n`);
        chmodSync(file, 0o755);
    }

    return {
        dir,
        calls: () => {
            try {
                return readFileSync(join(dir, 'calls.log'), 'utf8').trim().split('\n').filter(Boolean);
            } catch {
                return [];
            }
        },
    };
}

/**
 * Runs a command; never throws on a non-zero exit.
 *
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, env?: Record<string, string | undefined>, bin?: string, input?: string }} [options]
 */
export function run(command, args, { cwd = ROOT, env = {}, bin, input } = {}) {
    const result = spawnSync(command, args, {
        cwd,
        input,
        encoding: 'utf8',
        env: {
            ...process.env,
            NO_COLOR: '1',
            ...(bin ? { PATH: `${bin}:${process.env.PATH}` } : {}),
            ...env,
        },
    });

    return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '', output: (result.stdout ?? '') + (result.stderr ?? '') };
}

/** Copies these repository paths into a scratch directory, keeping their places. */
export function copyRepo(paths) {
    const dir = scratch('repo-');

    for (const path of paths) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        cpSync(join(ROOT, path), join(dir, path), { recursive: true });
    }

    return dir;
}

/** A git repository with an identity, so commits work in a container with none. */
export function git(cwd, ...args) {
    return run('git', args, {
        cwd,
        env: {
            GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.test',
            GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.test',
            GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1',
        },
    });
}

export const read = (path) => readFileSync(join(ROOT, path), 'utf8');
