#!/bin/bash
set -e

# Build the local I3S worker before the bundler resolves its asset URL.
(
  cd ..
  npm run --silent i3s-build-worker --prefix modules/tiles-3d -- --log-level=error
)

exec docusaurus start "$@"
