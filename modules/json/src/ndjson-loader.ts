// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {
  ObjectRowTable,
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  Schema,
  TableBatch
} from '@loaders.gl/schema';
import type * as arrow from 'apache-arrow';
import {parseNDJSONSync} from './lib/parsers/parse-ndjson';
import {parseNDJSONInBatches} from './lib/parsers/parse-ndjson-in-batches';
import {
  type ArrowConversionOptions,
  convertRowTableToArrowTable,
  makeNDJSONArrowBatchIterator
} from './lib/parsers/convert-row-table-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type NDJSONShape = 'array-row-table' | 'object-row-table' | 'arrow-table';

/** Options for parsing newline-delimited JSON data. */
export type NDJSONLoaderOptions = LoaderOptions & {
  /** NDJSON parser options. */
  ndjson?: {
    /** Requested output shape. */
    shape?: NDJSONShape;
    /** Optional schema used when converting NDJSON rows to Arrow. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting NDJSON rows to Arrow. */
    arrowConversion?: ArrowConversionOptions;
  };
  /** Deprecated JSON parser alias used only for NDJSON shape selection. */
  json?: {
    /** Deprecated alias for `ndjson.shape`; `ndjson.shape` takes precedence. */
    shape?: NDJSONShape;
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
    parseNDJSONText(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: NDJSONLoaderOptions) => parseNDJSONText(text, options),
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

/**
 * Parses NDJSON text and optionally converts the result to Arrow.
 *
 * @param text - NDJSON text to parse.
 * @param options - Loader options including optional output shape.
 * @returns Row-table output by default, or an Arrow table when requested.
 */
function parseNDJSONText(
  text: string,
  options?: NDJSONLoaderOptions
): ObjectRowTable | ArrayRowTable | ArrowTable {
  validateNDJSONArrowOptions(options);
  const table = parseNDJSONSync(text);
  return getNDJSONShape(options) === 'arrow-table'
    ? convertRowTableToArrowTable(table, {
        schema: options?.ndjson?.schema,
        arrowConversion: options?.ndjson?.arrowConversion,
        log: getNDJSONLoaderLog(options)
      })
    : table;
}

/**
 * Parses NDJSON batches and optionally converts data batches to Arrow.
 *
 * @param asyncIterator - NDJSON byte iterator.
 * @param options - Loader options including optional output shape.
 * @returns Batch iterator yielding row-table or Arrow batches.
 */
function parseNDJSONInRequestedShape(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: NDJSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch> {
  validateNDJSONArrowOptions(options);
  const batches = parseNDJSONInBatches(asyncIterator, options);
  return getNDJSONShape(options) === 'arrow-table'
    ? makeNDJSONArrowBatchIterator(batches, {
        schema: options?.ndjson?.schema,
        arrowConversion: options?.ndjson?.arrowConversion,
        log: getNDJSONLoaderLog(options)
      })
    : batches;
}

/** Returns the requested NDJSON output shape, including the deprecated JSON alias. */
function getNDJSONShape(options?: NDJSONLoaderOptions): NDJSONShape {
  return options?.ndjson?.shape || options?.json?.shape || NDJSONLoader.options.ndjson.shape;
}

/** Returns the loader log object from normalized or deprecated option locations. */
function getNDJSONLoaderLog(options?: NDJSONLoaderOptions): any {
  return options?.core?.log || options?.log;
}

function validateNDJSONArrowOptions(options?: NDJSONLoaderOptions): void {
  const shape = getNDJSONShape(options);
  const hasArrowOnlyOptions = Boolean(options?.ndjson?.schema || options?.ndjson?.arrowConversion);
  if (hasArrowOnlyOptions && shape !== 'arrow-table') {
    throw new Error(
      'NDJSONLoader: ndjson.schema and ndjson.arrowConversion require ndjson.shape or json.shape to be "arrow-table"'
    );
  }
}
