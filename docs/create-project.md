# Starting a site from the template

Two ways in, one setup script.

```bash
# A repository of your own, made from the template on GitHub:
gh repo create acme-site --template treehousetim/waffle-site --private --clone
cd acme-site && ./tools/setup.sh

# Or a plain copy, with a fresh history:
git clone --depth 1 https://github.com/treehousetim/waffle-site.git acme-site
cd acme-site && rm -rf .git && ./tools/setup.sh
```

## What setup asks

Four names, each suggested from the directory name (press enter to take it):

| Placeholder | Example answer | Where it ends up |
| --- | --- | --- |
| `waffle_site` (the slug) | `acme` | the Doppler project, `/opt/<slug>` on the server, the npm package and its volumes |
| `Waffle Site` (the name) | `Acme Electric` | every page title, the footer, the business details in `src/site.ts` |
| `waffle-site.example.com` (the site) | `www.acme.com` | Caddy's certificate, canonical URLs, the DNS check, the workflow's environment |
| `app.waffle-site.example.com` (the app) | `app.acme.com` | where `/api/site/*` goes, at build time and from the browser |

`tools/rename-project.sh` makes the change. It replaces the four placeholders
everywhere except `node_modules/`, `.git/`, `dist/` and `coverage/`, leaves
every line that mentions `treehousetim/waffle` alone (those point at the
templates themselves), sets `VERSION` to 0 and starts a fresh `CHANGELOG.md`
that records which template version the site came from.

Every answer is also a flag, for scripts and agents:

```bash
./tools/setup.sh --slug acme --name "Acme Electric" --host www.acme.com --app app.acme.com --yes
```

It is safe to run again: a site that is already named is not renamed.

## After setup

1. Replace `public/og-default.png` and `public/logo.png`: they still say
   Waffle Site.
2. Replace the example business in `src/site.ts`: phone, address, hours,
   licence. The 555-01xx numbers are reserved for fiction.
3. Fill in AGENTS.md §1, then rewrite the example pages and posts
   (docs/pages.md, docs/blog.md).

## Failure list

Each has a test in `tests/infra/setup.test.js`, which works on a copy.

1. A slug that would break a Doppler project, a directory or an npm package
   name is accepted.
2. A display name that would break the TypeScript, JSON or HTML it is written
   into is accepted.
3. A hostname that is not a plain DNS name is accepted.
4. The site and the app are given the same hostname, so each Caddy fights the
   other for the certificate.
5. A placeholder is left behind somewhere.
6. The app's hostname has to be typed even when it is the obvious one.
7. A line pointing at the template itself is rewritten, so the workflow tries
   to deploy from the wrong repository or links lead nowhere.
8. The site carries on the template's version and changelog.
9. A second run renames the renamed project.
10. A suggestion is not itself a valid answer.
11. The setup cannot be run by a script or an agent without a terminal.
12. Without a terminal, setup guesses names nobody chose.
13. A refused answer is swallowed and setup reports success.
14. Running setup again redoes finished work.
15. A clone of the template's own repository carries its history into the
    site.
16. Setup runs in a native Windows shell, where nothing behaves as expected.
