// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrayRowTable,
  ArrowTable,
  ArrowTableBatch,
  Batch,
  ObjectRowTable,
  Table,
  TableBatch
} from '@loaders.gl/schema';
import {makeTableFromData} from '@loaders.gl/schema-utils';
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import FastStreamingJSONParser from './lib/json-parser/fast-streaming-json-parser';
import {
  convertRowTableToArrowTable,
  convertTableBatchesToArrow
} from './lib/parsers/convert-row-table-to-arrow';
import type {StreamingJSONParserFactory} from './lib/json-parser/streaming-json-parser-types';
import {JSONLoader as JSONLoaderMetadata} from './json-loader';

const {preload: _JSONLoaderPreload, ...JSONLoaderMetadataWithoutPreload} = JSONLoaderMetadata;

/** Metadata batch emitted while streaming JSON. */
export type MetadataBatch = Batch & {
  shape: 'metadata';
};

/** Partial or final container object emitted while streaming JSON. */
export type JSONBatch = Batch & {
  shape: 'json';
  /** JSON data */
  container: any;
};

/** Options for parsing JSON documents and tabular selections. */
export type JSONLoaderOptions = LoaderOptions & {
  json?: {
    /** Selects the streaming JSON parser backend. */
    backend?: 'clarinet' | 'fast';
    /** Selects row-table output or Apache Arrow output for tabular JSON. */
    shape?: 'object-row-table' | 'array-row-table' | 'arrow-table';
    /** Enables table extraction from non-streaming JSON. */
    table?: boolean;
    /** Selects one or more JSON arrays to stream. */
    jsonpaths?: string[];
  };
};

/** Loader for JSON documents, including tabular JSON and streaming table extraction. */
export const JSONLoaderWithParser = {
  ...JSONLoaderMetadataWithoutPreload,
  parse,
  parseTextSync,
  parseInBatches
} as const satisfies LoaderWithParser<
  Table | ArrowTable,
  TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,
  JSONLoaderOptions
>;

/**
 * Parses JSON from an ArrayBuffer using the configured JSON loader options.
 *
 * @param arrayBuffer - UTF-8 encoded JSON payload.
 * @param options - JSON loader options.
 * @returns Parsed JSON, row table, or Arrow table output.
 */
async function parse(arrayBuffer: ArrayBuffer, options?: JSONLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

/**
 * Parses JSON text synchronously using the atomic JSON parser path.
 *
 * @param text - JSON text to parse.
 * @param options - JSON loader options.
 * @returns Parsed JSON, row table, or Arrow table output.
 */
function parseTextSync(text: string, options?: JSONLoaderOptions) {
  const jsonOptions = {...options, json: {...JSONLoaderWithParser.options.json, ...options?.json}};
  const json = parseJSONSync(text, jsonOptions as JSONLoaderOptions);
  if (jsonOptions.json?.shape !== 'arrow-table') {
    return json;
  }

  const table = getArrowCompatibleTable(json, jsonOptions as JSONLoaderOptions);
  return table ? convertRowTableToArrowTable(table) : json;
}

/**
 * Parses JSON incrementally and yields table or metadata batches.
 *
 * @param asyncIterator - Iterable or async iterable of binary JSON chunks.
 * @param options - JSON loader options, including the optional streaming backend.
 * @returns Async iterable of parsed JSON batches.
 */
function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = {...options, json: {...JSONLoaderWithParser.options.json, ...options?.json}};
  const parseOptions =
    jsonOptions.json?.backend === 'fast'
      ? {parserFactory: getFastStreamingJSONParserFactory()}
      : undefined;
  const batches = parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions, parseOptions);
  return jsonOptions.json?.shape === 'arrow-table' ? convertTableBatchesToArrow(batches) : batches;
}

/**
 * Returns a factory for the fast streaming JSON parser backend.
 *
 * @returns Parser factory that constructs `FastStreamingJSONParser` instances.
 */
function getFastStreamingJSONParserFactory(): StreamingJSONParserFactory {
  return parserOptions => new FastStreamingJSONParser(parserOptions);
}

/**
 * Returns a row table that can be converted to Arrow when the parsed JSON is tabular.
 *
 * @param json - Parsed JSON value or row table returned from the JSON parser.
 * @param options - Normalized JSON loader options.
 * @returns Row table when the parsed JSON is tabular, otherwise `null`.
 */
function getArrowCompatibleTable(
  json: unknown,
  options: JSONLoaderOptions
): ArrayRowTable | ObjectRowTable | null {
  if (isRowTable(json)) {
    return json;
  }

  if (Array.isArray(json)) {
    if (json.length === 0) {
      return {shape: 'array-row-table', schema: {fields: [], metadata: {}}, data: []};
    }

    const firstRow = json[0];
    if (Array.isArray(firstRow)) {
      return makeTableFromData(json as unknown[][]);
    }

    if (firstRow && typeof firstRow === 'object') {
      return makeTableFromData(json as {[key: string]: unknown}[]);
    }
  }

  if (options.json?.table && json && typeof json === 'object') {
    const firstArray = getFirstArray(json);
    if (firstArray?.length) {
      return Array.isArray(firstArray[0])
        ? makeTableFromData(firstArray as unknown[][])
        : makeTableFromData(firstArray as {[key: string]: unknown}[]);
    }
  }

  return null;
}

/**
 * Checks whether a parsed JSON value is already a row-table wrapper.
 *
 * @param value - Parsed JSON value.
 * @returns `true` when the value is an array-row or object-row table.
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
 * Finds the first nested array within a parsed JSON object.
 *
 * @param json - Parsed JSON object.
 * @returns The first nested array, if one exists.
 */
function getFirstArray(json: unknown): unknown[][] | {[key: string]: unknown}[] | null {
  if (Array.isArray(json)) {
    return json as unknown[][] | {[key: string]: unknown}[];
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
