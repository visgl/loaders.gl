// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {ParquetLoaderWithParser} from './parquet-loader';
import type {ParquetLoaderOptions} from './parquet-loader-options';
import {serializeParquetWorkerBatch} from './lib/parquet-worker-transport';

/** Worker implementation that keeps batches columnar until their IPC transport is hydrated. */
export const ParquetWorkerLoaderWithParser = {
  ...ParquetLoaderWithParser,
  /** Keeps atomic decoding columnar; caller-side hydration materializes requested rows. */
  parse(input: ArrayBuffer, options?: ParquetLoaderOptions, context?: LoaderContext) {
    return ParquetLoaderWithParser.parse(
      input,
      {
        ...options,
        parquet: {...options?.parquet, shape: 'arrow-table'}
      },
      context
    );
  },
  /** Decodes to Arrow for both public shapes; the serializer retains the requested shape. */
  parseInBatches(
    input:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    context?: LoaderContext
  ) {
    return ParquetLoaderWithParser.parseInBatches(
      input,
      {
        ...options,
        parquet: {...options?.parquet, shape: 'arrow-table'}
      },
      context
    );
  },
  serializeWorkerBatch: serializeParquetWorkerBatch
} as const satisfies LoaderWithParser;
