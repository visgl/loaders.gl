// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser, SourceLoader} from '@loaders.gl/loader-utils';
import {
  getLoaderImplementation,
  getLoaderImplementationSync,
  preloadLoaderDependencies
} from './load-loader';

/**
 * Prepares a source implementation and its declared dependencies before source creation.
 */
export async function preload<SourceT extends SourceLoader>(
  loader: SourceT,
  options?: LoaderOptions,
  url?: string
): Promise<SourceT>;

/** Prepares a parser and its recursively declared dependencies. */
export async function preload<LoaderT extends Loader>(
  loader: LoaderT,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser>;

export async function preload(
  loader: Loader,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser | SourceLoader> {
  return loader.subloaders
    ? await preloadLoaderDependencies(loader, options, url)
    : await getLoaderImplementation(loader, options, url);
}

/**
 * Returns a cached parser-bearing loader implementation if one is already available.
 */
export function preloadSync<SourceT extends SourceLoader>(loader: SourceT): SourceT | null;
/** Returns a cached parser, including prepared default dependency bindings. */
export function preloadSync(loader: Loader): LoaderWithParser | null;
export function preloadSync(loader: Loader): LoaderWithParser | SourceLoader | null {
  return getLoaderImplementationSync(loader);
}
