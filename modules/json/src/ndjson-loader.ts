// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {
  ObjectRowTable,
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  TableBatch
} from '@loaders.gl/schema';
import {parseNDJSONSync} from './lib/parsers/parse-ndjson';
import {parseNDJSONInBatches} from './lib/parsers/parse-ndjson-in-batches';
import {
  convertRowTableToArrowTable,
  convertTableBatchesToArrow
} from './lib/parsers/convert-row-table-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for parsing newline-delimited JSON data. */
export type NDJSONLoaderOptions = LoaderOptions & {
  json?: {
    /** Selects row-table output or Apache Arrow output. */
    shape?: 'array-row-table' | 'object-row-table' | 'arrow-table';
  };
};

/** Loader for newline-delimited JSON row and Arrow tables. */
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
    parseNDJSONTable(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: NDJSONLoaderOptions) => parseNDJSONTable(text, options),
  parseInBatches: (
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: NDJSONLoaderOptions
  ) => makeNDJSONBatchIterator(asyncIterator, options),
  options: {}
} as const satisfies LoaderWithParser<
  ObjectRowTable | ArrayRowTable | ArrowTable,
  TableBatch | ArrowTableBatch,
  NDJSONLoaderOptions
>;

/**
 * Parses NDJSON text and optionally converts the result to Arrow.
 *
 * @param text - NDJSON text to parse.
 * @param options - Loader options including optional output shape.
 * @returns Row-table output by default, or an Arrow table when requested.
 */
function parseNDJSONTable(
  text: string,
  options?: NDJSONLoaderOptions
): ObjectRowTable | ArrayRowTable | ArrowTable {
  const table = parseNDJSONSync(text);
  return options?.json?.shape === 'arrow-table' ? convertRowTableToArrowTable(table) : table;
}

/**
 * Parses NDJSON batches and optionally converts data batches to Arrow.
 *
 * @param asyncIterator - NDJSON byte iterator.
 * @param options - Loader options including optional output shape.
 * @returns Batch iterator yielding row-table or Arrow batches.
 */
function makeNDJSONBatchIterator(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: NDJSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch> {
  const batches = parseNDJSONInBatches(asyncIterator, options);
  return options?.json?.shape === 'arrow-table' ? convertTableBatchesToArrow(batches) : batches;
}
