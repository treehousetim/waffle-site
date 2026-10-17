# Waffle Site

An SEO-first marketing site and blog for a business whose app runs on [Waffle](https://github.com/treehousetim/waffle).

## What this is, and who it's for

[Waffle](https://github.com/treehousetim/waffle) is a starting point for the app a business runs on. Waffle Site is the website in front of it: the pages customers find in search results, the blog that brings them there, and the quote form that hands them to the app.

It is built the way Waffle is, for people with some engineering skill who work with an AI coding agent: you bring the business and the judgement, the agent writes the pages, and the guard rails here keep the result fast, findable and safe to publish.

- **Instructions the agent follows.** [AGENTS.md](AGENTS.md) fixes the stack, the structure and the rules, and tells an agent how to start: name the site, interview you, replace the example business, then rewrite the pages one at a time.
- **A build that refuses bad pages.** Every build ends with an SEO audit of the HTML that ships: one heading per page, unique titles and descriptions, working links, alt text, valid structured data, nothing the security policy would block. A page that breaks a rule fails the build, the release and the deploy.
- **Previews that cannot leak into search results.** Only a production build is indexable.
- **Tests the agent has to pass.** The logic is held to 100% coverage, every script is tested against stand-ins, and an end-to-end test builds the whole site twice and leaves a repeatable artifact.
- **Scripts instead of procedures.** Setup, releases and the GitHub side of deploys are single commands with their checks built in.
- **Safe defaults for going live.** Static files behind Caddy with automatic HTTPS and a strict content security policy, one secret kept in Doppler, new package releases held back a week, and releases that switch atomically and roll back instantly.

**Read what the agent writes.** AI makes confident mistakes, about code and about facts. Never publish a phone number, address, licence, price or review it made up.

**Status: early preview.** Not yet released.

The stack: Astro 7 building static pages, Markdown for the blog only, Caddy 2.11 serving files and forwarding `/api/site/*` to the waffle app, Docker Compose, Doppler for the one secret, one server deployed by GitHub Actions. There is no application server, database or PHP in production.

Nine example sites ship with it, each a complete, working site for a fictional business with its own design, logo, motion, photographs and blog: an electrician, a mobile auto detailer, a wedding photographer, a dental practice, a bakery, a yoga studio, a brewery, a veterinary clinic and a law firm. Setup installs the one you choose as your site's own code, and your agent reshapes it for your business ([docs/examples.md](docs/examples.md)). The photographs are free Unsplash photos you replace with your own.

## Documentation

| Document | Read it when | What it covers |
| --- | --- | --- |
| [AGENTS.md](AGENTS.md) | Before changing anything | The rulebook: stack, layout, content rules, layering, testing, secrets, the release flow. |
| [docs/create-project.md](docs/create-project.md) | Starting a site from the template | `tools/setup.sh`: the four names it asks for, what the rename touches, its failure list. |
| [docs/design.md](docs/design.md) | Changing how anything looks, or replacing the photos | The design principles, the tokens, the photo pipeline and its licence, and the audit the design came from. |
| [docs/pages.md](docs/pages.md) | Adding or changing a page | Pages as `.astro` files, the components, service and town pages, removing a page. |
| [docs/blog.md](docs/blog.md) | Writing a post | The front matter, its rules, writing posts that get found, what the blog builds. |
| [docs/seo.md](docs/seo.md) | A build fails the audit, or before launch | What every page gets, local business details, preview builds, the audit's rules. |
| [docs/building.md](docs/building.md) | Building locally, or a build refuses its settings | The dev server, the build, the build settings and their failure list. |
| [docs/waffle-api.md](docs/waffle-api.md) | Showing app data on a page, or building the app side | Build-time reads, the `/api/site` proxy, the contract the waffle app implements, the failure list. |
| [docs/forms.md](docs/forms.md) | Adding or changing a form | How a submission travels, the honeypot, what the app sends back. |
| [docs/https.md](docs/https.md) | Launching on your hostname, or HTTPS is not coming up | The Caddyfile, DNS, the certificate store, and their failure lists. |
| [docs/fresh-install.md](docs/fresh-install.md) | Putting it on a server for the first time | From nothing to production: Doppler, the droplet, GitHub, the waffle app, the first release. |
| [docs/releasing.md](docs/releasing.md) | Cutting a release, or rolling one back | `./tools/release.sh`, the pipeline, `deploy.sh`, rollback, their failure lists. |
| [docs/examples.md](docs/examples.md) | Choosing a starting point, or adding one | The example sites, one per kind of business, each its own design: what is shared, the contract every example meets, motion, how to add one. |
| [docs/supply-chain.md](docs/supply-chain.md) | Adding or updating a package | npm in a container, no install scripts, the week-long cooldown, signature checks. |
| [docs/README.md](docs/README.md) | Adding a document | Where documents go and how they are indexed. |
| [CHANGELOG.md](CHANGELOG.md) | Cutting a release, or catching up | What changed, and what is waiting under `[Unreleased]`. |
| [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md) | The brief is silent on something | Decisions not yet made. Answered ones move to [RESOLVED_QUESTIONS.md](RESOLVED_QUESTIONS.md). |

## Making it yours

Make your own repository from the template, then answer four questions:

```bash
gh repo create acme-site --template treehousetim/waffle-site --private --clone
cd acme-site && ./tools/setup.sh
```

`tools/setup.sh` checks your machine for Docker, Compose, git, Doppler and `gh`, asks which **example site** to start from, then for a **slug**, a **display name**, the **site's hostname** and the **waffle app's hostname** (suggesting each), renames the project, and offers the first commit. Every answer has a flag (`./tools/setup.sh --help`). [docs/create-project.md](docs/create-project.md) has the details.

**Platforms:** macOS (the stock bash 3.2 is fine), Linux, and Windows inside WSL2.

## First run

```bash
./tools/npm.sh ci            # install exactly the lockfile, in a container
./tools/npm.sh run dev       # http://localhost:4321, rebuilds as you edit
```

Node need not be installed: npm runs in a throwaway container with only the repository mounted ([docs/supply-chain.md](docs/supply-chain.md)). The dev server reads the waffle app's data from `api-fixtures/`, so the app does not need to be running.

To see the built site the way production serves it:

```bash
./tools/npm.sh run build     # type check, build into dist/, SEO audit
docker compose up -d         # http://localhost:8090, behind the real Caddyfile
```

## Tests

`./tools/test.sh` is the **only** supported way to run the suite.

```bash
./tools/test.sh                  # everything
./tools/test.sh --coverage       # everything, src/core/lib held to 100% — the gate
./tools/test.sh --changed        # only the groups your edits touch
./tools/test.sh --group=e2e      # one group: unit, infra or e2e
```

The end-to-end test writes its artifact to `coverage/e2e/site-build.json`.

## Services to sign up for

| Service | What it is for | Cost |
| --- | --- | --- |
| [GitHub](https://github.com) | The repository, and GitHub Actions, which builds and deploys every release through a `prod` environment. | Free within the Actions allowance. |
| [DigitalOcean](https://www.digitalocean.com) | The one droplet the site runs on. The smallest is plenty for static files. | From a few dollars a month. |
| [Doppler](https://www.doppler.com) | The only source of secrets: `prod-serve` for the server, `prod-deploy` for GitHub Actions. | Free Developer plan. |
| A domain registrar | The site's hostname. | A domain a year. |

Optional: a heartbeat monitor such as [healthchecks.io](https://healthchecks.io) (`HEARTBEAT_URL`), and a Slack webhook for failed deploys (`DEPLOY_ALERT_WEBHOOK`). [docs/fresh-install.md](docs/fresh-install.md) walks through all of it.

## Ports

| Service | URL | Override |
|---|---|---|
| Dev server | http://localhost:4321 | |
| Caddy (the built site) | http://localhost:8090 | `HTTP_PORT` |
| A waffle app, for `/api/site` | http://localhost:8080 (Waffle's default) | `WAFFLE_APP_URL` |

## License

[MIT](LICENSE), for the code and the text. The example photographs in each example's `src/assets/photos/` are from [Unsplash](https://unsplash.com/), under the [Unsplash License](https://unsplash.com/license), and credited on each example's `/credits/` page; the typefaces in each example's `src/assets/fonts/` are under the SIL Open Font License, with the licence beside them. Neither is covered by the MIT licence. A site started from [Waffle Site](https://github.com/treehousetim/waffle-site) is yours to license however you like; keep the `LICENSE` file's notice with any substantial part of treehousetim/waffle-site you redistribute.
