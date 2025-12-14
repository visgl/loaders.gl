// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Classic-worker entrypoint that lazily loads the ESM worker implementation.
// This keeps `importScripts` available in the worker (used by library loading).
(async () => {
  await import(new URL('./workers/basis-worker.js', import.meta.url).toString());
})();
