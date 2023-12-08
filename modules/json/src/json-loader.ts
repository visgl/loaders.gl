// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, TableBatch} from '@loaders.gl/schema';
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type ParseJSONOptions = {
  shape: 'object-row-table'; // TODO - 'auto'?
  table?: boolean;
  jsonpaths?: string[];
};

/**
 * @param table -
 * @param jsonpaths -
 */
export type JSONLoaderOptions = LoaderOptions & {
  json?: ParseJSONOptions;
};

const DEFAULT_JSON_LOADER_OPTIONS: {json: Required<ParseJSONOptions>} = {
  json: {
    shape: 'object-row-table',
    table: false,
    jsonpaths: []
    // batchSize: 'auto'
  }
};

export const JSONLoader: LoaderWithParser<Table, TableBatch, JSONLoaderOptions> = {
  name: 'JSON',
  id: 'json',
  module: 'json',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
  category: 'table',
  text: true,
  parse,
  parseTextSync,
  parseInBatches,
  options: DEFAULT_JSON_LOADER_OPTIONS
};

async function parse(arrayBuffer: ArrayBuffer, options?: JSONLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(text: string, options?: JSONLoaderOptions) {
  const jsonOptions = {...options, json: {...DEFAULT_JSON_LOADER_OPTIONS.json, ...options?.json}};
  return parseJSONSync(text, jsonOptions as JSONLoaderOptions);
}

function parseInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: JSONLoaderOptions
): AsyncIterable<TableBatch> {
  const jsonOptions = {...options, json: {...DEFAULT_JSON_LOADER_OPTIONS.json, ...options?.json}};
  return parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions);
}
