#!/bin/bash
set -e

# The integrated examples import this worker by module-relative URL. Build it
# before starting Docusaurus so a fresh checkout does not crash at compile time.
(cd ../modules/parquet && ../../node_modules/.bin/esbuild src/workers/parquet-source-worker.ts \
  --outfile=dist/parquet-source-worker.js \
  --target=esnext --platform=browser --bundle --sourcemap \
  --inject:src/polyfills/process.ts --banner:js='var global=globalThis;' \
  --define:__VERSION__=\"$npm_package_version\")

exec docusaurus start "$@"
