// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Module-relative worker asset for browser ESM and Node.js CommonJS distributions. */
export const JSON_WORKER_URL = import.meta.url
  ? getJSONWorkerUrl(import.meta.url)
  : isNodeRuntime() && typeof require === 'function'
    ? require.resolve('@loaders.gl/tables/json-worker-node.cjs')
    : true;

/** Builds a package-relative worker URL without making the development bundler resolve the asset. */
function getJSONWorkerUrl(moduleUrl: string): string {
  const directory = moduleUrl.slice(0, moduleUrl.lastIndexOf('/') + 1);
  const outputDirectory = directory.replace(/\/(?:src|dist)\/json\/$/, '/dist/');
  return `${outputDirectory}${getJSONWorkerFile()}`;
}

/** Selects the worker bundle for the current JavaScript runtime. */
function getJSONWorkerFile(): string {
  return isNodeRuntime() ? './json-worker-node.cjs' : './json-worker.js';
}

/** Checks Node.js availability without mistaking a browser require shim for Node. */
function isNodeRuntime(): boolean {
  return Boolean((globalThis as {process?: {versions?: {node?: string}}}).process?.versions?.node);
}
