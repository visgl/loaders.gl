// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {BlobFile} from '@loaders.gl/loader-utils';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/schema';
import {parseParquetFile, parseParquetFileInBatches} from './lib/parsers/parse-parquet-to-json';
import {ParquetJSONWorkerLoader, type ParquetJSONLoaderOptions} from './parquet-json-loader';

/** Options for the TypeScript-backed `ParquetJSLoader`. */
export type ParquetJSLoaderOptions = ParquetJSONLoaderOptions;

/**
 * Parser-bearing Parquet loader that uses the built-in TypeScript decoder.
 *
 * This opt-in loader preserves the existing Parquet JSON-loader output while making the
 * TypeScript backend explicit. The legacy `ParquetLoader` alias remains unchanged.
 */
export const ParquetJSLoader = {
  ...ParquetJSONWorkerLoader,
  id: 'parquet-js',
  worker: false,
  parse: (arrayBuffer: ArrayBuffer, options?: ParquetJSLoaderOptions) =>
    parseParquetFile(new BlobFile(arrayBuffer), options),
  parseFile: parseParquetFile,
  parseFileInBatches: parseParquetFileInBatches
} as const satisfies LoaderWithParser<ObjectRowTable, ObjectRowTableBatch, ParquetJSLoaderOptions>;
