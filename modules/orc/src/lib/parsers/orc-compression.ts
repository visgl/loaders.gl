// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  DeflateDecompressor,
  LZ4Decompressor,
  SnappyDecompressor,
  ZstdDecompressor
} from '@loaders.gl/compression';
import type {Decompressor} from '@loaders.gl/compression';
import type {ORCCompression} from './parse-orc';

/** Decompresses an ORC compression stream made of 3-byte framed chunks. */
export function decompressORCStream(bytes: Uint8Array, compression: ORCCompression): Uint8Array {
  if (compression === 'NONE') return bytes.slice();
  if (!['ZLIB', 'SNAPPY', 'LZ4', 'ZSTD'].includes(compression))
    throw new Error(`ORC compression "${compression}" is not supported yet`);
  const output: Uint8Array[] = [];
  const deflateDecompressor = new DeflateDecompressor();
  const rawDeflateDecompressor = new DeflateDecompressor({raw: true});
  const snappyDecompressor = new SnappyDecompressor();
  const lz4Decompressor = new LZ4Decompressor();
  const zstdDecompressor = new ZstdDecompressor();
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
        deflateDecompressor,
        rawDeflateDecompressor,
        snappyDecompressor,
        lz4Decompressor,
        zstdDecompressor
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
  zstdDecompressor: Decompressor
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
  if (compression === 'LZ4') return lz4Decompressor.decompressSync(chunkBuffer, 256 * 1024);
  return zstdDecompressor.decompressSync(chunkBuffer);
}

/** Preloads optional ORC codec implementations for synchronous stream decoding. */
export async function preloadORCCompression(modules: Record<string, any> = {}): Promise<void> {
  await Promise.all([
    new SnappyDecompressor({modules}).preload(modules),
    new LZ4Decompressor({modules}).preload(modules),
    new ZstdDecompressor({modules}).preload(modules)
  ]);
}
