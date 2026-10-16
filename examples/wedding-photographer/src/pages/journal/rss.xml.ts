/** The journal's feed, at /journal/rss.xml (docs/blog.md). */
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../../site';
import { buildTime, settings } from '@core/settings';
import { visiblePosts } from '@core/lib/posts.js';

export const GET: APIRoute = async () => {
    const posts = visiblePosts(await getCollection('journal'), { includeDrafts: !settings.production, now: buildTime });

    return rss({
        title: `${site.name}: ${site.blog.title}`,
        description: site.blog.description,
        site: settings.siteUrl,
        items: posts.map((post) => ({
            title: post.data.title,
            description: post.data.description,
            pubDate: post.data.pubDate,
            link: `/journal/${post.id}/`,
            categories: post.data.tags,
        })),
        customData: `<language>${site.lang}</language>`,
    });
};
