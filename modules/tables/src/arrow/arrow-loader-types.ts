// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table as NativeArrowTable, RecordBatch} from 'apache-arrow';
import type {Table, ArrowTableBatch} from '@loaders.gl/core/schema';

import type {ArrowLoaderOptions} from './exports/arrow-loader';
import {ArrowWorkerLoader} from './exports/arrow-loader';

/** Preloads the parser-bearing Arrow loader implementation. */
async function preload() {
  const {ArrowLoaderWithParser} = await import('@loaders.gl/tables/arrow-loader');
  const {preloadArrowCompressionDecoders} = await import('./lib/parsers/arrow-compression');
  await preloadArrowCompressionDecoders();
  return ArrowLoaderWithParser;
}

/** Metadata-only ArrowJS table loader. */
export const ArrowLoader = {
  /** Matches input for source selection. */
  testURL: (url: string): boolean => /\.(?:arrow|feather|ipc)(?:$|[?#])/i.test(url),
  fromUrl: true,
  fromBlob: true,
  type: 'arrow',
  ...ArrowWorkerLoader,
  preload
} as const satisfies Loader<
  Table | NativeArrowTable,
  ArrowTableBatch | RecordBatch,
  ArrowLoaderOptions
>;
