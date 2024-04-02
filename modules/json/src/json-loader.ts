// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, TableBatch, Batch} from '@loaders.gl/schema';
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';

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
  json?: {
    /** Not specifying shape leaves avoids changes */
    shape?: 'object-row-table' | 'array-row-table';
    table?: boolean;
    jsonpaths?: string[];
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
      jsonpaths: []
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
  return parseJSONSync(text, jsonOptions as JSONLoaderOptions);
}

function parseInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: JSONLoaderOptions
): AsyncIterable<TableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = {...options, json: {...JSONLoader.options.json, ...options?.json}};
  return parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions);
}
