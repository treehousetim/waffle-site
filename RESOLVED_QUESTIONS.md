# Resolved questions

Questions moved out of `OPEN-QUESTIONS.md` once answered, kept for the reasoning.
Each starts with where it was settled. Newest moves at the top.

---

## Does the site need PHP?

**Resolved when the template was made (2026-10-15):** no. Pages are built ahead of time, so production serves files; the one thing that needs a server, forwarding forms to the waffle app with a secret, is done by Caddy's reverse proxy. The build is Node, which the frontend needed anyway. Anything that stores, sends or decides belongs in the waffle app. AGENTS.md §2 and §6.

## How is content managed?

**Resolved when the template was made (2026-10-15):** blog posts are Markdown with a single template and a strict schema; every other page is an `.astro` file written by hand or by an agent, on shared layouts and components, with the business's facts in `src/site.ts` and `src/data/`. There is no content manifest: the file tree is the site, and the sitemap and the E2E artifact are the generated inventory. A git-based CMS can be added later for non-technical editors. AGENTS.md §4.

## Where do secrets live?

**Resolved by the template:** Doppler, and only Doppler, with one config, `prod`, read by the server; GitHub Actions holds no secret. There is no `.env` file anywhere. AGENTS.md §8.

## How is the site deployed?

**Resolved by the template:** GitHub Actions on `release: published` builds the production site and attaches it to the release; the server pulls it on a timer, unpacks it into `releases/vN/`, and `deploy/deploy.sh` switches `current` to it atomically and proves it is served over HTTPS. Nothing is cloned or built on the server, and CI cannot reach it. AGENTS.md §9, docs/pull-based-deployments.md.
