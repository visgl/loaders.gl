// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Browser polyfill for Node.js built-in `worker_threads` module.
 * These fills are non-functional, and just intended to ensure that
 * `import 'worker_threads` doesn't break browser builds.
 * The replacement is done in package.json browser field
 */
export class NodeWorker {
  terminate() {}
}

export type {NodeWorker as NodeWorkerType};

export const parentPort = null;
