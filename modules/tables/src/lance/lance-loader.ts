// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLanceSource} from './lance-source-loader';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
import {concatenateArrayBuffersAsync} from '@loaders.gl/core/loader-utils';

import {LanceLoader as LanceLoaderMetadata, type LanceLoaderOptions} from './lance-loader-types';
import {LanceDecoderUnavailableError} from './lance-errors';

export {LanceDecoderUnavailableError} from './lance-errors';

const {preload: _preload, ...LanceLoaderMetadataWithoutPreload} = LanceLoaderMetadata;

/** Parser-bearing read-only Lance loader for flat primitive data files. */
export const LanceLoaderWithParser = {
  createDataSourceSync: createLanceSource,
  ...LanceLoaderMetadataWithoutPreload,
  parse(_arrayBuffer: ArrayBuffer, _options?: LanceLoaderOptions): Promise<Table> {
    const lanceOptions = _options?.lance;
    const scanOptions = _options?._scan;
    if (!lanceOptions?.columnTypes) {
      return Promise.reject(new LanceDecoderUnavailableError());
    }
    const columnTypes = lanceOptions.columnTypes;
    return import('@loaders.gl/tables/lance/lance-arrow').then(({parseLanceFileToArrow}) =>
      parseLanceFileToArrow(_arrayBuffer, {
        columnTypes,
        columnNames: lanceOptions.columnNames,
        limit: scanOptions?.limit ?? lanceOptions.limit
      })
    );
  },
  async *parseInBatches(
    _iterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: LanceLoaderOptions
  ): AsyncIterable<RecordBatch> {
    const arrayBuffer = await concatenateArrayBuffersAsync(_iterator);
    const table: Table = await LanceLoaderWithParser.parse(arrayBuffer, options);
    yield* table.batches;
  }
} as const satisfies LoaderWithParser<Table, RecordBatch, LanceLoaderOptions>;
