/**
 * CI (.github/workflows/ci.yml): the gate on every push to main and every
 * pull request. A pull request's code is a stranger's, so the job that runs
 * it must hold nothing worth taking.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { read, ROOT } from '../support/shell.js';

const workflow = read('.github/workflows/ci.yml');

test('runs the whole gate on pushes to main and on pull requests', () => {
    assert.match(workflow, /^on:\n {2}push:\n {4}branches: \[main\]\n {2}pull_request:\n/m);
    assert.match(workflow, /^ {8}run: \.\/tools\/test\.sh --coverage$/m);
});

test('reads the repository and nothing else: no secret, no environment, no write token', () => {
    assert.match(workflow, /^permissions:\n {2}contents: read\n/m);
    assert.doesNotMatch(workflow, /secrets\./);
    assert.doesNotMatch(workflow, /^\s+environment:/m);
    assert.doesNotMatch(workflow, /pull_request_target/);
    assert.match(workflow, /persist-credentials: false/);
});

test('pins every action to a commit', () => {
    const uses = [...workflow.matchAll(/uses: (\S+)/g)].map((match) => match[1]);

    assert.ok(uses.length > 0);
    for (const action of uses) {
        assert.match(action, /@[0-9a-f]{40}$/);
    }
});

test('no workflow holds a plain value YAML would read as a second key, so GitHub can parse every one', () => {
    // `run: printf 'a: b'` is invalid YAML: GitHub rejects the whole file, and
    // says so only after a push. A value holding ": " must be quoted or a
    // block (`run: |`).
    const offenders = [];

    for (const file of readdirSync(join(ROOT, '.github/workflows')).filter((name) => name.endsWith('.yml'))) {
        read(`.github/workflows/${file}`).split('\n').forEach((line, index) => {
            const value = /^\s*(?:- )?[\w-]+: (.*)$/.exec(line)?.[1] ?? '';

            if (!/^[|>'"]/.test(value) && value.replace(/\s#.*$/, '').includes(': ')) {
                offenders.push(`${file}:${index + 1}: ${line.trim()}`);
            }
        });
    }

    assert.deepEqual(offenders, []);
});
