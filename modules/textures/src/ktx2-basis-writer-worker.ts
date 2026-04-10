// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Classic-worker entrypoint that lazily loads the ESM worker implementation.
import(new URL('./workers/ktx2-basis-writer-worker.js', import.meta.url).toString());
