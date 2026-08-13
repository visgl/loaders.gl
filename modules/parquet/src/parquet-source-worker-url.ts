// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Module-relative selective Parquet source worker asset. */
export const PARQUET_SOURCE_WORKER_URL = import.meta.url
  ? new URL(getParquetSourceWorkerFile(), import.meta.url).toString()
  : typeof __dirname === 'string'
    ? `${__dirname}/parquet-source-worker-node.cjs`
    : true;

/** Selects the selective source worker bundle for the current JavaScript runtime. */
function getParquetSourceWorkerFile(): string {
  const isNode = Boolean(
    (globalThis as {process?: {versions?: {node?: string}}}).process?.versions?.node
  );
  return isNode ? './parquet-source-worker-node.cjs' : './parquet-source-worker.js';
}
