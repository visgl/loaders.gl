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
import {makeTableFromData} from '@loaders.gl/schema-utils';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import {
  convertRowTableToArrowTable,
  convertTableBatchesToArrow
} from './lib/parsers/convert-row-table-to-arrow';
import {
  JSONLoader as JSONLoaderMetadata,
  type JSONBatch,
  type JSONLoaderOptions,
  type MetadataBatch
} from './json-loader';

const {preload: _JSONLoaderPreload, ...JSONLoaderMetadataWithoutPreload} = JSONLoaderMetadata;

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
  validateJSONArrowOptions(jsonOptions as JSONLoaderOptions);
  if (jsonOptions.json?.shape !== 'arrow-table') {
    const json = parseJSONSync(text, jsonOptions as JSONLoaderOptions);
    return json;
  }

  const json = parseJSONSync(text, getRawJSONOptions(jsonOptions as JSONLoaderOptions));
  const table = getArrowCompatibleTable(json, jsonOptions as JSONLoaderOptions);
  return table
    ? convertRowTableToArrowTable(table, {
        schema: jsonOptions.json.schema,
        arrowConversion: jsonOptions.json.arrowConversion,
        log: getJSONLoaderLog(jsonOptions as JSONLoaderOptions)
      })
    : json;
}

/** Requests raw JSON from the shared parser before Arrow conversion. */
function getRawJSONOptions(options: JSONLoaderOptions): JSONLoaderOptions {
  return {
    ...options,
    json: {
      ...options.json,
      shape: undefined,
      table: false
    }
  };
}

function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = {...options, json: {...JSONLoaderWithParser.options.json, ...options?.json}};
  validateJSONArrowOptions(jsonOptions as JSONLoaderOptions);
  if (jsonOptions.json?.shape !== 'arrow-table') {
    return parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions);
  }

  return convertTableBatchesToArrow(
    parseJSONInBatches(asyncIterator, getRowBatchJSONOptions(jsonOptions as JSONLoaderOptions)),
    {
      schema: jsonOptions.json.schema,
      arrowConversion: jsonOptions.json.arrowConversion,
      log: getJSONLoaderLog(jsonOptions as JSONLoaderOptions)
    }
  );
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

  if (
    (options.json?.table || options.json?.shape === 'arrow-table') &&
    json &&
    typeof json === 'object'
  ) {
    const firstArray = getFirstArray(json);
    if (firstArray) {
      if (firstArray.length === 0) {
        return {shape: 'array-row-table', schema: {fields: [], metadata: {}}, data: []};
      }
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

/** Removes Arrow shape from streaming parse options so metadata batches stay row-shaped. */
function getRowBatchJSONOptions(options: JSONLoaderOptions): JSONLoaderOptions {
  return {
    ...options,
    json: {
      ...options.json,
      shape: undefined
    }
  };
}

/** Returns the loader log object from normalized or deprecated option locations. */
function getJSONLoaderLog(options: JSONLoaderOptions): any {
  return options.core?.log || options.log;
}

function validateJSONArrowOptions(options: JSONLoaderOptions): void {
  const hasArrowOnlyOptions = Boolean(options.json?.schema || options.json?.arrowConversion);
  if (hasArrowOnlyOptions && options.json?.shape !== 'arrow-table') {
    throw new Error(
      'JSONLoader: json.schema and json.arrowConversion require json.shape to be "arrow-table"'
    );
  }
}

export type {JSONBatch, JSONLoaderOptions, MetadataBatch} from './json-loader';
