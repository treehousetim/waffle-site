# Resolved questions

Questions moved out of `OPEN-QUESTIONS.md` once answered, kept for the reasoning.
Each starts with where it was settled. Newest moves at the top.

---

## Does the site need PHP?

**Resolved when the template was made (2026-10-15):** no. Pages are built ahead of time, so production serves files; the one thing that needs a server, forwarding forms to the waffle app with a secret, is done by Caddy's reverse proxy. The build is Node, which the frontend needed anyway. Anything that stores, sends or decides belongs in the waffle app. AGENTS.md §2 and §6.

## How is content managed?

**Resolved when the template was made (2026-10-15):** blog posts are Markdown with a single template and a strict schema; every other page is an `.astro` file written by hand or by an agent, on shared layouts and components, with the business's facts in `src/site.ts` and `src/data/`. There is no content manifest: the file tree is the site, and the sitemap and the E2E artifact are the generated inventory. A git-based CMS can be added later for non-technical editors. AGENTS.md §4.

## Where do secrets live?

**Resolved by the template:** Doppler, and only Doppler, with two configs named for who reads them and inheriting nothing: `prod-serve` (the server: `WAFFLE_SITE_KEY`) and `prod-deploy` (GitHub Actions: the deploy credentials). There is no `.env` file anywhere. AGENTS.md §8.

## How is the site deployed?

**Resolved by the template:** GitHub Actions on `release: published`, gated by a `v*` tag rule on the `prod` environment, builds the production site on the runner and rsyncs it to `releases/vN/` on the server, where `deploy/deploy.sh` switches `current` to it atomically and proves it is served over HTTPS. Nothing is cloned or built on the server. AGENTS.md §9.
