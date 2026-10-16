# The blog

Blog posts are the only Markdown on the site: one file per post in
`src/content/blog/`, all rendered by one template, `src/layouts/BlogPost.astro`.
The file name is the URL: `src/content/blog/knob-and-tube-wiring.md` is
`/blog/knob-and-tube-wiring/`.

## A new post

```markdown
---
title: Why your breaker keeps tripping
description: A tripping breaker is protecting your wiring. How to tell an overloaded circuit from a short or a ground fault, and when to call.
pubDate: 2026-10-08
author: Marcus Bell
tags: [Safety, Troubleshooting]
cover: ../../assets/photos/breaker-panel.jpg
coverAlt: An open panel with one breaker in the tripped position.
---

The opening paragraph: the answer, in two sentences.

## A heading

...
```

| Field | Rules |
| --- | --- |
| `title` | 10-55 characters, so the site name still fits after it in results. |
| `description` | 50-160 characters, unique: it is what search results show. |
| `pubDate` | The publication date. A post dated in the future is not published until a build runs on or after it. |
| `updatedDate` | Optional; not before `pubDate`. Shown on the post and in its structured data. |
| `author` | Optional; `site.blog.defaultAuthor` otherwise. |
| `tags` | Up to five. Each becomes a topic page at `/blog/tags/<tag>/`; "EV charging" and "ev charging" are one tag. |
| `cover` | Optional, a path to an image in `src/assets/`. It is resized, converted to WebP and given a width and height by the build. Also the post's link preview. |
| `coverAlt` | Required when `cover` is set. |
| `draft` | `true` shows the post in development builds, labelled Draft, and keeps it out of production, the sitemap and the feed. |

Any other field fails the build: a misspelled `descripton` is caught, not
ignored. Values containing `: ` must be quoted.

## Writing posts that get found

- **Answer one question per post**, the way a customer would ask it. The title
  is that question or its answer.
- **Put the answer first.** The opening paragraph is what people read before
  deciding to stay.
- **Use `##` headings**, never `#`: the template renders the title as the
  page's only `<h1>`.
- **Link to the service the post is about** (`[panel upgrades](/services/panel-upgrades/)`),
  and to other posts. The audit fails a link to a page that does not exist.
- **Keep it true and local.** Local codes, local permits, the housing you
  actually work on.

## What the blog builds

- `/blog/`, then `/blog/2/` and on: ten posts a page, newest first, each page
  with its own title.
- `/blog/<slug>/` for every post, with `BlogPosting` and breadcrumb structured
  data, `article:` Open Graph tags, and reading time.
- `/blog/tags/<tag>/` for every tag in use.
- `/blog/rss.xml`, the feed, linked from every page's `<head>`.

The rules for which posts show and in what order are in `src/core/lib/posts.js`,
tested in `tests/unit/posts.test.js`.
