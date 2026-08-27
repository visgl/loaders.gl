// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Module-relative worker asset for browser ESM and Node.js CommonJS distributions. */
export const PARQUET_WORKER_URL = import.meta.url
  ? getParquetWorkerUrl(import.meta.url)
  : typeof __dirname === 'string'
    ? `${__dirname}/parquet-worker-node.cjs`
    : true;

/** Builds a package-relative worker URL without making the development bundler resolve the asset. */
function getParquetWorkerUrl(moduleUrl: string): string {
  return `${moduleUrl.slice(0, moduleUrl.lastIndexOf('/') + 1)}${getParquetWorkerFile()}`;
}

/** Selects the worker bundle for the current JavaScript runtime. */
function getParquetWorkerFile(): string {
  const isNode = Boolean(
    (globalThis as {process?: {versions?: {node?: string}}}).process?.versions?.node
  );
  return isNode ? './parquet-worker-node.cjs' : './parquet-worker.js';
}
