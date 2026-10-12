// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {WorkerObject} from '@loaders.gl/worker-utils';
import {processOnWorker} from '@loaders.gl/worker-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type CompressionWorkerOptions = {
  compression: string;
  operation: 'compress' | 'decompress';
  /** Output capacity for raw LZ4 or LZO decoding. */
  expectedSize?: number;
  /** Maximum caller-supplied output capacity in bytes. Defaults to 512 MiB. */
  maxOutputByteLength?: number;
  /** Selects raw DEFLATE or LZ4 data. */
  raw?: boolean;
  /** Encoder/decoder settings forwarded to compress-utils. */
  compressUtils?: Record<string, unknown>;
  /** Enables native browser streams when available. */
  useNative?: boolean;
};

/**
 * Worker for Zlib real-time compression and decompression
 */
export const CompressionWorker = {
  id: 'compression',
  name: 'compression',
  module: 'compression',
  version: VERSION,
  options: {}
};

/**
 * Provide type safety
 */
export function compressOnWorker(
  data: ArrayBuffer,
  options: CompressionWorkerOptions
): Promise<ArrayBuffer> {
  return processOnWorker(CompressionWorker, data, options);
}
