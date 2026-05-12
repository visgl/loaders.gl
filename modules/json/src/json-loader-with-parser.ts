// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TableBatch} from '@loaders.gl/schema';
import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseJSONSync} from './lib/parsers/parse-json';
import {parseJSONInBatches} from './lib/parsers/parse-json-in-batches';
import FastStreamingJSONParser from './lib/json-parser/fast-streaming-json-parser';
import type {StreamingJSONParserFactory} from './lib/json-parser/streaming-json-parser-types';
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
  unknown,
  TableBatch | MetadataBatch | JSONBatch,
  JSONLoaderOptions
>;

async function parse(arrayBuffer: ArrayBuffer, options?: JSONLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(text: string, options?: JSONLoaderOptions) {
  const jsonOptions = {...options, json: {...JSONLoaderWithParser.options.json, ...options?.json}};
  return parseJSONSync(text, jsonOptions as JSONLoaderOptions);
}

function parseInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: JSONLoaderOptions
): AsyncIterable<TableBatch | MetadataBatch | JSONBatch> {
  const jsonOptions = {...options, json: {...JSONLoaderWithParser.options.json, ...options?.json}};
  const parseOptions =
    jsonOptions.json?.backend === 'fast'
      ? {parserFactory: getFastStreamingJSONParserFactory()}
      : undefined;
  return parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions, parseOptions);
}

/**
 * Returns a factory for the fast streaming JSON parser backend.
 *
 * @returns Parser factory that constructs `FastStreamingJSONParser` instances.
 */
function getFastStreamingJSONParserFactory(): StreamingJSONParserFactory {
  return parserOptions => new FastStreamingJSONParser(parserOptions);
}

export type {JSONBatch, JSONLoaderOptions, MetadataBatch} from './json-loader';
