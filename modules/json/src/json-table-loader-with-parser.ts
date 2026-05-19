// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  ObjectRowTable,
  Table,
  TableBatch
} from '@loaders.gl/schema';
import {convertTable, makeTableFromData} from '@loaders.gl/schema-utils';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import FastStreamingJSONParser from './lib/json-parser/fast-streaming-json-parser';
import type {StreamingJSONParserFactory} from './lib/json-parser/streaming-json-parser-types';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import {
  convertRowTableToArrowTable,
  convertTableBatchesToArrow,
  normalizeJSONArrowSchema
} from './lib/parsers/convert-row-table-to-arrow';
import type {JSONBatch, JSONLoaderOptions, MetadataBatch} from './json-loader';
import {
  JSONTableLoader as JSONTableLoaderMetadata,
  type JSONTableLoaderOptions
} from './json-table-loader';

const {preload: _JSONTableLoaderPreload, ...JSONTableLoaderMetadataWithoutPreload} =
  JSONTableLoaderMetadata;

/**
 * Parser-bearing loader for JSON documents that must resolve to loaders.gl table output.
 */
export const JSONTableLoaderWithParser = {
  ...JSONTableLoaderMetadataWithoutPreload,
  parse,
  parseTextSync,
  parseInBatches
} as const satisfies LoaderWithParser<
  Table | ArrowTable,
  TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,
  JSONTableLoaderOptions
>;

/**
 * Parses UTF-8 JSON bytes into row-table or Arrow-table output.
 *
 * @param arrayBuffer - UTF-8 encoded JSON payload.
 * @param options - JSON table loader options.
 * @returns Parsed table output.
 */
async function parse(arrayBuffer: ArrayBuffer, options?: JSONTableLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

/**
 * Parses JSON text into row-table or Arrow-table output.
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

  if (jsonOptions.json?.shape !== 'arrow-table') {
    return jsonOptions.json?.shape === 'array-row-table'
      ? convertTable(table, 'array-row-table')
      : convertTable(table, 'object-row-table');
  }

  return convertRowTableToArrowTable(table, {
    schema: jsonOptions.json.schema,
    arrowConversion: jsonOptions.json.arrowConversion,
    log: getJSONTableLoaderLog(jsonOptions)
  });
}

/**
 * Parses streamed JSON row arrays into table or Arrow-table batches.
 *
 * @param asyncIterator - UTF-8 JSON byte chunks.
 * @param options - JSON table loader options.
 * @returns Table, Arrow-table, metadata, and JSON parser batches.
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

  if (jsonOptions.json?.shape !== 'arrow-table') {
    return rowBatches;
  }

  return convertTableBatchesToArrow(rowBatches, {
    schema: jsonOptions.json.schema,
    arrowConversion: jsonOptions.json.arrowConversion,
    log: getJSONTableLoaderLog(jsonOptions)
  });
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
    json: {
      backend: options.json?.backend,
      shape: options.json?.shape === 'array-row-table' ? 'array-row-table' : 'object-row-table',
      table: true,
      jsonpaths: options.json?.jsonpaths
    }
  };
}

/**
 * Returns a row table when a JSON value contains row-array data.
 *
 * @param json - Parsed JSON value.
 * @returns A loaders.gl row table, or `null` when no row array is present.
 */
function getJSONRowTable(json: unknown): ArrayRowTable | ObjectRowTable | null {
  if (isRowTable(json)) {
    return json;
  }

  const rows = Array.isArray(json) ? json : getFirstArray(json);
  if (!rows) {
    return null;
  }

  if (rows.length === 0) {
    return {shape: 'object-row-table', schema: {fields: [], metadata: {}}, data: []};
  }

  const firstRow = rows[0];
  if (Array.isArray(firstRow)) {
    return makeTableFromData(rows as unknown[][]);
  }
  if (firstRow && typeof firstRow === 'object') {
    return makeTableFromData(rows as {[key: string]: unknown}[]);
  }

  return null;
}

/**
 * Checks whether a parsed JSON value is already a row-table wrapper.
 *
 * @param value - Parsed JSON value.
 * @returns `true` when `value` is a loaders.gl object-row or array-row table.
 */
function isRowTable(value: unknown): value is ArrayRowTable | ObjectRowTable {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'shape' in value &&
      ((value as Table).shape === 'array-row-table' ||
        (value as Table).shape === 'object-row-table')
  );
}

/**
 * Finds the first nested row array within a parsed JSON object.
 *
 * @param json - Parsed JSON value.
 * @returns The first nested array, or `null` when none exists.
 */
function getFirstArray(json: unknown): unknown[] | null {
  if (Array.isArray(json)) {
    return json;
  }
  if (json && typeof json === 'object') {
    for (const value of Object.values(json)) {
      const array = getFirstArray(value);
      if (array) {
        return array;
      }
    }
  }
  return null;
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
  if (options.json?.shape !== 'arrow-table' || !options.json.schema) {
    return [];
  }

  const schema = normalizeJSONArrowSchema(options.json.schema);
  return schema.fields.filter(field => field.type === 'utf8').map(field => field.name);
}

/**
 * Returns the loader log object from normalized or deprecated option locations.
 *
 * @param options - Normalized JSON table loader options.
 * @returns Logger object, when supplied by the caller.
 */
function getJSONTableLoaderLog(options: JSONTableLoaderOptions): any {
  return options.core?.log || options.log;
}

/**
 * Ensures Arrow-only options are used only when Arrow-table output is requested.
 *
 * @param options - Normalized JSON table loader options.
 * @throws If Arrow conversion options are supplied without `json.shape: 'arrow-table'`.
 */
function validateJSONTableArrowOptions(options: JSONTableLoaderOptions): void {
  const hasArrowOnlyOptions = Boolean(options.json?.schema || options.json?.arrowConversion);
  if (hasArrowOnlyOptions && options.json?.shape !== 'arrow-table') {
    throw new Error(
      'JSONTableLoader: json.schema and json.arrowConversion require json.shape to be "arrow-table"'
    );
  }
}

export type {JSONTableLoaderOptions} from './json-table-loader';
