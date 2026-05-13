#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
WEBSITE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_DIR="$(cd "$WEBSITE_DIR/.." && pwd)"

DEPLOY_BRANCH="${DEPLOY_BRANCH:-gh-pages}"
PROD_SOURCE_BRANCH="${PROD_SOURCE_BRANCH:-4.4-release}"
PREVIEW_SOURCE_BRANCH="${PREVIEW_SOURCE_BRANCH:-master}"
PREVIEW_PATH="${PREVIEW_PATH:-preview/master}"
DOCUSAURUS_URL="${DOCUSAURUS_URL:-https://loaders.gl}"

CURRENT_BRANCH="${GITHUB_REF_NAME:-}"
if [ -z "$CURRENT_BRANCH" ]; then
  CURRENT_BRANCH="$(git -C "$REPO_DIR" branch --show-current)"
fi

case "$MODE" in
  "prod")
    if [ "$CURRENT_BRANCH" != "$PROD_SOURCE_BRANCH" ]; then
      echo "Refusing prod deploy from '$CURRENT_BRANCH'. Expected '$PROD_SOURCE_BRANCH'."
      exit 1
    fi
    BASE_URL="/"
    DESTINATION_PATH="."
    ;;
  "preview")
    if [ "$CURRENT_BRANCH" != "$PREVIEW_SOURCE_BRANCH" ]; then
      echo "Refusing preview deploy from '$CURRENT_BRANCH'. Expected '$PREVIEW_SOURCE_BRANCH'."
      exit 1
    fi
    if [[ "$PREVIEW_PATH" == "" || "$PREVIEW_PATH" == "." || "$PREVIEW_PATH" == "/" || "$PREVIEW_PATH" == *".."* ]]; then
      echo "Refusing unsafe PREVIEW_PATH '$PREVIEW_PATH'."
      exit 1
    fi
    if [[ ! "$PREVIEW_PATH" =~ ^[A-Za-z0-9._/-]+$ ]]; then
      echo "Refusing PREVIEW_PATH '$PREVIEW_PATH'. Use only letters, numbers, dots, dashes, underscores, and slashes."
      exit 1
    fi
    BASE_URL="/${PREVIEW_PATH%/}/"
    DESTINATION_PATH="$PREVIEW_PATH"
    ;;
  *)
    echo "Usage: $0 prod|preview"
    exit 1
    ;;
esac

echo "Building $MODE website with baseUrl=$BASE_URL"
(
  cd "$WEBSITE_DIR"
  DOCUSAURUS_URL="$DOCUSAURUS_URL" DOCUSAURUS_BASE_URL="$BASE_URL" yarn build
)

WORKTREE_DIR="$(mktemp -d)"
cleanup() {
  git -C "$REPO_DIR" worktree remove --force "$WORKTREE_DIR" >/dev/null 2>&1 || true
  rm -rf "$WORKTREE_DIR"
}
trap cleanup EXIT

if git -C "$REPO_DIR" ls-remote --exit-code --heads origin "$DEPLOY_BRANCH" >/dev/null 2>&1; then
  git -C "$REPO_DIR" fetch origin "$DEPLOY_BRANCH"
  git -C "$REPO_DIR" worktree add "$WORKTREE_DIR" "origin/$DEPLOY_BRANCH"
  git -C "$WORKTREE_DIR" checkout -B "$DEPLOY_BRANCH"
else
  git -C "$REPO_DIR" worktree add --detach "$WORKTREE_DIR"
  git -C "$WORKTREE_DIR" checkout --orphan "$DEPLOY_BRANCH"
  git -C "$WORKTREE_DIR" rm -rf . >/dev/null 2>&1 || true
fi

git -C "$WORKTREE_DIR" config user.name "${GIT_USER_NAME:-github-actions[bot]}"
git -C "$WORKTREE_DIR" config user.email "${GIT_USER_EMAIL:-41898282+github-actions[bot]@users.noreply.github.com}"

if [ "$MODE" = "prod" ]; then
  rsync -a --delete --exclude='.git/' --exclude='preview/' "$WEBSITE_DIR/build/" "$WORKTREE_DIR/"
else
  mkdir -p "$WORKTREE_DIR/$DESTINATION_PATH"
  rsync -a --delete "$WEBSITE_DIR/build/" "$WORKTREE_DIR/$DESTINATION_PATH/"
fi

if [ -z "$(git -C "$WORKTREE_DIR" status --short)" ]; then
  echo "No website changes to deploy."
  exit 0
fi

git -C "$WORKTREE_DIR" add -A
git -C "$WORKTREE_DIR" commit -m "Deploy $MODE website from ${CURRENT_BRANCH}@${GITHUB_SHA:-$(git -C "$REPO_DIR" rev-parse --short HEAD)}"
git -C "$WORKTREE_DIR" push origin "$DEPLOY_BRANCH"
