// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {Compression, Compressor, Decompressor} from '@loaders.gl/compression';
import {NoCompressor} from '@loaders.gl/compression/no-compressor';
import {NoDecompressor} from '@loaders.gl/compression/no-decompressor';
import {DeflateFflateCompression} from '@loaders.gl/compression/deflate-fflate';
import {GZipFflateCompression} from '@loaders.gl/compression/gzip-fflate';
import {GZipFflateCompressor} from '@loaders.gl/compression/gzip-compressor-fflate';
import {GZipFflateDecompressor} from '@loaders.gl/compression/gzip-decompressor-fflate';
import {DeflatePakoCompression} from '@loaders.gl/compression/deflate-pako';
import {GZipPakoCompression} from '@loaders.gl/compression/gzip-pako';
import {GZipPakoCompressor} from '@loaders.gl/compression/gzip-compressor-pako';
import {GZipPakoDecompressor} from '@loaders.gl/compression/gzip-decompressor-pako';
import {LZ4JSCompression} from '@loaders.gl/compression/lz4-lz4js';
import {SnappyJSCompression} from '@loaders.gl/compression/snappy-snappyjs';
import {ZstdFzstdDecompressor} from '@loaders.gl/compression/zstd-decompressor-fzstd';
import {ZstdCodecCompression} from '@loaders.gl/compression/zstd-zstd-codec';
import {BrotliShimDecompressor} from '@loaders.gl/compression/brotli-decompressor-shim';
import {BrotliCompressUtilsCompression} from '@loaders.gl/compression/brotli-compress-utils';
import {BZip2CompressUtilsCompression} from '@loaders.gl/compression/bzip2-compress-utils';
import {DeflateCompressUtilsCompression} from '@loaders.gl/compression/deflate-compress-utils';
import {GZipCompressUtilsCompression} from '@loaders.gl/compression/gzip-compress-utils';
import {GZipCompressUtilsCompressor} from '@loaders.gl/compression/gzip-compressor-compress-utils';
import {GZipCompressUtilsDecompressor} from '@loaders.gl/compression/gzip-decompressor-compress-utils';
import {LZ4CompressUtilsCompression} from '@loaders.gl/compression/lz4-compress-utils';
import {SnappyCompressUtilsCompression} from '@loaders.gl/compression/snappy-compress-utils';
import {XZCompressUtilsCompression} from '@loaders.gl/compression/xz-compress-utils';
import {ZstdCompressUtilsCompression} from '@loaders.gl/compression/zstd-compress-utils';

const TEST_BYTES = new TextEncoder().encode(
  'Explicit compression implementation bindings should remain independently importable. '.repeat(8)
);

