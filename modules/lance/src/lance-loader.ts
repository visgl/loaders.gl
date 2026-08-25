// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/schema';
import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';

import {LanceLoader as LanceLoaderMetadata, type LanceLoaderOptions} from './lance-loader-types';
import {LanceDecoderUnavailableError} from './lance-errors';

export {LanceDecoderUnavailableError} from './lance-errors';

/** Parser-bearing read-only Lance loader for flat primitive data files. */
export const LanceLoaderWithParser = {
  ...LanceLoaderMetadata,
  parse(
    _arrayBuffer: ArrayBuffer,
    _options?: LanceLoaderOptions
  ): Promise<ObjectRowTable | ArrowTable> {
    const lanceOptions = _options?.lance;
    if (!lanceOptions?.columnTypes) {
      return Promise.reject(new LanceDecoderUnavailableError());
    }
    const columnTypes = lanceOptions.columnTypes;
    return import('@loaders.gl/lance/lance-arrow').then(({parseLanceFileToArrow}) =>
      parseLanceFileToArrow(_arrayBuffer, {
        columnTypes,
        columnNames: lanceOptions.columnNames
      })
    );
  },
  async *parseInBatches(
    _iterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: LanceLoaderOptions
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(_iterator);
    const table = (await LanceLoaderWithParser.parse(arrayBuffer, options)) as ArrowTable;
    yield {batchType: 'data', shape: 'arrow-table', data: table.data, length: table.data.numRows};
  }
} as const satisfies LoaderWithParser<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  LanceLoaderOptions
>;
