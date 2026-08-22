// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Module-relative browser asset for selective Parquet source decoding. */
export const PARQUET_SOURCE_WORKER_URL = resolveParquetSourceWorkerUrl();

/** Resolves the generated worker when present and allows source-only builds to override it. */
function resolveParquetSourceWorkerUrl(): string | true {
  if (!import.meta.url) {
    return true;
  }
  try {
    return new URL(getParquetSourceWorkerFile(), import.meta.url).toString();
  } catch {
    return true;
  }
}

/** Returns the generated selective source worker filename without triggering source bundling. */
function getParquetSourceWorkerFile(): string {
  return './parquet-source-worker.js';
}
