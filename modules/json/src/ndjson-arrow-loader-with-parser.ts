// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {NDJSONLoaderWithParser, type NDJSONLoaderOptions} from './ndjson-loader-with-parser';
import {NDJSONArrowLoader as NDJSONArrowLoaderMetadata} from './ndjson-arrow-loader';

const {preload: _NDJSONArrowLoaderPreload, ...NDJSONArrowLoaderMetadataWithoutPreload} =
  NDJSONArrowLoaderMetadata;

/**
 * Options for parsing NDJSON input into Apache Arrow tables.
 *
 * The Arrow variant supports the same core loader options as `NDJSONLoaderWithParser`,
 * including streaming batch options such as `batchSize`.
 */
export type NDJSONArrowLoaderOptions = NDJSONLoaderOptions;

/**
 * Loader for NDJSON text that returns Apache Arrow tables.
 *
 * `NDJSONArrowLoaderWithParser` supports both full-file parsing and streaming batch
 * parsing. Streaming batches are yielded as `ArrowTableBatch` objects.
 */
export const NDJSONArrowLoaderWithParser = {
  ...NDJSONArrowLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: NDJSONArrowLoaderOptions) =>
    NDJSONLoaderWithParser.parse(arrayBuffer, withArrowShape(options)) as Promise<ArrowTable>,
  parseTextSync: (text: string, options?: NDJSONArrowLoaderOptions) =>
    NDJSONLoaderWithParser.parseTextSync(text, withArrowShape(options)) as ArrowTable,
  parseInBatches: (
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: NDJSONArrowLoaderOptions
  ) =>
    NDJSONLoaderWithParser.parseInBatches(
      asyncIterator,
      withArrowShape(options)
    ) as AsyncIterable<ArrowTableBatch>
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, NDJSONArrowLoaderOptions>;

function withArrowShape(options?: NDJSONLoaderOptions): NDJSONLoaderOptions {
  return {
    ...options,
    ndjson: {
      ...options?.ndjson,
      shape: 'arrow-table'
    }
  };
}
