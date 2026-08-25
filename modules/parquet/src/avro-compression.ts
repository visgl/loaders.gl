// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  BZip2Compressor,
  BZip2Decompressor,
  DeflateCompressor,
  DeflateDecompressor,
  SnappyCompressor,
  SnappyDecompressor,
  XZCompressor,
  XZDecompressor,
  ZstdCompressor,
  ZstdDecompressor
} from '@loaders.gl/compression';
import type {Compressor, Decompressor} from '@loaders.gl/compression';
import {toArrayBuffer, toUint8Array} from './parquetjs/utils/binary-utils';

type AvroCodec = 'null' | 'deflate' | 'snappy' | 'zstandard' | 'bzip2' | 'xz';

export type {AvroCodec};

const decompressionPromises: Partial<Record<Exclude<AvroCodec, 'null'>, Promise<Decompressor>>> =
  {};
const compressionPromises: Partial<Record<Exclude<AvroCodec, 'null'>, Promise<Compressor>>> = {};

/** Decompresses one Avro data block using a codec from the compression module. */
export async function decompressAvro(codec: string, value: Uint8Array): Promise<Uint8Array> {
  if (codec === 'null') return value;
  if (!isAvroCodec(codec)) throw new Error(`avro: unsupported compression codec "${codec}"`);

  const compression = await getAvroDecompressor(codec);
  const compressedValue = codec === 'snappy' ? value.subarray(0, -4) : value;
  const output = toUint8Array(await compression.decompress(toArrayBuffer(compressedValue)));

  if (codec === 'snappy') {
    if (value.length < 4 || readUInt32BE(value, value.length - 4) !== crc32(output)) {
      throw new Error('avro: Snappy block CRC32 check failed');
    }
  }
  return output;
}

/** Compresses one Avro data block using a supported writer codec. */
export async function compressAvro(codec: string, value: Uint8Array): Promise<Uint8Array> {
  if (codec === 'null') return value;
  if (!isAvroCodec(codec)) throw new Error(`avro: unsupported compression codec "${codec}"`);
  const compression = await getAvroCompressor(codec);
  const compressed = toUint8Array(await compression.compress(toArrayBuffer(value)));
  if (codec !== 'snappy') return compressed;
  const result = new Uint8Array(compressed.length + 4);
  result.set(compressed);
  const checksum = crc32(value);
  result[result.length - 4] = checksum >>> 24;
  result[result.length - 3] = checksum >>> 16;
  result[result.length - 2] = checksum >>> 8;
  result[result.length - 1] = checksum;
  return result;
}

/** Returns whether a string is a supported Avro codec name. */
function isAvroCodec(codec: string): codec is Exclude<AvroCodec, 'null'> {
  return (
    codec === 'deflate' ||
    codec === 'snappy' ||
    codec === 'zstandard' ||
    codec === 'bzip2' ||
    codec === 'xz'
  );
}

/** Lazily constructs an Avro codec implementation. */
async function getAvroDecompressor(codec: Exclude<AvroCodec, 'null'>): Promise<Decompressor> {
  decompressionPromises[codec] ||= createAvroDecompressor(codec);
  return await decompressionPromises[codec];
}

/** Creates one decompressor from the shared compression module. */
async function createAvroDecompressor(codec: Exclude<AvroCodec, 'null'>): Promise<Decompressor> {
  const decompressor = {
    deflate: new DeflateDecompressor({raw: true}),
    snappy: new SnappyDecompressor(),
    zstandard: new ZstdDecompressor(),
    bzip2: new BZip2Decompressor(),
    xz: new XZDecompressor()
  }[codec];
  await decompressor.preload();
  return decompressor;
}

/** Creates one compressor from the shared compression module. */
async function getAvroCompressor(codec: Exclude<AvroCodec, 'null'>): Promise<Compressor> {
  compressionPromises[codec] ||= createAvroCompressor(codec);
  return await compressionPromises[codec];
}

/** Creates one compressor from the shared compression module. */
async function createAvroCompressor(codec: Exclude<AvroCodec, 'null'>): Promise<Compressor> {
  const compressor = {
    deflate: new DeflateCompressor({raw: true}),
    snappy: new SnappyCompressor(),
    zstandard: new ZstdCompressor(),
    bzip2: new BZip2Compressor(),
    xz: new XZCompressor()
  }[codec];
  await compressor.preload();
  return compressor;
}

/** Reads a big-endian unsigned 32-bit integer. */
function readUInt32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]
  );
}

/** Computes the CRC32 used by Avro's Snappy codec. */
function crc32(bytes: Uint8Array): number {
  let checksum = 0xffffffff;
  for (const byte of bytes) {
    checksum ^= byte;
    for (let bit = 0; bit < 8; bit++) checksum = (checksum >>> 1) ^ (0xedb88320 & -(checksum & 1));
  }
  return checksum ^ 0xffffffff;
}
