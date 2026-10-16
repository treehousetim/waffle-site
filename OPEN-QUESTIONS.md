# Open questions

Sparse list. One line each where possible. When answered, move it to `RESOLVED_QUESTIONS.md` with a line saying where it was settled.

## Decisions the template made that you may want to change
- **The example business.** A Springfield electrician with example phone, address, licence, prices and reviews. Replace every one; never publish an invented fact (AGENTS.md §4).
- **Town pages.** Six example towns, each with its own page. Keep a page only where there is something true to say about that town (docs/pages.md).
- **No analytics.** The content security policy allows no third-party script. If you want analytics, choose a privacy-respecting one, decide where its script is served from, and change the policy deliberately.
- **No map embed.** Same reason. A static map image, or a link to the Google Business Profile, keeps the policy strict.
- **Light theme only, purple branding** (`src/styles/global.css`).
- **Ten posts a page** on the blog index.

## Needs a decision before production
- **The waffle side.** `GET /api/site/prices` and `POST /api/site/forms/quote` need building in the waffle app (docs/waffle-api.md). Build them as a slice, or as a Waffle Iron module other sites can reuse?
- **Rate limiting for forms.** The app should limit per `X-Forwarded-For`; decide the limits, and whether Caddy should limit too (it needs a plugin, so a custom image).
- **How often prices are republished.** Data is as fresh as the last build. Is a release per price change enough, or should a scheduled workflow rebuild nightly?
- **Same server or separate.** The site and the waffle app both want ports 80 and 443. Separate droplets is the default; one server would need a single Caddy in front of both.
- **Monitoring.** `HEARTBEAT_URL` is optional. Pick a service, or decide not to.
