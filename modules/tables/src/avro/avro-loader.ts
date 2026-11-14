// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {concatenateArrayBuffersAsync, type LoaderWithParser} from '@loaders.gl/core/loader-utils';
import type {Table, RecordBatch} from 'apache-arrow';
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
  async parse(arrayBuffer: ArrayBuffer, options?: AvroLoaderOptions): Promise<Table> {
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
  async parseUrl(url: string, options?: AvroLoaderOptions): Promise<Table> {
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
  async parseFile(file, options?: AvroLoaderOptions): Promise<Table> {
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
    for await (const batch of parseAvroInBatches(
      arrayBuffer,
      typeof options?.core?.batchSize === 'number'
        ? options.core.batchSize
        : options?.avro?.batchSize,
      {
        readerSchema: options?.avro?.readerSchema,
        longType: options?.avro?.longType,
        schema: options?.avro?.schema,
        encoding: options?.avro?.encoding,
        validateFingerprint: options?.avro?.validateFingerprint,
        blockIndices: options?.avro?.blockIndices
      }
    )) {
      yield* batch.batches;
    }
  },
  async *parseInBatchesFromUrl(url: string, options?: AvroLoaderOptions) {
    for await (const batch of parseAvroInBatchesFromUrl(url, {
      readerSchema: options?.avro?.readerSchema,
      longType: options?.avro?.longType,
      schema: options?.avro?.schema,
      encoding: options?.avro?.encoding,
      validateFingerprint: options?.avro?.validateFingerprint,
      blockIndices: options?.avro?.blockIndices,
      batchSize:
        typeof options?.core?.batchSize === 'number'
          ? options.core.batchSize
          : options?.avro?.batchSize,
      headers: options?.avro?.headers,
      signal: options?.avro?.signal,
      rangeChunkSize: options?.avro?.rangeChunkSize
    })) {
      yield* batch.batches;
    }
  }
} as const satisfies LoaderWithParser<Table, RecordBatch, AvroLoaderOptions> & {
  parseUrl: (url: string, options?: AvroLoaderOptions) => Promise<Table>;
  parseFile: (
    file: import('@loaders.gl/core/loader-utils').ReadableFile,
    options?: AvroLoaderOptions
  ) => Promise<Table>;
  parseInBatchesFromUrl: (url: string, options?: AvroLoaderOptions) => AsyncIterable<RecordBatch>;
};
