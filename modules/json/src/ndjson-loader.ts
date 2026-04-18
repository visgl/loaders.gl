// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {
  ObjectRowTable,
  ArrayRowTable,
  TableBatch,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/schema';
import {parseNDJSONSync} from './lib/parsers/parse-ndjson';
import {parseNDJSONInBatches} from './lib/parsers/parse-ndjson-in-batches';
import {
  convertRowTableToArrowTable,
  makeNDJSONArrowBatchIterator
} from './lib/parsers/parse-ndjson-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type NDJSONLoaderOptions = LoaderOptions & {
  ndjson?: {
    shape?: 'object-row-table' | 'array-row-table' | 'arrow-table';
  };
};

export const NDJSONLoader = {
  dataType: null as unknown as ArrayRowTable | ObjectRowTable | ArrowTable,
  batchType: null as unknown as TableBatch | ArrowTableBatch,

  name: 'NDJSON',
  id: 'ndjson',
  module: 'json',
  version: VERSION,
  extensions: ['ndjson', 'jsonl'],
  mimeTypes: [
    'application/x-ndjson',
    'application/jsonlines', // https://docs.aws.amazon.com/sagemaker/latest/dg/cdf-inference.html#cm-batch
    'application/json-seq'
  ],
  category: 'table',
  text: true,
  parse: async (arrayBuffer: ArrayBuffer, options?: NDJSONLoaderOptions) =>
    parseNDJSONText(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseNDJSONText,
  parseInBatches: (
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: NDJSONLoaderOptions
  ) => parseNDJSONInRequestedShape(asyncIterator, options),
  options: {
    ndjson: {
      shape: 'object-row-table'
    }
  }
} as const satisfies LoaderWithParser<
  ObjectRowTable | ArrayRowTable | ArrowTable,
  TableBatch | ArrowTableBatch,
  NDJSONLoaderOptions
>;

function parseNDJSONText(
  text: string,
  options?: NDJSONLoaderOptions
): ObjectRowTable | ArrayRowTable | ArrowTable {
  const table = parseNDJSONSync(text);
  const shape = options?.ndjson?.shape || NDJSONLoader.options.ndjson.shape;
  return shape === 'arrow-table' ? convertRowTableToArrowTable(table) : table;
}

function parseNDJSONInRequestedShape(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: NDJSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch> {
  const batches = parseNDJSONInBatches(asyncIterator, options);
  const shape = options?.ndjson?.shape || NDJSONLoader.options.ndjson.shape;
  return shape === 'arrow-table' ? makeNDJSONArrowBatchIterator(batches) : batches;
}
