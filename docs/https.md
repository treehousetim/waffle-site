# HTTPS and the web server

Caddy is the whole server: it serves the built site as files, forwards
`/api/site/*` to the waffle app, and gets and renews its own Let's Encrypt
certificate. One file, `docker/caddy/Caddyfile`, serves locally and in
production.

## Two modes, one file

`SITE_ADDRESS` decides:

- **Locally** `docker-compose.yml` sets `:80`: plain HTTP on
  `http://localhost:8090`, no certificate, serving `dist/`.
- **In production** `docker-compose.prod.yml` sets the hostname. Caddy asks
  Let's Encrypt for a certificate on the first start, renews it on its own,
  and redirects HTTP to HTTPS.

`SITE_ROOT` is the directory served: `dist/` locally, `current` (the release
`deploy.sh` switched to) in production.

## What it does, in order

1. Refuses every dotfile with 404, except `.well-known/`.
2. Refuses a `/api/site/*` request a browser says came from another site
   (`Sec-Fetch-Site: cross-site` or `same-site`) with 403.
3. Forwards `/api/site/*` to `WAFFLE_APP_URL`, adding `X-Site-Key` and
   `X-Forwarded-Host`, and dropping the visitor's `Cookie`, `Authorization`,
   `Origin`, `Referer` and `Sec-Fetch-*` headers on the way in and any
   `Set-Cookie` on the way out. Never cached.
4. Serves `/_astro/*`, whose names are content hashes, cached for a year.
5. Serves everything else from the build, revalidated on every load, so a
   release is visible straight away. `/pricing` redirects to `/pricing/`.
6. Answers anything not in the build with the site's own `404.html` and a real
   404 status.

Every response, error pages included, carries the security headers: HSTS,
`nosniff`, a referrer policy, a permissions policy, and a content security
policy that allows scripts, styles, fonts and connections from this site only
and nothing inline. The build emits nothing inline and the SEO audit fails a
page that does, so the policy never silently breaks a page.

## DNS

Caddy can only get a certificate for a hostname whose DNS leads to the server.
`deploy/check-dns.sh` checks before anything starts, asking a public resolver:

```bash
bash /opt/waffle_site/deploy/check-dns.sh waffle-site.example.com
```

Behind a proxy such as Cloudflare, whose addresses are not the droplet's,
deploy with `SKIP_DNS_CHECK=1`.

## The certificate store

The certificates live in the `caddy_data` Docker volume, never in the tree
(the release rsync would delete them). **Never `docker compose down -v` on the
server**: a wiped store means a new certificate on every deploy, until Let's
Encrypt's rate limit locks the hostname out for days.

## Failure lists

### The Caddyfile and Compose files

Each has a test in `tests/infra/caddyfile.test.js`; `tools/test.sh` also has
Caddy validate the file.

1. A security header is missing, or overwritten by the waffle app's response.
2. The content security policy allows inline script, `eval`, or another
   origin.
3. The rules run in an order where a later one serves what an earlier one
   should have refused.
4. A dotfile is served.
5. A form posted from another site reaches the waffle app.
6. The visitor's session cookie or origin reaches the app, or the app's
   cookie reaches the visitor; the site key is not sent.
7. Hashed assets are not cached, or pages are cached so a release is not seen.
8. A missing page returns 200, or Caddy's bare error text.
9. A large request body reaches the app.
10. Local and production disagree: the wrong port, the wrong directory, a
    missing key that should stop Compose.
11. The certificate store is somewhere the release rsync can delete.

### deploy/check-dns.sh

Each has a test in `tests/infra/deploy.test.js`.

1. The hostname has no A record.
2. An A record points somewhere else.
3. An AAAA record points at an address the server does not have, and Let's
   Encrypt, which tries IPv6 first, fails.
4. A reserved IP, on no interface, is reported as wrong.
5. The answer comes from this machine's hosts file or cache, not public DNS.
6. `dig` is missing, and finding nothing to compare passes as success.
