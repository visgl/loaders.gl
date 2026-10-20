// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table, ArrowTableBatch} from '@loaders.gl/core/schema';

import type {ArrowLoaderOptions} from './exports/arrow-loader';
import {ArrowWorkerLoader} from './exports/arrow-loader';

/** Preloads the parser-bearing Arrow loader implementation. */
async function preload() {
  const {ArrowLoaderWithParser} = await import('@loaders.gl/tables/arrow/arrow-loader');
  const {preloadArrowCompressionDecoders} = await import('./lib/parsers/arrow-compression');
  await preloadArrowCompressionDecoders();
  return ArrowLoaderWithParser;
}

/** Metadata-only ArrowJS table loader. */
export const ArrowLoader = {
  ...ArrowWorkerLoader,
  preload
} as const satisfies Loader<Table, ArrowTableBatch, ArrowLoaderOptions>;
