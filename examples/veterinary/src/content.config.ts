/**
 * The blog: the one place Markdown is used (docs/blog.md).
 *
 * Every post's front matter is checked against this schema when the site
 * builds. A misspelled or unknown field, a description too long for a search
 * result, or a cover image without alt text fails the build with the file and
 * the field named.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
    // src/content/blog/<slug>.md -> /blog/<slug>/. The file name is the URL.
    // Relative to this file, so it works wherever the site's src/ is.
    loader: glob({ base: new URL('./content/blog/', import.meta.url), pattern: '**/*.md' }),
    schema: ({ image }) =>
        z
            .strictObject({
                // Short enough that " — <site name>" still fits a search result (docs/blog.md).
                title: z.string().trim().min(10).max(55),
                description: z.string().trim().min(50).max(160),
                pubDate: z.coerce.date(),
                updatedDate: z.coerce.date().optional(),
                author: z.string().trim().min(1).optional(),
                tags: z.array(z.string().trim().min(2).max(30)).max(5).default([]),
                cover: image().optional(),
                coverAlt: z.string().trim().min(1).optional(),
                draft: z.boolean().default(false),
            })
            .refine((post) => post.cover === undefined || post.coverAlt !== undefined, {
                message: 'coverAlt is required when cover is set: it is the image description screen readers and search engines read.',
                path: ['coverAlt'],
            })
            .refine((post) => post.updatedDate === undefined || post.updatedDate >= post.pubDate, {
                message: 'updatedDate cannot be before pubDate.',
                path: ['updatedDate'],
            }),
});

export const collections = { blog };
