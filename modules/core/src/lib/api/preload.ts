// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {getLoaderImplementation, getLoaderImplementationSync} from './load-loader';

/**
 * Preloads a loader implementation so later parse/load calls do not pay the resolution cost on first use.
 * May return a parser-bearing loader that also supports `parseSync`.
 */
export async function preload<LoaderT extends Loader>(
  loader: LoaderT,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser>;

export async function preload(
  loader: Loader,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser> {
  return await getLoaderImplementation(loader, options, url);
}

/**
 * Returns a cached parser-bearing loader implementation if one is already available.
 */
export function preloadSync(loader: Loader): LoaderWithParser | null {
  return getLoaderImplementationSync(loader);
}
