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
import {NDJSONLoader as NDJSONLoaderMetadata} from './ndjson-loader';

const {preload: _NDJSONLoaderPreload, ...NDJSONLoaderMetadataWithoutPreload} = NDJSONLoaderMetadata;

type NDJSONShape = 'array-row-table' | 'object-row-table' | 'arrow-table';

/** Options for parsing newline-delimited JSON data. */
export type NDJSONLoaderOptions = LoaderOptions & {
  ndjson?: {
    /** Selects row-table output or Apache Arrow output. */
    shape?: NDJSONShape;
  };
  json?: {
    /** Deprecated alias for `ndjson.shape`. */
    shape?: NDJSONShape;
  };
};

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
  const table = parseNDJSONSync(text);
  return getNDJSONShape(options) === 'arrow-table' ? convertRowTableToArrowTable(table) : table;
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
  const batches = parseNDJSONInBatches(asyncIterator, options);
  return getNDJSONShape(options) === 'arrow-table' ? convertTableBatchesToArrow(batches) : batches;
}

/** Returns the requested NDJSON output shape, including the deprecated JSON alias. */
function getNDJSONShape(options?: NDJSONLoaderOptions): NDJSONShape {
  return (
    options?.ndjson?.shape || options?.json?.shape || NDJSONLoaderWithParser.options.ndjson.shape
  );
}
