// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type Table as ArrowTable, type RecordBatch as ArrowTableBatch} from 'apache-arrow';
import {JSONTableSource, type JSONTableSourceOptions} from './json-table-source';
import {getLoaderLog} from '@loaders.gl/core/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/core/schema';
import {convertTable} from '@loaders.gl/core/schema-utils';
import {
  updateNativeArrowTableMetadata,
  isNativeArrowRecordBatch
} from '@loaders.gl/core/schema-utils';
import {getJSONContainerMetadata} from './lib/parsers/json-container-metadata';

import {
  serializeJSONWorkerOptions,
  serializeJSONWorkerBatch,
  deserializeJSONWorkerResult
} from './lib/json-worker-transport';
import type {CoreAPI, LoaderWithParser} from '@loaders.gl/core/loader-utils';
import FastStreamingJSONParser from './lib/json-parser/fast-streaming-json-parser';
import type {StreamingJSONParserFactory} from './lib/json-parser/streaming-json-parser-types';
import {getJSONRowTable} from './lib/parsers/convert-json-to-arrow';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import {
  convertRowTableToArrowTable,
  convertTableBatchesToArrow,
  normalizeJSONArrowSchema
} from './lib/parsers/convert-row-table-to-arrow';
import type {JSONBatch, JSONLoaderOptions, MetadataBatch} from './json-loader-types';
import {
  JSONTableLoader as JSONTableLoaderMetadata,
  type JSONTableLoaderOptions
} from './json-table-loader-types';

const {preload: _JSONTableLoaderPreload, ...JSONTableLoaderMetadataWithoutPreload} =
  JSONTableLoaderMetadata;

/**
 * Parser-bearing loader for JSON documents that must resolve to loaders.gl table output.
 */
export const JSONTableLoaderWithParser = {
  ...JSONTableLoaderMetadataWithoutPreload,
  serializeWorkerOptions: serializeJSONWorkerOptions,
  serializeWorkerResult: serializeJSONWorkerBatch,
  deserializeWorkerResult: deserializeJSONWorkerResult,
  serializeWorkerBatch: serializeJSONWorkerBatch,
  deserializeWorkerBatch: deserializeJSONWorkerResult,
  parse,
  parseTextSync,
  parseInBatches,
  createDataSourceSync: (data: string | Blob, options: JSONTableSourceOptions, coreApi?: CoreAPI) =>
    new JSONTableSource(data, options, coreApi)
} as const satisfies LoaderWithParser<
  Table | ArrowTable,
  TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,
  JSONTableLoaderOptions,
  JSONTableSource
>;

/**
 * Parses UTF-8 JSON bytes into row tables or native Arrow tables.
 *
 * @param arrayBuffer - UTF-8 encoded JSON payload.
 * @param options - JSON table loader options.
 * @returns Parsed table output.
 */
async function parse(arrayBuffer: ArrayBuffer, options?: JSONTableLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

/**
 * Parses JSON text into row tables or native Arrow tables.
 *
 * @param text - JSON text to parse.
 * @param options - JSON table loader options.
 * @returns Parsed table output.
 * @throws If the payload does not contain row-array data.
 */
function parseTextSync(text: string, options?: JSONTableLoaderOptions) {
  const jsonOptions = normalizeJSONTableLoaderOptions(options);
  validateJSONTableArrowOptions(jsonOptions);

  const json = parseJSONSync(text, getRawJSONOptions(jsonOptions));
  const table = getJSONRowTable(json);
  if (!table) {
    throw new Error(
      'JSONTableLoader: expected a JSON row array or an object containing a JSON row array'
    );
  }

  if (jsonOptions.json?.shape !== 'arrow') {
    return jsonOptions.json?.shape === 'array-row-table'
      ? convertTable(table, 'array-row-table')
      : convertTable(table, 'object-row-table');
  }

  return updateNativeArrowTableMetadata(
    convertRowTableToArrowTable(table, {
      schema: jsonOptions.json.schema,
      arrowConversion: jsonOptions.json.arrowConversion,
      log: getLoaderLog(jsonOptions)
    }),
    getJSONContainerMetadata(json)
  );
}

/**
 * Parses streamed JSON row arrays into row-table batches or native Arrow record batches.
 *
 * @param asyncIterator - UTF-8 JSON byte chunks.
 * @param options - JSON table loader options.
 * @returns Table batches, native Arrow record batches, or JSON parser envelopes, depending on the output shape.
 */
function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JSONTableLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = normalizeJSONTableLoaderOptions(options);
  const rawJsonUtf8Fields = getRawJsonUtf8Fields(jsonOptions);
  const parseOptions =
    jsonOptions.json?.backend === 'fast'
      ? {parserFactory: getFastStreamingJSONParserFactory(rawJsonUtf8Fields)}
      : undefined;
  validateJSONTableArrowOptions(jsonOptions);

  const rowBatches = parseJSONInBatches(
    asyncIterator,
    getRowBatchJSONOptions(jsonOptions),
    parseOptions
  );

  if (jsonOptions.json?.shape !== 'arrow') {
    return rowBatches;
  }

  const arrowBatches = convertTableBatchesToArrow(rowBatches, {
    schema: jsonOptions.json.schema,
    arrowConversion: jsonOptions.json.arrowConversion,
    log: getLoaderLog(jsonOptions)
  });
  return makeNativeJSONBatches(arrowBatches);
}

