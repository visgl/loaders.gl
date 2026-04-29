// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {NDJSONLoader, type NDJSONLoaderOptions} from './ndjson-loader';

/**
 * Options for parsing NDJSON input into Apache Arrow tables.
 *
 * The Arrow variant supports the same core loader options as `NDJSONLoader`,
 * including streaming batch options such as `batchSize`.
 */
export type NDJSONArrowLoaderOptions = NDJSONLoaderOptions;

/**
 * Metadata-only loader for NDJSON text that returns Apache Arrow tables.
 *
 * `NDJSONArrowLoader` supports both full-file parsing and streaming batch
 * parsing. Streaming batches are yielded as `ArrowTableBatch` objects.
 */
export const NDJSONArrowLoader = {
  ...NDJSONLoader,
  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,
  options: {
    ndjson: {
      shape: 'arrow-table'
    }
  }
} as const satisfies Loader<ArrowTable, ArrowTableBatch, NDJSONArrowLoaderOptions>;
