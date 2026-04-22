// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  ArrowTable,
  ArrowTableBatch,
  Batch,
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
  convertTableBatchesToArrow
} from './lib/parsers/convert-row-table-to-arrow';

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
  /** JSON data. */
  container: any;
};

/** Options for parsing JSON documents and tabular selections. */
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
  validateJSONArrowOptions(jsonOptions as JSONLoaderOptions);
  return parseJSONSync(text, jsonOptions as JSONLoaderOptions);
}

function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JSONLoaderOptions
): AsyncIterable<TableBatch | ArrowTableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = {...options, json: {...JSONLoader.options.json, ...options?.json}};
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
