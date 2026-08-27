// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {DeflateCompression} from '@loaders.gl/compression/deflate-compression';
import {LZ4Compression} from '@loaders.gl/compression/lz4-compression';
import {SnappyCompression} from '@loaders.gl/compression/snappy-compression';
import {ZstdCompression} from '@loaders.gl/compression/zstd-compression';
import type {ORCCompression} from './parse-orc';

/** Decompresses an ORC compression stream made of 3-byte framed chunks. */
export function decompressORCStream(bytes: Uint8Array, compression: ORCCompression): Uint8Array {
  if (compression === 'NONE') return bytes.slice();
  if (!['ZLIB', 'SNAPPY', 'LZ4', 'ZSTD'].includes(compression))
    throw new Error(`ORC compression "${compression}" is not supported yet`);
  const output: Uint8Array[] = [];
  const deflateCompression = new DeflateCompression();
  const rawDeflateCompression = new DeflateCompression({raw: true});
  const snappyCompression = new SnappyCompression();
  const lz4Compression = new LZ4Compression();
  const zstdCompression = new ZstdCompression();
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
        deflateCompression,
        rawDeflateCompression,
        snappyCompression,
        lz4Compression,
        zstdCompression
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
  deflateCompression: DeflateCompression,
  rawDeflateCompression: DeflateCompression,
  snappyCompression: SnappyCompression,
  lz4Compression: LZ4Compression,
  zstdCompression: ZstdCompression
): ArrayBuffer {
  if (compression === 'ZLIB') {
    try {
      return deflateCompression.decompressSync(chunkBuffer);
    } catch (error) {
      try {
        return rawDeflateCompression.decompressSync(chunkBuffer);
      } catch {
        throw error;
      }
    }
  }
  if (compression === 'SNAPPY') return snappyCompression.decompressSync(chunkBuffer);
  if (compression === 'LZ4') return lz4Compression.decompressSync(chunkBuffer, 256 * 1024);
  return zstdCompression.decompressSync(chunkBuffer);
}

/** Preloads optional ORC codec implementations for synchronous stream decoding. */
export async function preloadORCCompression(modules: Record<string, any> = {}): Promise<void> {
  await Promise.all([
    new SnappyCompression({modules}).preload(modules),
    new LZ4Compression({modules}).preload(modules),
    new ZstdCompression({modules}).preload(modules)
  ]);
}
