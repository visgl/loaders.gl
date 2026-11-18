#!/bin/bash
set -e

# Build the local worker bundles used by the website examples.
(
  cd ..
  # Source imports reference the generated ESM decoder assets, even without a package build.
  (cd modules/scene && node ../../scripts/build-library-modules.mjs scene)
  npm run --silent build-source-worker-parquet --prefix modules/tables -- --log-level=error
  npm run --silent i3s-build-worker --prefix modules/tiles-3d -- --log-level=error
)
