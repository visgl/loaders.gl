// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';

const loaderImplementationPromiseCache = new Map<string, Promise<LoaderWithParser>>();

/** Loads a parser-bearing implementation for metadata-only loaders. */
export async function loadLoaderImplementation(
  loader: Loader,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser> {
  if (isLoaderWithParser(loader)) {
    return loader;
  }

  const implementation = getLoaderImplementationCacheKey(loader, options);
  let loaderImplementationPromise = loaderImplementationPromiseCache.get(implementation);

  if (!loaderImplementationPromise) {
    loaderImplementationPromise = resolveLoaderImplementation(loader, options, url);
    loaderImplementationPromiseCache.set(implementation, loaderImplementationPromise);
  }

  return await loaderImplementationPromise;
}

/** Returns true when a loader object already includes parser methods. */
export function isLoaderWithParser(loader: Loader): loader is LoaderWithParser {
  const candidate = loader as LoaderWithParser;
  return Boolean(
    candidate.parse ||
      candidate.parseSync ||
      candidate.parseInBatches ||
      candidate.parseText ||
      candidate.parseTextSync ||
      candidate.parseFile ||
      candidate.parseFileInBatches
  );
}

function getLoaderImplementationCacheKey(loader: Loader, options?: LoaderOptions): string {
  const workerType = options?._workerType || options?.core?._workerType;
  if (workerType === 'test') {
    return `test:${loader.module}:${loader.id}`;
  }

  if (loader.preload) {
    return `preload:${loader.module}:${loader.id}:${loader.name}`;
  }

  return `${loader.module}:${loader.id}`;
}

async function resolveLoaderImplementation(
  loader: Loader,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser> {
  if (loader.preload) {
    const preloadedLoader = await loader.preload(url || '', options);
    if (isLoaderWithParser(preloadedLoader as Loader)) {
      return preloadedLoader as LoaderWithParser;
    }

    throw new Error(`${loader.id} loader preload() did not return a parser-bearing loader`);
  }

  const implementationSpecifier = getLoaderImplementationSpecifier(loader, options);
  return await importLoaderImplementation(implementationSpecifier, loader.id);
}

function getLoaderImplementationSpecifier(loader: Loader, options?: LoaderOptions): string {
  const workerType = options?._workerType || options?.core?._workerType;
  if (workerType === 'test') {
    const sourcePath = `modules/${loader.module}/src/${loader.id}-loader.ts`;
    if (typeof window !== 'undefined') {
      return `/${sourcePath}`;
    }

    if (typeof process !== 'undefined' && process.cwd) {
      return new URL(sourcePath, `file://${process.cwd()}/`).toString();
    }

    return sourcePath;
  }

  throw new Error(
    `${loader.id} loader does not provide a parser implementation. Import a parser-bearing loader directly, or use preload() before parse/load.`
  );
}

async function importLoaderImplementation(
  implementationSpecifier: string,
  loaderId: string
): Promise<LoaderWithParser> {
  const moduleExports = await import(implementationSpecifier);

  for (const exportValue of Object.values(moduleExports)) {
    if (
      exportValue &&
      typeof exportValue === 'object' &&
      (exportValue as Loader).id === loaderId &&
      isLoaderWithParser(exportValue as Loader)
    ) {
      return exportValue as LoaderWithParser;
    }
  }

  throw new Error(
    `Could not find parser implementation for ${loaderId} in ${implementationSpecifier}`
  );
}
