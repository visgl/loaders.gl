// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {LZ4Decompressor, SnappyDecompressor, ZstdDecompressor} from '@loaders.gl/compression';
import {DeflateDecompressor} from '@loaders.gl/compression/deflate-decompressor';
import type {Decompressor} from '@loaders.gl/compression';
import type {ORCCompression} from './parse-orc';

const DEFLATE_DECOMPRESSOR = new DeflateDecompressor({useNative: false});
const RAW_DEFLATE_DECOMPRESSOR = new DeflateDecompressor({raw: true, useNative: false});
const SNAPPY_DECOMPRESSOR = new SnappyDecompressor();
const LZ4_DECOMPRESSOR = new LZ4Decompressor();
const ZSTD_DECOMPRESSOR = new ZstdDecompressor();

/** Decompresses an ORC compression stream made of 3-byte framed chunks. */
export function decompressORCStream(
  bytes: Uint8Array,
  compression: ORCCompression,
  compressionBlockSize = 256 * 1024
): Uint8Array {
  if (compression === 'NONE') return bytes.slice();
  if (!['ZLIB', 'SNAPPY', 'LZ4', 'ZSTD'].includes(compression))
    throw new Error(`ORC compression "${compression}" is not supported yet`);
  const output: Uint8Array[] = [];
  let offset = 0;
  while (offset < bytes.length) {
    if (offset + 3 > bytes.length) throw new Error('Truncated ORC compression chunk header');
    const header = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
    offset += 3;
    const isOriginal = Boolean(header & 1);
    const chunkLength = header >>> 1;
    if (offset + chunkLength > bytes.length) throw new Error('Truncated ORC compression chunk');
    const chunk = bytes.subarray(offset, offset + chunkLength);
    offset += chunkLength;
    if (isOriginal) output.push(chunk.slice());
    else {
      const chunkBuffer = chunk.slice().buffer as ArrayBuffer;
      const decompressedChunk = decompressORCChunk(
        chunkBuffer,
        compression,
        DEFLATE_DECOMPRESSOR,
        RAW_DEFLATE_DECOMPRESSOR,
        SNAPPY_DECOMPRESSOR,
        LZ4_DECOMPRESSOR,
        ZSTD_DECOMPRESSOR,
        compressionBlockSize
      );
      output.push(new Uint8Array(decompressedChunk));
    }
  }
  const result = new Uint8Array(output.reduce((length, chunk) => length + chunk.length, 0));
  let resultOffset = 0;
  for (const chunk of output) {
    result.set(chunk, resultOffset);
    resultOffset += chunk.length;
  }
  return result;
}

/** Decompresses one ORC chunk, accepting both ZLIB-wrapped and raw DEFLATE streams. */
function decompressORCChunk(
  chunkBuffer: ArrayBuffer,
  compression: ORCCompression,
  deflateDecompressor: Decompressor,
  rawDeflateDecompressor: Decompressor,
  snappyDecompressor: Decompressor,
  lz4Decompressor: Decompressor,
  zstdDecompressor: Decompressor,
  compressionBlockSize: number
): ArrayBuffer {
  if (compression === 'ZLIB') {
    try {
      return deflateDecompressor.decompressSync(chunkBuffer);
    } catch (error) {
      try {
        return rawDeflateDecompressor.decompressSync(chunkBuffer);
      } catch {
        throw error;
      }
    }
  }
  if (compression === 'SNAPPY') return snappyDecompressor.decompressSync(chunkBuffer);
  if (compression === 'LZ4')
    return lz4Decompressor.decompressSync(chunkBuffer, compressionBlockSize);
  return zstdDecompressor.decompressSync(chunkBuffer);
}

/** Preloads optional ORC codec implementations for synchronous stream decoding. */
export async function preloadORCCompression(modules: Record<string, any> = {}): Promise<void> {
  await Promise.all([
    DEFLATE_DECOMPRESSOR.preload(modules),
    RAW_DEFLATE_DECOMPRESSOR.preload(modules),
    SNAPPY_DECOMPRESSOR.preload(modules),
    LZ4_DECOMPRESSOR.preload(modules),
    ZSTD_DECOMPRESSOR.preload(modules)
  ]);
}
