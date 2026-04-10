// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Classic-worker entrypoint that lazily loads the ESM worker implementation.
import(new URL('./workers/compressed-texture-worker.js', import.meta.url).toString());
