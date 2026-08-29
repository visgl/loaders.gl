// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {AvroFormat} from './avro-format';

// __VERSION__ is injected by the build tooling.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for the Apache Avro loader. */
export type AvroLoaderOptions = {
  avro?: {
    /** Maximum number of rows yielded by each parseInBatches result. */
    batchSize?: number;
    /** Reader schema used for projection and compatible schema evolution. */
    readerSchema?: unknown;
    /** Representation for Avro long values; number is the default for compatibility. */
    longType?: 'number' | 'bigint';
    /** External schema used for raw datum and single-object encodings. */
    schema?: unknown;
    /** Input encoding; auto detects Object Container and single-object files. */
    encoding?: 'auto' | 'ocf' | 'raw' | 'single-object';
    /** Validate the 64-bit schema fingerprint in single-object encodings. Defaults to true. */
    validateFingerprint?: boolean;
    /** Optional zero-based OCF block indices to decode; omitted means all blocks. */
    blockIndices?: number[];
    /** Additional headers sent with URL-backed range requests. */
    headers?: Record<string, string>;
    /** Abort signal for URL-backed range requests. */
    signal?: AbortSignal;
    /** Initial range size used to discover the OCF header. */
    rangeChunkSize?: number;
  };
};

/** Preloads the parser-bearing Avro loader implementation. */
async function preloadAvroLoader() {
  const {AvroLoaderWithParser} = await import('@loaders.gl/avro/avro-loader');
  return AvroLoaderWithParser;
}

/** Metadata-only loader for Apache Avro Object Container Files. */
export const AvroLoader = {
  ...AvroFormat,
  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,
  version: VERSION,
  worker: false,
  options: {},
  preload: preloadAvroLoader
} as const satisfies Loader<ArrowTable, ArrowTableBatch, AvroLoaderOptions>;
