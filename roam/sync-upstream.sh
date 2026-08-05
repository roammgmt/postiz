#!/usr/bin/env bash
# Outpost · Social — sync this fork with upstream Postiz.
# Pins to a RELEASE TAG (not main). Usage:
#   roam/sync-upstream.sh v1.x.y
# Then run Postiz's Prisma migrations and smoke-test one publish.
set -euo pipefail

TAG="${1:-}"
if [ -z "$TAG" ]; then
  echo "usage: roam/sync-upstream.sh <upstream-release-tag>" >&2
  echo "available tags:" >&2
  git ls-remote --tags https://github.com/gitroomhq/postiz-app | awk -F/ '{print $NF}' | grep -v '\^{}' | tail -20 >&2
  exit 1
fi

# Add the upstream remote once.
if ! git remote get-url upstream >/dev/null 2>&1; then
  git remote add upstream https://github.com/gitroomhq/postiz-app
fi

git fetch upstream --tags

echo "Merging upstream ${TAG} into $(git branch --show-current)…"
git merge --no-ff "${TAG}" -m "roam: merge upstream ${TAG}"

cat <<'NEXT'

Merged. Next:
  1. Reapply/verify the roam/ overlay wiring if any upstream file changed under it.
  2. Run Prisma migrations (see root package.json: prisma-db-push).
  3. Rebuild the reskin image, redeploy, smoke-test one publish.
A conflict inside roam/ is trivial; a conflict deep in a component means a ROAM
edit wasn't additive — reconsider it.
NEXT
