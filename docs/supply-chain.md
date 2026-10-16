# Supply chain: npm

The attack this defends against: a package maintainer's account is taken over
and a poisoned version of a popular package is published. It does its damage
two ways: an **install script** that steals tokens and keys from whatever
machine installs it, and **code in the bundle** that runs in visitors'
browsers. Poisoned versions are usually caught and pulled within days, so the
defence is to never be early, and to give anything that slips through nothing
to reach.

## The layers

1. **Nothing younger than a week.** `./tools/npm.sh` is the only way npm is
   run, and every command that resolves versions (`install`, `update`, `add`
   and their aliases) gets `--before=<7 days ago>`. `NPM_COOLDOWN_DAYS`
   changes the window; `0` turns it off, loudly, for a fix you cannot wait for.
2. **No install scripts.** `.npmrc` sets `ignore-scripts=true`, and
   `tools/npm.sh` sets it again in the environment. None of the dependencies
   needs one: sharp and esbuild ship their native parts as ordinary
   per-platform packages. `npm run build` still runs; naming a script is not
   an install script.
3. **npm runs in a throwaway container.** `node:26`, as your user, with only
   the repository mounted: no home directory, so no `~/.ssh`, no tokens, no
   browser data. `node_modules` lives in a Docker volume
   (`<slug>_node_modules`), never on your disk. The test suite uses the same
   image and the same volume.
4. **The lockfile is the install.** CI runs `npm ci`, which installs exactly
   the locked versions and checks each against its recorded hash, and loads no
   secret until the build has finished.
5. **Tampering is checked.** CI runs `npm audit signatures` after `npm ci`.
6. **The browser contains the rest.** The content security policy
   (docs/https.md) allows scripts only from the site and connections only to
   the site, so code smuggled into the bundle can neither load more code nor
   send data anywhere else.
7. **Production runs no Node at all.** The server serves built files; a
   compromised build dependency can only reach visitors through the bundle,
   which layer 6 contains.

Editors that read `node_modules` for types will not find it on disk. That is
the price of layer 3.

## Using it

```bash
./tools/npm.sh ci                  # install exactly what the lockfile says
./tools/npm.sh run build           # check, build into dist/, audit
./tools/npm.sh run dev             # dev server on http://localhost:4321
./tools/npm.sh update              # newer versions, a week old or more
./tools/npm.sh install some-pkg    # a new dependency, a week old or more
NPM_COOLDOWN_DAYS=0 ./tools/npm.sh install some-pkg@1.2.4   # an urgent fix
```

Adding a dependency still needs approval under AGENTS.md §2.

## Failure list

Each has a test in `tests/infra/npm.test.js`, which runs the script against a
stand-in `docker`.

1. A version published in the last few days enters the lockfile through
   `install` or `update`.
2. A package's install script runs.
3. Code from a package can read the developer's SSH keys, tokens or browser
   data.
4. npm is run directly, bypassing all of the above, because a document or a
   script says to.
5. An urgent fix newer than the window cannot be installed at all.
6. A tarball altered after publishing goes unnoticed.
7. CI installs anything but exactly the lockfile.
8. Files the container writes end up owned by root on Linux.
9. `node_modules` is shared between the container and the machine, and the
   native binaries are for the wrong platform.
10. The dev server cannot be reached from the browser, or cannot reach the
    waffle app.
11. The window is set to something that is not a number of days, and is
    silently ignored.
12. The script runs in a native Windows shell, where nothing behaves as
    expected.
