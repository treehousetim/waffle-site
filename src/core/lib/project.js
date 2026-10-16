/**
 * Where the site's own files live (docs/examples.md).
 *
 * A site made from the template has one layout: its pages and design in
 * src/, its static files in public/, its waffle fixtures in api-fixtures/,
 * with the shared core in src/core/. The template repository itself holds
 * several examples instead, each a complete site under examples/<name>/,
 * and builds the one SITE_EXAMPLE names (electrician unless told otherwise).
 *
 * Pure: which examples exist comes in as an argument.
 */

export const DEFAULT_EXAMPLE = 'electrician';

export class ProjectError extends Error {
    /** @param {string} message */
    constructor(message) {
        super(message);
        this.name = 'ProjectError';
    }
}

/**
 * @typedef {object} SiteLayout
 * @property {string | null} example  the example being built, or null in a site
 * @property {string} srcDir           relative to the repository root
 * @property {string} publicDir
 * @property {string} fixturesDir
 * @property {string | null} tsconfig  the example's own, for astro check; null in a site
 */

/**
 * @param {{ examples: readonly string[] | null, requested: string | null }} input
 *   examples: the example directories, or null when there is no examples/
 *   requested: SITE_EXAMPLE, or null
 * @returns {SiteLayout}
 */
export function siteLayout({ examples, requested }) {
    if (examples === null) {
        // (1) A site has one design; naming an example there is a mistake.
        if (requested !== null) {
            throw new ProjectError(`SITE_EXAMPLE=${requested} is set, but this is a site, not the template: there is no examples/ directory.`);
        }

        return { example: null, srcDir: 'src', publicDir: 'public', fixturesDir: 'api-fixtures', tsconfig: null };
    }

    // (2) The template with no examples cannot build anything.
    if (examples.length === 0) {
        throw new ProjectError('examples/ holds no example (a directory with an example.json).');
    }

    const example = requested ?? (examples.includes(DEFAULT_EXAMPLE) ? DEFAULT_EXAMPLE : examples[0]);

    // (3) A typo names an example that is not there.
    if (!examples.includes(example)) {
        throw new ProjectError(`there is no example '${example}'; the examples are: ${examples.join(', ')}.`);
    }

    const base = `examples/${example}`;

    return {
        example,
        srcDir: `${base}/src`,
        publicDir: `${base}/public`,
        fixturesDir: `${base}/api-fixtures`,
        tsconfig: `${base}/tsconfig.json`,
    };
}
