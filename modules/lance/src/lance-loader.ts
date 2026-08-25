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
import {parseLanceFileToArrow} from './lance-arrow';

/** Error raised while the Lance decoder backend is still being implemented. */
export class LanceDecoderUnavailableError extends Error {
  /** Creates an error with the stable Lance scaffold message. */
  constructor() {
    super('Lance decoding is not implemented yet in @loaders.gl/lance');
    this.name = 'LanceDecoderUnavailableError';
  }
}

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
    return Promise.resolve(
      parseLanceFileToArrow(_arrayBuffer, {
        columnTypes: lanceOptions.columnTypes,
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
