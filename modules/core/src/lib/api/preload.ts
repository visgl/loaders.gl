// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {loadLoaderImplementation} from '../loader-utils/load-loader';

/**
 * Preloads a loader implementation so later parse/load calls do not pay the resolution cost on first use.
 * May return a parser-bearing loader that also supports `parseSync`.
 */
export async function preload<LoaderT extends Loader>(
  loader: LoaderT,
  options?: LoaderOptions,
  url?: string
): Promise<LoaderWithParser> {
  return await loadLoaderImplementation(loader, options, url);
}
