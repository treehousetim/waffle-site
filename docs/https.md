# HTTPS and the web server

Caddy is the whole server: it serves the built site as files and forwards
`/api/site/*` to the waffle app. One file, `docker/caddy/Caddyfile`, serves
locally and in production, always over plain HTTP. In production the server's
front Caddy sits in front of it (Waffle's `deploy/edge/`, and
[Waffle's docs/edge.md](https://github.com/treehousetim/waffle/blob/main/docs/edge.md)): it owns ports 80 and 443, gets and renews every hostname's
Let's Encrypt certificate, redirects HTTP to HTTPS, and forwards
`waffle-site.example.com` to this Caddy over the `edge` Docker network, with the
visitor's address in `X-Forwarded-For`.

## Two modes, one file

`SITE_ADDRESS` decides:

- **Locally** `docker-compose.yml` sets `:80`: plain HTTP on
  `http://localhost:8090`, no certificate, serving `dist/`.
- **In production** `docker-compose.prod.yml` sets the hostname: that
  hostname only, still plain HTTP, no public port. It trusts forwarded
  addresses only from private networks, so the visitor's address it passes to
  the app (`X-Visitor-Address`) is the visitor's, not the front Caddy's.

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

The front Caddy can only get a certificate for a hostname whose DNS leads to
the server.
`deploy/check-dns.sh` checks before anything starts, asking a public resolver:

```bash
bash /opt/waffle_site/current/deploy/check-dns.sh waffle-site.example.com
```

Behind a proxy such as Cloudflare, whose addresses are not the droplet's,
deploy with `SKIP_DNS_CHECK=1`.

## The certificate store

The certificates are the front Caddy's, in its `edge_data` volume in
`/opt/edge`. **Never `docker compose down -v` there**: a wiped store means new
certificates for every hostname on the server, until Let's Encrypt's rate
limit locks them out for days.

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
11. This Caddy publishes a port, or asks for a certificate, and fights the
    front Caddy for 80 and 443; or a visitor's forged address reaches the app
    (Waffle's docs/edge.md, 1 to 3).

### deploy/check-dns.sh

Each has a test in `tests/infra/deploy.test.js`.

1. The hostname has no A record.
2. An A record points somewhere else.
3. An AAAA record points at an address the server does not have, and Let's
   Encrypt, which tries IPv6 first, fails.
4. A reserved IP, on no interface, is reported as wrong.
5. The answer comes from this machine's hosts file or cache, not public DNS.
6. `dig` is missing, and finding nothing to compare passes as success.
