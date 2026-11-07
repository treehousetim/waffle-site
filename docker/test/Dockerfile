# The suite's image: node:26, the image tools/npm.sh runs, plus jq, which the
# server's poller (deploy/pull.sh) uses and tests/infra/pull.test.js runs for
# real. Built by tools/test.sh, which tags it <slug>_test.
FROM node:26
RUN apt-get update \
 && apt-get install -y --no-install-recommends jq \
 && rm -rf /var/lib/apt/lists/*
