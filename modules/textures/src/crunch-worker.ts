// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Classic-worker entrypoint that lazily loads the ESM worker implementation.
void import(new URL('./workers/crunch-worker.js', import.meta.url).toString());
