// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {
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
  makeNDJSONArrowBatchIterator
} from './lib/parsers/convert-row-table-to-arrow';
import {
  NDJSONLoader as NDJSONLoaderMetadata,
  type NDJSONLoaderOptions,
  type NDJSONShape
} from './ndjson-loader';

const {preload: _NDJSONLoaderPreload, ...NDJSONLoaderMetadataWithoutPreload} = NDJSONLoaderMetadata;

/** Loader for newline-delimited JSON row and Arrow tables. */
export const NDJSONLoaderWithParser = {
  ...NDJSONLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer: ArrayBuffer, options?: NDJSONLoaderOptions) =>
    parseNDJSONText(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: NDJSONLoaderOptions) => parseNDJSONText(text, options),
  parseInBatches: (
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: NDJSONLoaderOptions
  ) => parseNDJSONInRequestedShape(asyncIterator, options)
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
  return (
    options?.ndjson?.shape || options?.json?.shape || NDJSONLoaderWithParser.options.ndjson.shape
  );
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

export type {NDJSONLoaderOptions, NDJSONShape} from './ndjson-loader';
