// SPDX-License-Identifier: MIT

import {
  isBrowser,
  isWorker,
  loadLibrary as loadCoreLibrary,
  type LoadLibraryOptions
} from '@loaders.gl/core/worker-utils';

export {isBrowser, type LoadLibraryOptions};

/** Resolves local Draco assets inside scene without changing core's format-neutral library paths. */
export async function loadLibrary(
  libraryUrl: string,
  moduleName: string | null = null,
  options: LoadLibraryOptions = {},
  libraryName: string | null = null,
  moduleLibraryName: string | null = null
): Promise<unknown> {
  if (
    isBrowser &&
    options.useLocalLibraries &&
    !options.CDN &&
    libraryName &&
    options.modules?.[libraryName] === undefined
  ) {
    const directory = isWorker ? './libs' : `modules/${moduleName}/dist/libs`;
    options = {
      ...options,
      modules: {
        [libraryName]: `${directory}/${libraryName}`,
        ...(moduleLibraryName ? {[moduleLibraryName]: `${directory}/${moduleLibraryName}`} : {}),
        ...options.modules
      }
    };
  }
  return await loadCoreLibrary(libraryUrl, moduleName, options, libraryName, moduleLibraryName);
}
