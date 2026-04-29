// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {Table, ArrowTableBatch} from '@loaders.gl/schema';

import type {ArrowLoaderOptions} from './exports/arrow-loader';
import {ArrowWorkerLoader} from './exports/arrow-loader';

/** Preloads the parser-bearing Arrow loader implementation. */
async function preload() {
  const {ArrowLoaderWithParser} = await import('./arrow-loader-with-parser');
  return ArrowLoaderWithParser;
}

/** Metadata-only ArrowJS table loader. */
export const ArrowLoader = {
  ...ArrowWorkerLoader,
  preload
} as const satisfies Loader<Table, ArrowTableBatch, ArrowLoaderOptions>;
