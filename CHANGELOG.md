# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
(a site started from it numbers its releases 1, 2, 3; docs/releasing.md).

Each release moves everything under `[Unreleased]` into its own section;
`./tools/release.sh` does it, and `tests/infra/release.test.js` fails until
the version in `VERSION` has one.

## [Unreleased]

### Added
- **The template**: an SEO-first marketing site and blog that fronts a [Waffle](https://github.com/treehousetim/waffle) app, built the same way: a fixed stack, a test-first method, guard rails that fail the build, and a one-server deploy by GitHub Actions.
- **Static pages from Astro 7.** Pages are `.astro` files written by hand or by an agent from a shared component library; blog posts are Markdown with a strictly checked schema. Production serves plain files, with no application server.
- **An SEO audit on the built HTML** (`tools/audit.mjs`, rules in `src/lib/audit.js`): one `<h1>`, unique titles and descriptions, canonical and Open Graph tags, alt text, working internal links, valid JSON-LD, nothing the content security policy would block, robots and sitemap that agree with the build. Errors fail the build, the release and the deploy.
- **Local business structured data**: `Electrician` (any LocalBusiness type) with address, hours, phone and the towns served on every page; `Service`, `FAQPage`, `BlogPosting` and breadcrumbs where they belong.
- **The waffle app, at build time and at run time** (docs/waffle-api.md): pages read `/api/site/*` while the site builds (fixtures in development and tests), and Caddy forwards `/api/site/*` from the browser to the app with a site key, stripping the visitor's cookies.
- **Preview builds can never be indexed**: anything but a production build is `noindex, nofollow` everywhere with a `Disallow: /` robots.txt, and the audit checks both.
- **Atomic releases with instant rollback**: every release lands in `releases/vN/` and `current` is switched by a rename; `deploy.sh` proves the new home page is being served over HTTPS, and switches back if it is not.
- **The example site**: a local electrician with 8 service pages, 6 town pages, a price guide from the API, reviews, an emergency page, an FAQ, a quote form and a 24-article blog.
- **Supply chain defences carried over from Waffle**: npm only through `tools/npm.sh`, in a container, install scripts off, nothing younger than a week; `npm audit signatures` in CI.
- **Tests**: `./tools/test.sh`, Node's test runner in a container; `src/lib` at 100% line, branch and function coverage; infra tests for every script, the Caddyfile and the workflow; an end-to-end test that builds the site twice and leaves a repeatable artifact.
