// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {concatenateArrayBuffersAsync, type LoaderWithParser} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {AvroLoader as AvroLoaderMetadata} from './avro-loader-types';
import {
  parseAvro,
  parseAvroFromFile,
  parseAvroFromUrl,
  parseAvroInBatches,
  parseAvroInBatchesFromUrl
} from './lib/parsers/parse-avro';
import type {AvroLoaderOptions} from './avro-loader-types';

const {preload: _AvroLoaderPreload, ...AvroLoaderMetadataWithoutPreload} = AvroLoaderMetadata;

/** Loader for Apache Avro Object Container Files. */
export const AvroLoaderWithParser = {
  ...AvroLoaderMetadataWithoutPreload,
  async parse(arrayBuffer: ArrayBuffer, options?: AvroLoaderOptions): Promise<ArrowTable> {
    return parseAvro(arrayBuffer, {
      readerSchema: options?.avro?.readerSchema,
      longType: options?.avro?.longType,
      schema: options?.avro?.schema,
      encoding: options?.avro?.encoding,
      validateFingerprint: options?.avro?.validateFingerprint,
      blockIndices: options?.avro?.blockIndices,
      headers: options?.avro?.headers,
      signal: options?.avro?.signal,
      rangeChunkSize: options?.avro?.rangeChunkSize
    });
  },
  async parseUrl(url: string, options?: AvroLoaderOptions): Promise<ArrowTable> {
    return parseAvroFromUrl(url, {
      readerSchema: options?.avro?.readerSchema,
      longType: options?.avro?.longType,
      schema: options?.avro?.schema,
      encoding: options?.avro?.encoding,
      validateFingerprint: options?.avro?.validateFingerprint,
      blockIndices: options?.avro?.blockIndices,
      batchSize: options?.avro?.batchSize,
      headers: options?.avro?.headers,
      signal: options?.avro?.signal,
      rangeChunkSize: options?.avro?.rangeChunkSize
    });
  },
  async parseFile(file, options?: AvroLoaderOptions): Promise<ArrowTable> {
    return parseAvroFromFile(file, {
      readerSchema: options?.avro?.readerSchema,
      longType: options?.avro?.longType,
      schema: options?.avro?.schema,
      encoding: options?.avro?.encoding,
      validateFingerprint: options?.avro?.validateFingerprint,
      blockIndices: options?.avro?.blockIndices,
      batchSize: options?.avro?.batchSize,
      signal: options?.avro?.signal,
      rangeChunkSize: options?.avro?.rangeChunkSize
    });
  },
  async *parseInBatches(asyncIterator, options?: AvroLoaderOptions) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseAvroInBatches(arrayBuffer, options?.avro?.batchSize, {
      readerSchema: options?.avro?.readerSchema,
      longType: options?.avro?.longType,
      schema: options?.avro?.schema,
      encoding: options?.avro?.encoding,
      validateFingerprint: options?.avro?.validateFingerprint,
      blockIndices: options?.avro?.blockIndices
    });
  },
  async *parseInBatchesFromUrl(url: string, options?: AvroLoaderOptions) {
    yield* parseAvroInBatchesFromUrl(url, {
      readerSchema: options?.avro?.readerSchema,
      longType: options?.avro?.longType,
      schema: options?.avro?.schema,
      encoding: options?.avro?.encoding,
      validateFingerprint: options?.avro?.validateFingerprint,
      blockIndices: options?.avro?.blockIndices,
      batchSize: options?.avro?.batchSize,
      headers: options?.avro?.headers,
      signal: options?.avro?.signal,
      rangeChunkSize: options?.avro?.rangeChunkSize
    });
  }
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, AvroLoaderOptions> & {
  parseUrl: (url: string, options?: AvroLoaderOptions) => Promise<ArrowTable>;
  parseFile: (
    file: import('@loaders.gl/loader-utils').ReadableFile,
    options?: AvroLoaderOptions
  ) => Promise<ArrowTable>;
  parseInBatchesFromUrl: (
    url: string,
    options?: AvroLoaderOptions
  ) => AsyncIterable<ArrowTableBatch>;
};
