// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as NativeArrowTable, RecordBatch} from 'apache-arrow';
import {NDJSONTableSource, type NDJSONSourceOptions} from './ndjson-source';
import {getLoaderLog} from '@loaders.gl/core/loader-utils';
import {
  serializeJSONWorkerOptions,
  serializeJSONWorkerBatch,
  deserializeJSONWorkerResult
} from './lib/json-worker-transport';
import type {CoreAPI, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable, ArrayRowTable, TableBatch} from '@loaders.gl/core/schema';
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
} from './ndjson-loader-types';

const {preload: _NDJSONLoaderPreload, ...NDJSONLoaderMetadataWithoutPreload} = NDJSONLoaderMetadata;

/** Loader for newline-delimited JSON row and Arrow tables. */
export const NDJSONLoaderWithParser = {
  ...NDJSONLoaderMetadataWithoutPreload,
  serializeWorkerOptions: serializeJSONWorkerOptions,
  serializeWorkerResult: serializeJSONWorkerBatch,
  deserializeWorkerResult: deserializeJSONWorkerResult,
  serializeWorkerBatch: serializeJSONWorkerBatch,
  deserializeWorkerBatch: deserializeJSONWorkerResult,
  parse: async (arrayBuffer: ArrayBuffer, options?: NDJSONLoaderOptions) =>
    parseNDJSONText(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: (text: string, options?: NDJSONLoaderOptions) => parseNDJSONText(text, options),
  parseInBatches: (
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: NDJSONLoaderOptions
  ) => parseNDJSONInRequestedShape(asyncIterator, options),
  createDataSourceSync: (data: string | Blob, options: NDJSONSourceOptions, coreApi?: CoreAPI) =>
    new NDJSONTableSource(data, options, coreApi)
} as const satisfies LoaderWithParser<
  ObjectRowTable | ArrayRowTable | NativeArrowTable,
  TableBatch | RecordBatch,
  NDJSONLoaderOptions,
  NDJSONTableSource
>;

/**
 * Parses NDJSON text and optionally converts the result to Arrow.
 *
 * @param text - NDJSON text to parse.
 * @param options - Loader options including optional output shape.
 * @returns Arrow table output by default, or a row table when explicitly requested.
 */
function parseNDJSONText(
  text: string,
  options?: NDJSONLoaderOptions
): ObjectRowTable | ArrayRowTable | NativeArrowTable {
  validateNDJSONArrowOptions(options);
  const table = parseNDJSONSync(text);
  return getNDJSONShape(options) === 'arrow'
    ? convertRowTableToArrowTable(table, {
        schema: options?.ndjson?.schema,
        arrowConversion: options?.ndjson?.arrowConversion,
        log: getLoaderLog(options)
      }).data
    : table;
}

/**
 * Parses NDJSON batches and optionally converts data batches to Arrow.
 *
 * @param asyncIterator - NDJSON byte iterator.
 * @param options - Loader options including optional output shape.
 * @returns Batch iterator yielding row-table or Arrow batches.
 */
async function* parseNDJSONInRequestedShape(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: NDJSONLoaderOptions
): AsyncIterable<TableBatch | RecordBatch> {
  validateNDJSONArrowOptions(options);
  const batches = parseNDJSONInBatches(asyncIterator, options);
  if (getNDJSONShape(options) !== 'arrow') {
    yield* batches;
    return;
  }
  yield* makeNDJSONArrowBatchIterator(batches, {
    schema: options?.ndjson?.schema,
    arrowConversion: options?.ndjson?.arrowConversion,
    log: getLoaderLog(options)
  });
}

/** Returns the requested NDJSON output shape, including the deprecated JSON alias. */
function getNDJSONShape(options?: NDJSONLoaderOptions): NDJSONShape {
  return (
    options?.ndjson?.shape || options?.json?.shape || NDJSONLoaderWithParser.options.ndjson.shape
  );
}

/** Validates shape selection and options that require Arrow output. */
function validateNDJSONArrowOptions(options?: NDJSONLoaderOptions): void {
  const shape = getNDJSONShape(options);
  if ((shape as string) === 'arrow-table') {
    throw new Error('NDJSONLoader: use ndjson.shape "arrow" for native Arrow output');
  }
  const hasArrowOnlyOptions = Boolean(options?.ndjson?.schema || options?.ndjson?.arrowConversion);
  if (hasArrowOnlyOptions && shape !== 'arrow') {
    throw new Error(
      'NDJSONLoader: ndjson.schema and ndjson.arrowConversion require ndjson.shape or json.shape to be "arrow"'
    );
  }
}

export type {NDJSONLoaderOptions, NDJSONShape} from './ndjson-loader-types';