describe('compression library bindings', () => {
  test.each([
    ['deflate-fflate', new DeflateFflateCompression()],
    ['gzip-fflate', new GZipFflateCompression()],
    ['deflate-pako', new DeflatePakoCompression()],
    ['gzip-pako', new GZipPakoCompression()],
    ['lz4-lz4js', new LZ4JSCompression()],
    ['snappy-snappyjs', new SnappyJSCompression()]
  ])('%s round trips data', async (_name, compression) => {
    await expectRoundTrip(compression);
  });

  test('zstd-decompressor-fzstd decodes zstd-codec output', async () => {
    const compressed = await new ZstdCodecCompression().compress(copyArrayBuffer(TEST_BYTES));
    const output = await new ZstdFzstdDecompressor().decompress(compressed);
    expect(new Uint8Array(output)).toEqual(TEST_BYTES);
  });

  test('brotli-decompressor-shim decodes compress-utils output', async () => {
    const compressed = await new BrotliCompressUtilsCompression().compress(
      copyArrayBuffer(TEST_BYTES)
    );
    const output = await new BrotliShimDecompressor().decompress(compressed);
    expect(new Uint8Array(output)).toEqual(TEST_BYTES);
  });

  test.each([
    ['brotli-compress-utils', new BrotliCompressUtilsCompression()],
    ['bzip2-compress-utils', new BZip2CompressUtilsCompression()],
    ['deflate-compress-utils', new DeflateCompressUtilsCompression()],
    ['gzip-compress-utils', new GZipCompressUtilsCompression()],
    ['lz4-compress-utils', new LZ4CompressUtilsCompression()],
    ['snappy-compress-utils', new SnappyCompressUtilsCompression()],
    ['xz-compress-utils', new XZCompressUtilsCompression()],
    ['zstd-compress-utils', new ZstdCompressUtilsCompression()]
  ])('%s round trips data', async (_name, compression) => {
    await expectRoundTrip(compression);
  });

  test('compress-utils binding streams incrementally', async () => {
    const compressor = new GZipCompressUtilsCompressor();
    const decompressor = new GZipCompressUtilsDecompressor();
    const inputBatches = [TEST_BYTES.subarray(0, 80), TEST_BYTES.subarray(80)].map(copyArrayBuffer);
    const compressedBatches = await collectBatches(compressor.compressBatches(inputBatches));
    const outputBatches = await collectBatches(decompressor.decompressBatches(compressedBatches));
    expect(concatenateBatches(outputBatches)).toEqual(TEST_BYTES);
  });

  test('direction-specific compress-utils bindings interoperate', async () => {
    const compressed = await new GZipCompressUtilsCompressor().compress(
      copyArrayBuffer(TEST_BYTES)
    );
    const output = await new GZipCompressUtilsDecompressor().decompress(compressed);
    expect(new Uint8Array(output)).toEqual(TEST_BYTES);
  });

  test.each([
    ['uncompressed', new NoCompressor(), new NoDecompressor()],
    ['fflate', new GZipFflateCompressor(), new GZipFflateDecompressor()],
    ['pako', new GZipPakoCompressor(), new GZipPakoDecompressor()]
  ])('%s direction-specific bindings interoperate', async (_name, compressor, decompressor) => {
    await expectDirectionalRoundTrip(compressor, decompressor);
  });

  test('combined compatibility classes satisfy both direction contracts', async () => {
    const compressors: Compressor[] = [new GZipFflateCompression(), new GZipPakoCompression()];
    const decompressors: Decompressor[] = [new GZipFflateCompression(), new GZipPakoCompression()];
    await expectDirectionalRoundTrip(compressors[0], decompressors[0]);
  });
});

/** Verifies one implementation's asynchronous compression round trip. */
async function expectRoundTrip(compression: Compression): Promise<void> {
  const compressed = await compression.compress(copyArrayBuffer(TEST_BYTES));
  const output = await compression.decompress(compressed, TEST_BYTES.byteLength);
  expect(new Uint8Array(output)).toEqual(TEST_BYTES);
}

/** Verifies interoperability between direction-specific implementations. */
async function expectDirectionalRoundTrip(
  compressor: Compressor,
  decompressor: Decompressor
): Promise<void> {
  const compressed = await compressor.compress(copyArrayBuffer(TEST_BYTES));
  const output = await decompressor.decompress(compressed, TEST_BYTES.byteLength);
  expect(new Uint8Array(output)).toEqual(TEST_BYTES);
}

/** Collects an asynchronous ArrayBuffer sequence. */
async function collectBatches(batches: AsyncIterable<ArrayBuffer>): Promise<ArrayBuffer[]> {
  const result: ArrayBuffer[] = [];
  for await (const batch of batches) result.push(batch);
  return result;
}

/** Concatenates exact ArrayBuffer batches for an assertion. */
function concatenateBatches(batches: ArrayBuffer[]): Uint8Array {
  const byteLength = batches.reduce((sum, batch) => sum + batch.byteLength, 0);
  const result = new Uint8Array(byteLength);
  let offset = 0;
  for (const batch of batches) {
    result.set(new Uint8Array(batch), offset);
    offset += batch.byteLength;
  }
  return result;
}

/** Copies a typed array into an exact ArrayBuffer. */
function copyArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}
