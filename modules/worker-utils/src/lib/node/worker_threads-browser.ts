// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Browser polyfill for Node.js built-in `worker_threads` module.
 * These fills are non-functional, and just intended to ensure that
 * `import 'worker_threads` doesn't break browser builds.
 * The replacement is done in package.json browser field
 */
export class NodeWorker {
  /** Restores the native worker constructor when this browser shim is embedded in a Node bundle. */
  constructor(...arguments_: unknown[]) {
    const runtimeProcess = (
      globalThis as {
        process?: {
          getBuiltinModule?: (specifier: string) => {
            Worker?: new (...workerArguments: unknown[]) => NodeWorker;
          };
        };
      }
    ).process;
    const WorkerConstructor = runtimeProcess?.getBuiltinModule?.('node:worker_threads').Worker;
    if (WorkerConstructor) {
      return new WorkerConstructor(...arguments_);
    }
  }

  /** No-op browser fallback matching the native Worker API. */
  terminate() {}
}

export type {NodeWorker as NodeWorkerType};

export const parentPort = null;
