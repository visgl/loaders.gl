// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Starts the shared browser module worker for JSON, JSONTable, and NDJSON. */
export function loadJSONWorker(): Worker | null {
  if (typeof Worker !== 'undefined') {
    return new Worker(new URL('./workers/json-worker.js', import.meta.url), {type: 'module'});
  }
  return null;
}
