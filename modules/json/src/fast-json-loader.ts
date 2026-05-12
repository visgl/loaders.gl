// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableBatch} from '@loaders.gl/schema';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {JSONBatch, JSONLoaderOptions, MetadataBatch} from './json-loader';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import FastStreamingJSONParser from './lib/json-parser/fast-streaming-json-parser';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Experimental JSON loader that uses the fast streaming parser backend.
 */
export const FastJSONLoader = {
  dataType: null as unknown,
  batchType: null as unknown as TableBatch | MetadataBatch | JSONBatch,

  name: 'Fast JSON',
  id: 'fast-json',
  module: 'json',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
  category: 'table',
  text: true,
  options: {
    json: {
      backend: 'fast',
      shape: undefined,
      table: false,
      jsonpaths: []
    }
  },
  parse,
  parseTextSync,
  parseInBatches
} as const satisfies LoaderWithParser<
  unknown,
  TableBatch | MetadataBatch | JSONBatch,
  JSONLoaderOptions
>;

/**
 * Parses JSON from an ArrayBuffer.
 *
 * @param arrayBuffer - UTF-8 encoded JSON payload.
 * @param options - JSON loader options.
 * @returns Parsed JSON data using the atomic JSON parser path.
 */
async function parse(arrayBuffer: ArrayBuffer, options?: JSONLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

/**
 * Parses JSON text synchronously with the standard JSON.parse code path.
 *
 * @param text - JSON text to parse.
 * @param options - JSON loader options.
 * @returns Parsed JSON data or table output.
 */
function parseTextSync(text: string, options?: JSONLoaderOptions) {
  const jsonOptions = {...options, json: {...FastJSONLoader.options.json, ...options?.json}};
  return parseJSONSync(text, jsonOptions as JSONLoaderOptions);
}

/**
 * Parses JSON in batches using the fast streaming parser backend.
 *
 * @param asyncIterator - Iterable or async iterable of binary JSON chunks.
 * @param options - JSON loader options.
 * @returns Async iterable of parsed JSON batches.
 */
function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JSONLoaderOptions
): AsyncIterable<TableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = {...options, json: {...FastJSONLoader.options.json, ...options?.json}};
  return parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions, {
    parserFactory: parserOptions => new FastStreamingJSONParser(parserOptions)
  });
}
