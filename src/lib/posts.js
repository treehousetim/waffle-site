/**
 * The blog's rules: which posts are visible, in what order, and how tags
 * become URLs. Pages pass in the collection's entries; nothing here imports
 * astro:content, so it is testable on its own (docs/blog.md).
 */

/**
 * Posts to show, newest first. Drafts are shown only when asked for (a
 * development build), and a post dated in the future is not shown in
 * production until a build runs on or after its date.
 *
 * @template {{ id: string, data: { pubDate: Date, draft: boolean } }} P
 * @param {readonly P[]} posts
 * @param {{ includeDrafts: boolean, now: Date }} options
 * @returns {P[]}
 */
export function visiblePosts(posts, { includeDrafts, now }) {
    return posts
        .filter((post) => includeDrafts || (!post.data.draft && post.data.pubDate <= now))
        .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime() || a.id.localeCompare(b.id));
}

/**
 * The URL segment for a tag: lowercase, words joined by hyphens.
 *
 * @param {string} tag
 */
export function tagSlug(tag) {
    return tag
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Every tag in use, with how many posts carry it, most used first. Two
 * spellings that make the same slug are one tag, named as first seen.
 *
 * @param {readonly { data: { tags: readonly string[] } }[]} posts
 * @returns {{ tag: string, slug: string, count: number }[]}
 */
export function tagIndex(posts) {
    /** @type {Map<string, { tag: string, slug: string, count: number }>} */
    const tags = new Map();

    for (const post of posts) {
        /** @type {Set<string>} */
        const counted = new Set();

        for (const tag of post.data.tags) {
            const slug = tagSlug(tag);

            if (counted.has(slug)) {
                continue;
            }

            counted.add(slug);
            const existing = tags.get(slug);

            if (existing === undefined) {
                tags.set(slug, { tag, slug, count: 1 });
            } else {
                existing.count += 1;
            }
        }
    }

    return [...tags.values()].sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

/**
 * @template {{ data: { tags: readonly string[] } }} P
 * @param {readonly P[]} posts
 * @param {string} slug
 * @returns {P[]}
 */
export function postsTagged(posts, slug) {
    return posts.filter((post) => post.data.tags.some((tag) => tagSlug(tag) === slug));
}

/**
 * Minutes to read, at 230 words a minute, never less than one.
 *
 * @param {string} text  the post's Markdown source
 */
export function readingMinutes(text) {
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    return Math.max(1, Math.round(words / 230));
}