/** Yields native data batches and schema refinements from the JSON stream. */
async function* makeNativeJSONBatches(
  batches: AsyncIterable<ArrowTableBatch | MetadataBatch | JSONBatch>
): AsyncIterable<ArrowTableBatch> {
  for await (const batch of batches) {
    if (isNativeArrowRecordBatch(batch)) yield batch;
  }
}

/**
 * Applies JSON table loader default options for direct parser calls.
 *
 * @param options - User-supplied JSON table loader options.
 * @returns Options merged with loader defaults.
 */
function normalizeJSONTableLoaderOptions(options?: JSONTableLoaderOptions): JSONTableLoaderOptions {
  return {
    ...options,
    json: {
      ...JSONTableLoaderWithParser.options.json,
      ...options?.json
    }
  };
}

/**
 * Requests raw JSON from the shared document parser before table conversion.
 *
 * @param options - Normalized JSON table loader options.
 * @returns JSON document parser options that preserve the raw parsed payload.
 */
function getRawJSONOptions(options: JSONTableLoaderOptions): JSONLoaderOptions {
  return {
    ...options,
    json: {
      backend: options.json?.backend,
      shape: undefined,
      table: false,
      jsonpaths: options.json?.jsonpaths
    }
  };
}

/**
 * Requests row batches from the shared streaming JSON parser before optional Arrow conversion.
 *
 * @param options - Normalized JSON table loader options.
 * @returns JSON document parser options that emit row-table batches.
 */
function getRowBatchJSONOptions(options: JSONTableLoaderOptions): JSONLoaderOptions {
  return {
    ...options,
    core: {
      ...options.core,
      metadata: options.json?.shape === 'arrow' || options.core?.metadata
    },
    json: {
      backend: options.json?.backend,
      shape: options.json?.shape === 'array-row-table' ? 'array-row-table' : 'object-row-table',
      table: true,
      jsonpaths: options.json?.jsonpaths
    }
  };
}

/**
 * Returns a factory for the fast streaming JSON parser backend.
 *
 * @returns Streaming parser factory used by the `fast` backend.
 */
function getFastStreamingJSONParserFactory(
  rawJsonUtf8Fields: string[]
): StreamingJSONParserFactory {
  return parserOptions => new FastStreamingJSONParser({...parserOptions, rawJsonUtf8Fields});
}

/**
 * Resolves row-level Utf8 schema fields eligible for fast raw JSON source capture.
 *
 * @param options - Normalized JSON table loader options.
 * @returns Row-level Utf8 field names for streamed fast Arrow parsing.
 */
function getRawJsonUtf8Fields(options: JSONTableLoaderOptions): string[] {
  if (options.json?.shape !== 'arrow' || !options.json.schema) {
    return [];
  }

  const schema = normalizeJSONArrowSchema(options.json.schema);
  return schema.fields.filter(field => field.type === 'utf8').map(field => field.name);
}

/**
 * Ensures Arrow-only options are used only with `shape: 'arrow'`.
 *
 * @param options - Normalized JSON table loader options.
 * @throws If Arrow conversion options are supplied without `json.shape: 'arrow'`.
 */
function validateJSONTableArrowOptions(options: JSONTableLoaderOptions): void {
  if (
    options.json?.shape &&
    !['arrow', 'object-row-table', 'array-row-table'].includes(options.json.shape)
  ) {
    throw new Error('This loader uses shape: "arrow" for native Arrow output');
  }
  const hasArrowOnlyOptions = Boolean(options.json?.schema || options.json?.arrowConversion);
  if (hasArrowOnlyOptions && options.json?.shape !== 'arrow') {
    throw new Error(
      'JSONTableLoader: json.schema and json.arrowConversion require json.shape to be "arrow"'
    );
  }
}

export type {JSONTableLoaderOptions} from './json-table-loader-types';
