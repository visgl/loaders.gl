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
import {
  convertRowTableToArrowTable,
  convertTableBatchesToArrow
} from './lib/parsers/convert-row-table-to-arrow';
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

async function parse(arrayBuffer: ArrayBuffer, options?: JSONLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(text: string, options?: JSONLoaderOptions) {
  const jsonOptions = {...options, json: {...JSONLoaderWithParser.options.json, ...options?.json}};
  const json = parseJSONSync(text, jsonOptions as JSONLoaderOptions);
  if (jsonOptions.json?.shape !== 'arrow-table') {
    return json;
  }

  const table = getArrowCompatibleTable(json, jsonOptions as JSONLoaderOptions);
  return table ? convertRowTableToArrowTable(table) : json;
}

function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = {...options, json: {...JSONLoaderWithParser.options.json, ...options?.json}};
  const batches = parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions);
  return jsonOptions.json?.shape === 'arrow-table' ? convertTableBatchesToArrow(batches) : batches;
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
