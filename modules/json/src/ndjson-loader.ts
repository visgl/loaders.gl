// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {
  ObjectRowTable,
  ArrayRowTable,
  TableBatch,
  ArrowTable,
  ArrowTableBatch,
  Schema
} from '@loaders.gl/schema';
import type * as arrow from 'apache-arrow';
import {parseNDJSONSync} from './lib/parsers/parse-ndjson';
import {parseNDJSONInBatches} from './lib/parsers/parse-ndjson-in-batches';
import {
  type ArrowConversionOptions,
  convertRowTableToArrowTable,
  makeNDJSONArrowBatchIterator
} from './lib/parsers/parse-ndjson-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type NDJSONLoaderOptions = LoaderOptions & {
  /** NDJSON parser options. */
  ndjson?: {
    /** Requested output shape. */
    shape?: 'object-row-table' | 'array-row-table' | 'arrow-table';
    /** Optional schema used when converting NDJSON rows to Arrow. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting NDJSON rows to Arrow. */
    arrowConversion?: ArrowConversionOptions;
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
      shape: 'object-row-table',
      schema: undefined,
      arrowConversion: undefined
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
  validateNDJSONArrowOptions(options);
  const table = parseNDJSONSync(text);
  const shape = options?.ndjson?.shape || NDJSONLoader.options.ndjson.shape;
  return shape === 'arrow-table'
    ? convertRowTableToArrowTable(table, {
        schema: options?.ndjson?.schema,
        arrowConversion: options?.ndjson?.arrowConversion,
        log: getNDJSONLoaderLog(options)
      })
    : table;
}

function parseNDJSONInRequestedShape(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: NDJSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch> {
  validateNDJSONArrowOptions(options);
  const batches = parseNDJSONInBatches(asyncIterator, options);
  const shape = options?.ndjson?.shape || NDJSONLoader.options.ndjson.shape;
  return shape === 'arrow-table'
    ? makeNDJSONArrowBatchIterator(batches, {
        schema: options?.ndjson?.schema,
        arrowConversion: options?.ndjson?.arrowConversion,
        log: getNDJSONLoaderLog(options)
      })
    : batches;
}

/** Returns the loader log object from normalized or deprecated option locations. */
function getNDJSONLoaderLog(options?: NDJSONLoaderOptions): any {
  return options?.core?.log || options?.log;
}

function validateNDJSONArrowOptions(options?: NDJSONLoaderOptions): void {
  const shape = options?.ndjson?.shape || NDJSONLoader.options.ndjson.shape;
  const hasArrowOnlyOptions = Boolean(options?.ndjson?.schema || options?.ndjson?.arrowConversion);
  if (hasArrowOnlyOptions && shape !== 'arrow-table') {
    throw new Error(
      'NDJSONLoader: ndjson.schema and ndjson.arrowConversion require ndjson.shape to be "arrow-table"'
    );
  }
}
