// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';

const loaderImplementationPromises = new Map<Loader, Map<string, Promise<LoaderWithParser>>>();
const loaderImplementations = new Map<Loader, Map<string, LoaderWithParser>>();

/** Gets a parser-bearing implementation for a loader, loading it if needed. */
export async function getLoaderImplementation(
  loader: Loader,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser> {
  if (isLoaderWithParser(loader)) {
    return loader;
  }

  const implementationCacheKey = getLoaderImplementationCacheKey(loader, options);
  const loaderImplementation = loaderImplementations.get(loader)?.get(implementationCacheKey);
  if (loaderImplementation) {
    return loaderImplementation;
  }

  let loaderImplementationPromisesForLoader = loaderImplementationPromises.get(loader);
  if (!loaderImplementationPromisesForLoader) {
    loaderImplementationPromisesForLoader = new Map();
    loaderImplementationPromises.set(loader, loaderImplementationPromisesForLoader);
  }

  let loaderImplementationPromise =
    loaderImplementationPromisesForLoader.get(implementationCacheKey);
  if (!loaderImplementationPromise) {
    loaderImplementationPromise = resolveLoaderImplementation(loader, options, url)
      .then(implementation => {
        let loaderImplementationsForLoader = loaderImplementations.get(loader);
        if (!loaderImplementationsForLoader) {
          loaderImplementationsForLoader = new Map();
          loaderImplementations.set(loader, loaderImplementationsForLoader);
        }
        loaderImplementationsForLoader.set(implementationCacheKey, implementation);
        return implementation;
      })
      .catch(error => {
        loaderImplementationPromisesForLoader.delete(implementationCacheKey);
        if (loaderImplementationPromisesForLoader.size === 0) {
          loaderImplementationPromises.delete(loader);
        }
        throw error;
      });
    loaderImplementationPromisesForLoader.set(implementationCacheKey, loaderImplementationPromise);
  }

  return await loaderImplementationPromise;
}

/** Gets a cached parser-bearing implementation for a loader without loading it. */
export function getLoaderImplementationSync(loader: Loader): LoaderWithParser | null {
  if (isLoaderWithParser(loader)) {
    return loader;
  }

  const implementationCacheKey = getLoaderImplementationCacheKey(loader);
  return loaderImplementations.get(loader)?.get(implementationCacheKey) || null;
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

/** Resolves a parser-bearing implementation through loader preload or the test import fallback. */
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

/** Gets the dynamic implementation specifier for the test worker fallback path. */
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

/** Gets the cache key for option-selected parser implementations. */
function getLoaderImplementationCacheKey(loader: Loader, options?: LoaderOptions): string {
  const loaderOptions = options?.[loader.id] as {backend?: unknown} | undefined;
  const defaultLoaderOptions = loader.options?.[loader.id] as {backend?: unknown} | undefined;
  return String(loaderOptions?.backend || defaultLoaderOptions?.backend || '');
}

/** Imports a module and finds the parser-bearing loader implementation with the requested id. */
async function importLoaderImplementation(
  implementationSpecifier: string,
  loaderId: string
): Promise<LoaderWithParser> {
  const moduleExports = await import(
    /* webpackIgnore: true */ /* @vite-ignore */ implementationSpecifier
  );

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
