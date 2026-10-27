// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Browser workers use the published asset fallback; Node workers use the installed package. */
export const JSON_WORKER_URL = isNodeRuntime()
  ? import.meta.url
    ? getJSONNodeWorkerUrl(import.meta.url)
    : typeof require === 'function'
      ? require.resolve('@loaders.gl/tables/json-worker-node.cjs')
      : true
  : true;

/** Resolves the Node bundle beside the package, independently of the working directory. */
function getJSONNodeWorkerUrl(moduleUrl: string): string {
  const directory = moduleUrl.slice(0, moduleUrl.lastIndexOf('/') + 1);
  const outputDirectory = directory.replace(/\/(?:src|dist)\/json\/$/, '/dist/');
  return `${outputDirectory}json-worker-node.cjs`;
}

/** Checks Node.js availability without mistaking a browser require shim for Node. */
function isNodeRuntime(): boolean {
  return Boolean((globalThis as {process?: {versions?: {node?: string}}}).process?.versions?.node);
}
