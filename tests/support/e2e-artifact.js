/**
 * The record an end-to-end test leaves behind: a verifiable, repeatable
 * artifact under coverage/e2e/<name>.json.
 *
 * Two rules make it repeatable:
 *
 *  - Facts are what a visitor or a search engine would observe (a title, a
 *    canonical URL, a price), never a time or a random value, so two runs of
 *    an unchanged codebase record the same facts.
 *  - The digest covers the facts and the checks, nothing else. Two runs of an
 *    unchanged codebase write the same SHA-256; a changed digest means the
 *    site's observable behaviour changed. `files` (the hash of every built
 *    file) is recorded for inspection and left out of the digest, so a CSS
 *    tweak does not look like a behaviour change.
 *
 *     const artifact = new E2EArtifact('site-build');
 *     artifact.fact('home title', title);
 *     artifact.check('robots.txt names the sitemap', ok);
 *     artifact.write();   // throws, after writing, if any check failed
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './shell.js';

export class E2EArtifact {
    /** @param {string} name */
    constructor(name) {
        this.name = name;
        /** @type {Record<string, unknown>} */
        this.facts = {};
        /** @type {Record<string, boolean>} */
        this.checks = {};
        /** @type {Record<string, string>} */
        this.files = {};
    }

    fact(name, value) {
        this.facts[name] = value;

        return this;
    }

    check(description, passed) {
        this.checks[description] = Boolean(passed);

        return this;
    }

    file(path, sha256) {
        this.files[path] = sha256;

        return this;
    }

    digest() {
        return createHash('sha256').update(JSON.stringify({ facts: this.facts, checks: this.checks })).digest('hex');
    }

    write() {
        const dir = join(ROOT, 'coverage/e2e');
        mkdirSync(dir, { recursive: true });
        const path = join(dir, `${this.name}.json`);
        const failed = Object.entries(this.checks).filter(([, passed]) => !passed).map(([description]) => description);

        writeFileSync(path, JSON.stringify({
            name: this.name,
            facts: this.facts,
            checks: this.checks,
            passed: failed.length === 0,
            sha256: this.digest(),
            files: this.files,
        }, null, 2) + '\n');

        if (failed.length > 0) {
            throw new Error(`E2E ${this.name} failed: ${failed.join('; ')} (see ${path})`);
        }

        return path;
    }
}
