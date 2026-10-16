// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// This explicit module entry lets browser bundlers discover the worker from the
// `new Worker(new URL(..., import.meta.url), {type: 'module'})` construction site.
// Re-exporting the marker retains the worker's setup even when the package declares
// that modules are side-effect free, because this file is the module-worker entrypoint.
export {TRIANGULATION_WORKER_LOADED} from './triangulation-worker';
