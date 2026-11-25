// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FastJSONLoaderMetadata} from './fast-json-loader-metadata';
import type {RecordBatch} from 'apache-arrow';
import type {TableBatch} from '@loaders.gl/core/schema';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {JSONBatch, JSONLoaderOptions, MetadataBatch} from './json-loader-types';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import {convertTableBatchesToArrow} from './lib/parsers/convert-row-table-to-arrow';
import FastStreamingJSONParser from './lib/json-parser/fast-streaming-json-parser';

/**
 * Experimental JSON loader that uses the fast streaming parser backend.
 */
export const FastJSONLoader = {
  ...FastJSONLoaderMetadata,
  parse,
  parseTextSync,
  parseInBatches
} as const satisfies LoaderWithParser<
  unknown,
  TableBatch | RecordBatch | MetadataBatch | JSONBatch,
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
): AsyncIterable<TableBatch | RecordBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = {...options, json: {...FastJSONLoader.options.json, ...options?.json}};
  const batches = parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions, {
    parserFactory: parserOptions => new FastStreamingJSONParser(parserOptions)
  });
  return jsonOptions.json?.table && jsonOptions.json.shape === undefined
    ? convertTableBatchesToArrow<MetadataBatch | JSONBatch>(batches)
    : batches;
}
