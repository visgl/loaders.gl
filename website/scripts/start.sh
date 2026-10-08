#!/bin/bash
set -e

# Build the local I3S worker before the bundler resolves its asset URL.
(
  cd ..
  npm run --silent build-worker --prefix modules/i3s -- --log-level=error
)

exec docusaurus start "$@"
