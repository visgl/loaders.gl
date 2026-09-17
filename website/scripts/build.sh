#!/bin/bash
set -e

node scripts/validate-token.js

# Build the worker bundle imported by the cloud-native Parquet examples.
(
  cd ..
  npm run --silent build-source-worker --prefix modules/parquet -- --log-level=error
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
