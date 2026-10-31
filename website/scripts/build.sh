#!/bin/bash
set -e

node scripts/validate-token.js

# Build the local worker bundles used by the website examples.
(
  cd ..
  # Source imports reference the generated ESM decoder assets, even without a package build.
  (cd modules/scene && node ../../scripts/build-library-modules.mjs scene)
  npm run --silent build-source-worker-parquet --prefix modules/tables -- --log-level=error
  npm run --silent i3s-build-worker --prefix modules/tiles-3d -- --log-level=error
)

# staging or prod
MODE=$1
WEBSITE_DIR=`pwd`
OUTPUT_DIR=build

# Docusaurus' HTML minifier reports known, non-fatal diagnostics for generated
# documentation markup. Rendering failures still fail the build.
export DOCUSAURUS_IGNORE_SSG_WARNINGS=true
export DOCUSAURUS_NO_PERSISTENT_CACHE=1
export NO_UPDATE_NOTIFIER=1

# clean up cache
# docusaurus clear

case $MODE in
  "prod")
    docusaurus build
    ;;
  "staging")
    STAGING=true docusaurus build
    ;;
esac

node scripts/normalize-llm-output.mjs
node scripts/check-llm-output.mjs

# Development-only source-worker replacements must never enter production output.
if rg -q 'new URL[^\n]*parquet-source-worker\.ts|parquet-source-worker-factory\.dev' "$OUTPUT_DIR" \
  -g '*.js' -g '*.map' -g '*.json'; then
  echo 'Development Parquet worker source leaked into website production output.' >&2
  exit 1
fi

# # transpile workers
# (
#   cd ..
#   BABEL_ENV=es5 npx babel ./website/static/workers --out-dir ./website/$OUTPUT_DIR/workers
# )

# # build gallery (scripting) examples
# (
#   cd ../examples/gallery
#   yarn
#   yarn build
# )
# mkdir $OUTPUT_DIR/gallery
# cp -r ../examples/gallery/dist/* $OUTPUT_DIR/gallery/
