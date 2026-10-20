// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * Initializes a WASM factory that reports readiness through a callback, a thenable, or both.
 * @param initialize - Starts initialization and forwards any available ready/error callbacks.
 * @param extractExports - Initializes the module and returns a plain, non-thenable export object.
 * @returns Extracted exports, or a rejection with the original initialization/setup error.
 * @remarks Never resolve with the raw Emscripten module: its thenable can recurse during assimilation.
 * Dependencies must expose a rejection or abort hook for asynchronous failures to be observable.
 */
export function initializeWasmModule<Module, ModuleExports>(
  initialize: (
    onInitialized: (module: Module) => void,
    onError: (error: unknown) => void
  ) => PromiseLike<Module> | void,
  extractExports: (module: Module) => ModuleExports
): Promise<ModuleExports> {
  return new Promise((resolve, reject) => {
    let isSettled = false;

    /** Rejects once and prevents a late ready callback from running module setup. */
    function rejectInitialization(error: unknown): void {
      if (!isSettled) {
        isSettled = true;
        reject(error);
      }
    }

    /** Extracts safe exports once, even when the factory uses both completion mechanisms. */
    function resolveInitialization(module: Module): void {
      if (isSettled) {
        return;
      }
      isSettled = true;
      try {
        resolve(extractExports(module));
      } catch (error) {
        reject(error);
      }
    }

    try {
      const modulePromise = initialize(resolveInitialization, rejectInitialization);
      modulePromise?.then(resolveInitialization, rejectInitialization);
    } catch (error) {
      rejectInitialization(error);
    }
  });
}
