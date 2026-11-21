// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Starts the shared browser module worker for JSON, JSONTable, and NDJSON. */
export function loadJSONWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    const moduleUrl = import.meta.url;
    // Native browser workers cannot use the page's import map.
    if (moduleUrl && new URL(moduleUrl).pathname.endsWith('/dist/json/load-json-worker.js')) {
      const workerUrl = new URL('../json-worker.js', moduleUrl);
      return new Worker(workerUrl, {type: 'module'});
    }
    return new Worker(new URL('./workers/json-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}
