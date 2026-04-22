// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrayRowTable,
<<<<<<< HEAD
  ArrowTableBatch,
  Batch,
  ObjectRowTable,
  Schema,
  Table,
  TableBatch
} from '@loaders.gl/schema';
=======
  ArrowTable,
  ArrowTableBatch,
  Batch,
  ObjectRowTable,
  Table,
  TableBatch
} from '@loaders.gl/schema';
import {makeTableFromData} from '@loaders.gl/schema-utils';
>>>>>>> master
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type * as arrow from 'apache-arrow';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import {
<<<<<<< HEAD
  type ArrowConversionOptions,
  convertRowTableToArrowTable,
  normalizeJSONArrowSchema
} from './lib/parsers/parse-ndjson-to-arrow';
=======
  convertRowTableToArrowTable,
  convertTableBatchesToArrow
} from './lib/parsers/convert-row-table-to-arrow';
>>>>>>> master

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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
  /** JSON parser options. */
  json?: {
<<<<<<< HEAD
    /** Requested output shape. Omitting shape preserves the default JSON result. */
    shape?: 'object-row-table' | 'array-row-table' | 'arrow-table';
    /** Whether non-streaming JSON should be interpreted as table rows. */
    table?: boolean;
    /** JSON paths identifying arrays that can be streamed as row batches. */
=======
    /** Selects row-table output or Apache Arrow output for tabular JSON. */
    shape?: 'object-row-table' | 'array-row-table' | 'arrow-table';
    /** Enables table extraction from non-streaming JSON. */
    table?: boolean;
    /** Selects one or more JSON arrays to stream. */
>>>>>>> master
    jsonpaths?: string[];
    /** Optional schema used when converting JSON rows to Arrow. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting JSON rows to Arrow. */
    arrowConversion?: ArrowConversionOptions;
  };
};

/** Loader for JSON documents, including tabular JSON and streaming table extraction. */
export const JSONLoader = {
  dataType: null as unknown as Table | ArrowTable,
  batchType: null as unknown as TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch,

  name: 'JSON',
  id: 'json',
  module: 'json',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
  category: 'table',
  text: true,
  options: {
    json: {
      shape: undefined,
      table: false,
      jsonpaths: [],
      schema: undefined,
      arrowConversion: undefined
      // batchSize: 'auto'
    }
  },
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
  const jsonOptions = {...options, json: {...JSONLoader.options.json, ...options?.json}};
<<<<<<< HEAD
  validateJSONArrowOptions(jsonOptions as JSONLoaderOptions);
  return parseJSONSync(text, jsonOptions as JSONLoaderOptions);
=======
  const json = parseJSONSync(text, jsonOptions as JSONLoaderOptions);
  if (jsonOptions.json?.shape !== 'arrow-table') {
    return json;
  }

  const table = getArrowCompatibleTable(json, jsonOptions as JSONLoaderOptions);
  return table ? convertRowTableToArrowTable(table) : json;
>>>>>>> master
}

function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = {...options, json: {...JSONLoader.options.json, ...options?.json}};
<<<<<<< HEAD
  validateJSONArrowOptions(jsonOptions as JSONLoaderOptions);
  if (jsonOptions.json?.shape === 'arrow-table') {
    return makeJSONArrowBatchIterator(
      parseJSONInBatches(asyncIterator, getRowBatchJSONOptions(jsonOptions as JSONLoaderOptions)),
      jsonOptions as JSONLoaderOptions
    );
  }
  return parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions);
=======
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
>>>>>>> master
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

/** Converts streamed JSON data batches to Arrow while preserving metadata batches. */
async function* makeJSONArrowBatchIterator(
  batches: AsyncIterable<TableBatch | MetadataBatch | JSONBatch>,
  options: JSONLoaderOptions
): AsyncIterable<TableBatch | MetadataBatch | JSONBatch> {
  let frozenSchema: ArrowTableBatch['schema'] | null = options.json?.schema
    ? normalizeJSONArrowSchema(options.json.schema)
    : null;

  for await (const batch of batches) {
    if (batch.batchType !== 'data') {
      yield batch;
      continue;
    }

    if (batch.shape !== 'array-row-table' && batch.shape !== 'object-row-table') {
      throw new Error(
        `JSONLoader: arrow-table shape requires row-table batches, got ${batch.shape}`
      );
    }

    const rowBatch = batch as ArrayRowTable | ObjectRowTable | TableBatch;
    const arrowTable = convertRowTableToArrowTable(rowBatch as ArrayRowTable | ObjectRowTable, {
      schema: frozenSchema || undefined,
      arrowConversion: options.json?.arrowConversion,
      log: getJSONLoaderLog(options)
    });

    if (!frozenSchema && arrowTable.data.numRows > 0) {
      frozenSchema = arrowTable.schema;
    }

    yield {
      ...batch,
      shape: 'arrow-table',
      schema: arrowTable.schema,
      data: arrowTable.data,
      length: arrowTable.data.numRows
    };
  }
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
