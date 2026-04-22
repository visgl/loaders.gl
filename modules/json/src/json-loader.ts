// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrayRowTable,
  ArrowTableBatch,
  Batch,
  ObjectRowTable,
  Schema,
  Table,
  TableBatch
} from '@loaders.gl/schema';
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type * as arrow from 'apache-arrow';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import {
  type ArrowConversionOptions,
  convertRowTableToArrowTable,
  normalizeJSONArrowSchema
} from './lib/parsers/parse-ndjson-to-arrow';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type MetadataBatch = Batch & {
  shape: 'metadata';
};

export type JSONBatch = Batch & {
  shape: 'json';
  /** JSON data */
  container: any;
};

/**
 * @param table -
 * @param jsonpaths -
 */
export type JSONLoaderOptions = LoaderOptions & {
  /** JSON parser options. */
  json?: {
    /** Requested output shape. Omitting shape preserves the default JSON result. */
    shape?: 'object-row-table' | 'array-row-table' | 'arrow-table';
    /** Whether non-streaming JSON should be interpreted as table rows. */
    table?: boolean;
    /** JSON paths identifying arrays that can be streamed as row batches. */
    jsonpaths?: string[];
    /** Optional schema used when converting JSON rows to Arrow. */
    schema?: Schema | arrow.Schema;
    /** Optional recovery policy used when converting JSON rows to Arrow. */
    arrowConversion?: ArrowConversionOptions;
  };
};

export const JSONLoader = {
  dataType: null as unknown as Table,
  batchType: null as unknown as TableBatch | MetadataBatch | JSONBatch,

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
  Table,
  TableBatch | MetadataBatch | JSONBatch,
  JSONLoaderOptions
>;

async function parse(arrayBuffer: ArrayBuffer, options?: JSONLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(text: string, options?: JSONLoaderOptions) {
  const jsonOptions = {...options, json: {...JSONLoader.options.json, ...options?.json}};
  validateJSONArrowOptions(jsonOptions as JSONLoaderOptions);
  return parseJSONSync(text, jsonOptions as JSONLoaderOptions);
}

function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JSONLoaderOptions
): AsyncIterable<TableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = {...options, json: {...JSONLoader.options.json, ...options?.json}};
  validateJSONArrowOptions(jsonOptions as JSONLoaderOptions);
  if (jsonOptions.json?.shape === 'arrow-table') {
    return makeJSONArrowBatchIterator(
      parseJSONInBatches(asyncIterator, getRowBatchJSONOptions(jsonOptions as JSONLoaderOptions)),
      jsonOptions as JSONLoaderOptions
    );
  }
  return parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions);
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
