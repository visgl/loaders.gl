// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Installed worker bundle for the Node.js distribution. */
export const PARQUET_WORKER_URL = isNodeRuntime()
  ? import.meta.url
    ? getParquetWorkerUrl(import.meta.url)
    : typeof require === 'function'
      ? require.resolve('@loaders.gl/tables/parquet/parquet-worker-node.cjs')
      : true
  : true;

/** Builds a package-relative worker URL without making the development bundler resolve the asset. */
function getParquetWorkerUrl(moduleUrl: string): string {
  const directory = moduleUrl.slice(0, moduleUrl.lastIndexOf('/') + 1);
  const outputDirectory = directory.replace(/\/(?:src|dist)\/parquet\/$/, '/dist/');
  return `${outputDirectory}parquet-worker-node.cjs`;
}

/** Checks Node.js availability without mistaking a browser require shim for Node. */
function isNodeRuntime(): boolean {
  return Boolean((globalThis as {process?: {versions?: {node?: string}}}).process?.versions?.node);
}
