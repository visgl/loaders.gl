// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Uint8ArrayCompactProtocol} from '../parquetjs/utils/uint8-array-compact-protocol';
import {Uint8ArrayTransport} from '../parquetjs/utils/uint8-array-transport';
import {Uint8ArrayCompactProtocolWriter} from '../parquetjs/utils/uint8-array-compact-protocol-writer';
import {Thrift} from '../parquetjs/utils/thrift-runtime';
import {concatUint8Arrays} from '../parquetjs/utils/binary-utils';

const UINT64_MASK = 0xffffffffffffffffn;
const PRIME1 = 0x9e3779b185ebca87n;
const PRIME2 = 0xc2b2ae3d27d4eb4fn;
const PRIME3 = 0x165667b19e3779f9n;
const PRIME4 = 0x85ebca77c2b2ae63n;
const PRIME5 = 0x27d4eb2f165667c5n;
const SALTS = [
  0x47b6137b, 0x44974d91, 0x8824ad5b, 0xa2b7289d, 0x705495c7, 0x2df1424b, 0x9efc4947, 0x5c6bfb31
] as const;

/** Parsed, uncompressed Parquet split-block Bloom-filter payload. */
export type ParquetSplitBlockBloomFilter = {
  /** Number of bytes declared by the serialized Bloom-filter header. */
  readonly bitsetByteLength: number;
  /** Serialized header length, in bytes. */
  readonly headerByteLength: number;
  /** Bloom-filter bitset, excluding its Thrift header. */
  readonly bitset: Uint8Array;
  /** Bloom algorithm declared by the serialized header. */
  readonly algorithm?: 'BLOCK';
  /** Hash strategy declared by the serialized header. */
  readonly hash?: 'XXHASH';
  /** Compression declared by the serialized header. */
  readonly compression?: 'UNCOMPRESSED';
};

/** Physical Parquet types supported by Bloom-filter plain-value encoding. */
export type ParquetBloomFilterPhysicalType =
  | 'BOOLEAN'
  | 'INT32'
  | 'INT64'
  | 'FLOAT'
  | 'DOUBLE'
  | 'BYTE_ARRAY'
  | 'FIXED_LEN_BYTE_ARRAY';

/** Builds an uncompressed Parquet split-block Bloom filter for one column chunk. */
export function encodeParquetSplitBlockBloomFilter(
  values: readonly (boolean | number | bigint | string | Uint8Array)[],
  physicalType: ParquetBloomFilterPhysicalType,
  typeLength?: number
): Uint8Array | undefined {
  if (values.length === 0) return undefined;

  // Ten bits per value is the Parquet recommendation. Split-block filters are composed of
  // 256-bit blocks, so round up to the next whole block and keep a useful minimum for tiny groups.
  const targetBitCount = Math.max(256, values.length * 10);
  const blockCount = Math.max(1, Math.ceil(targetBitCount / 256));
  const bitset = new Uint8Array(blockCount * 32);
  for (const value of values) {
    const encoded = encodeParquetBloomFilterValue(value, physicalType, typeLength);
    insertParquetSplitBlockBloomFilter(bitset, hashParquetBloomFilterValue(encoded));
  }

  const headerWriter = new Uint8ArrayCompactProtocolWriter();
  headerWriter.writeStructBegin('BloomFilterHeader');
  headerWriter.writeFieldBegin('numBytes', Thrift.Type.I32, 1);
  headerWriter.writeI32(bitset.byteLength);
  headerWriter.writeFieldEnd();
  writeBloomFilterUnion(headerWriter, 'algorithm', 2, 'BLOCK');
  writeBloomFilterUnion(headerWriter, 'hash', 3, 'XXHASH');
  writeBloomFilterUnion(headerWriter, 'compression', 4, 'UNCOMPRESSED');
  headerWriter.writeFieldStop();
  headerWriter.writeStructEnd();
  return concatUint8Arrays([headerWriter.getBytes(), bitset]);
}

/** Encodes one scalar using the Parquet PLAIN representation used by Bloom filters. */
export function encodeParquetBloomFilterValue(
  value: boolean | number | bigint | string | Uint8Array,
  physicalType: ParquetBloomFilterPhysicalType,
  typeLength?: number
): Uint8Array {
  switch (physicalType) {
    case 'BOOLEAN':
      if (typeof value !== 'boolean')
        throw new Error('Parquet BOOLEAN Bloom value must be boolean');
      return Uint8Array.of(value ? 1 : 0);
    case 'INT32': {
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new Error('Parquet INT32 Bloom value must be an integer number');
      }
      const bytes = new Uint8Array(4);
      new DataView(bytes.buffer).setInt32(0, value, true);
      return bytes;
    }
    case 'INT64': {
      if (typeof value !== 'number' && typeof value !== 'bigint' && typeof value !== 'string') {
        throw new Error('Parquet INT64 Bloom value must be an integer number, bigint, or string');
      }
      const integerValue = typeof value === 'bigint' ? value : BigInt(value);
      const bytes = new Uint8Array(8);
      new DataView(bytes.buffer).setBigInt64(0, integerValue, true);
      return bytes;
    }
    case 'FLOAT': {
      if (typeof value !== 'number') throw new Error('Parquet FLOAT Bloom value must be a number');
      const bytes = new Uint8Array(4);
      new DataView(bytes.buffer).setFloat32(0, value, true);
      return bytes;
    }
    case 'DOUBLE': {
      if (typeof value !== 'number') throw new Error('Parquet DOUBLE Bloom value must be a number');
      const bytes = new Uint8Array(8);
      new DataView(bytes.buffer).setFloat64(0, value, true);
      return bytes;
    }
    case 'BYTE_ARRAY': {
      if (typeof value !== 'string' && !(value instanceof Uint8Array)) {
        throw new Error('Parquet BYTE_ARRAY Bloom value must be a string or Uint8Array');
      }
      const payload = typeof value === 'string' ? new TextEncoder().encode(value) : value;
      return payload.slice();
    }
    case 'FIXED_LEN_BYTE_ARRAY': {
      if (
        !(value instanceof Uint8Array) ||
        typeLength === undefined ||
        value.byteLength !== typeLength
      ) {
        throw new Error('Parquet FIXED_LEN_BYTE_ARRAY Bloom value must match typeLength');
      }
      return value.slice();
    }
    default:
      throw new Error(`Unsupported Parquet Bloom-filter physical type: ${physicalType}`);
  }
}

/** Parses a Parquet Bloom-filter header and returns its uncompressed split-block bitset. */
export function decodeParquetSplitBlockBloomFilter(data: Uint8Array): ParquetSplitBlockBloomFilter {
  const transport = new Uint8ArrayTransport(data);
  const protocol = new Uint8ArrayCompactProtocol(transport);
  protocol.readStructBegin();
  let bitsetByteLength: number | undefined;
  let algorithm: 'BLOCK' | undefined;
  let hash: 'XXHASH' | undefined;
  let compression: 'UNCOMPRESSED' | undefined;
  while (true) {
    const field = protocol.readFieldBegin();
    if (field.ftype === Thrift.Type.STOP) {
      break;
    }
    if (field.fid === 1 && field.ftype === Thrift.Type.I32) {
      bitsetByteLength = protocol.readI32();
    } else if (field.fid === 2 && field.ftype === Thrift.Type.STRUCT) {
      algorithm = readBloomFilterUnion(protocol, 1) ? 'BLOCK' : undefined;
    } else if (field.fid === 3 && field.ftype === Thrift.Type.STRUCT) {
      hash = readBloomFilterUnion(protocol, 1) ? 'XXHASH' : undefined;
    } else if (field.fid === 4 && field.ftype === Thrift.Type.STRUCT) {
      compression = readBloomFilterUnion(protocol, 1) ? 'UNCOMPRESSED' : undefined;
    } else {
      protocol.skip(field.ftype);
    }
    protocol.readFieldEnd();
  }
  protocol.readStructEnd();
  if (bitsetByteLength === undefined || bitsetByteLength <= 0 || bitsetByteLength % 32 !== 0) {
    throw new Error('Invalid Parquet split-block Bloom filter bitset length');
  }
  const bitsetOffset = transport.readPos;
  if (data.byteLength - bitsetOffset < bitsetByteLength) {
    throw new Error('Truncated Parquet split-block Bloom filter bitset');
  }
  return {
    bitsetByteLength,
    headerByteLength: bitsetOffset,
    bitset: data.subarray(bitsetOffset, bitsetOffset + bitsetByteLength),
    algorithm,
    hash,
    compression
  };
}

function readBloomFilterUnion(
  protocol: Uint8ArrayCompactProtocol,
  expectedFieldId: number
): boolean {
  protocol.readStructBegin();
  let matches = false;
  while (true) {
    const field = protocol.readFieldBegin();
    if (field.ftype === Thrift.Type.STOP) break;
    matches = field.fid === expectedFieldId && field.ftype === Thrift.Type.STRUCT;
    protocol.skip(field.ftype);
    protocol.readFieldEnd();
  }
  protocol.readStructEnd();
  return matches;
}

/** Writes one Bloom-filter Thrift union using the compact protocol. */
function writeBloomFilterUnion(
  writer: Uint8ArrayCompactProtocolWriter,
  fieldName: string,
  fieldId: number,
  variantName: string
): void {
  writer.writeFieldBegin(fieldName, Thrift.Type.STRUCT, fieldId);
  writer.writeStructBegin(variantName);
  writer.writeFieldBegin(variantName, Thrift.Type.STRUCT, 1);
  writer.writeStructBegin(variantName);
  writer.writeFieldStop();
  writer.writeStructEnd();
  writer.writeFieldEnd();
  writer.writeFieldStop();
  writer.writeStructEnd();
  writer.writeFieldEnd();
}

/** Returns whether a serialized Parquet split-block Bloom filter may contain a hash. */
export function checkParquetSplitBlockBloomFilter(bitset: Uint8Array, hash: bigint): boolean {
  const blockCount = bitset.byteLength / 32;
  if (!Number.isInteger(blockCount) || blockCount < 1 || blockCount >= 2 ** 31) {
    return false;
  }
  const blockIndex = Number(((hash >> 32n) * BigInt(blockCount)) >> 32n);
  const blockOffset = blockIndex * 32;
  const lowerHash = Number(hash & 0xffffffffn) >>> 0;
  for (let wordIndex = 0; wordIndex < 8; wordIndex++) {
    const bit = Math.imul(lowerHash, SALTS[wordIndex]) >>> 27;
    const word = readUint32LE(bitset, blockOffset + wordIndex * 4);
    if ((word & (1 << bit)) === 0) {
      return false;
    }
  }
  return true;
}

/** Adds a hash to a mutable serialized Parquet split-block Bloom filter bitset. */
export function insertParquetSplitBlockBloomFilter(bitset: Uint8Array, hash: bigint): void {
  const blockCount = bitset.byteLength / 32;
  if (!Number.isInteger(blockCount) || blockCount < 1 || blockCount >= 2 ** 31) {
    throw new Error(
      'Parquet split-block Bloom filter bitset must contain one or more 32-byte blocks'
    );
  }
  const blockIndex = Number(((hash >> 32n) * BigInt(blockCount)) >> 32n);
  const blockOffset = blockIndex * 32;
  const lowerHash = Number(hash & 0xffffffffn) >>> 0;
  for (let wordIndex = 0; wordIndex < 8; wordIndex++) {
    const bit = Math.imul(lowerHash, SALTS[wordIndex]) >>> 27;
    const offset = blockOffset + wordIndex * 4;
    writeUint32LE(bitset, offset, readUint32LE(bitset, offset) | (1 << bit));
  }
}

/** Computes the Parquet Bloom-filter XXH64 hash for plain-encoded value bytes. */
export function hashParquetBloomFilterValue(value: Uint8Array): bigint {
  let offset = 0;
  let hash: bigint;
  if (value.byteLength >= 32) {
    let value1 = PRIME1 + PRIME2;
    let value2 = PRIME2;
    let value3 = 0n;
    let value4 = -PRIME1;
    const limit = value.byteLength - 32;
    while (offset <= limit) {
      value1 = roundXxHash64(value1, readUint64LE(value, offset));
      value2 = roundXxHash64(value2, readUint64LE(value, offset + 8));
      value3 = roundXxHash64(value3, readUint64LE(value, offset + 16));
      value4 = roundXxHash64(value4, readUint64LE(value, offset + 24));
      offset += 32;
    }
    hash =
      rotateLeft(value1, 1) +
      rotateLeft(value2, 7) +
      rotateLeft(value3, 12) +
      rotateLeft(value4, 18);
    hash = mergeXxHash64(hash, value1);
    hash = mergeXxHash64(hash, value2);
    hash = mergeXxHash64(hash, value3);
    hash = mergeXxHash64(hash, value4);
  } else {
    hash = PRIME5;
  }
  hash = (hash + BigInt(value.byteLength)) & UINT64_MASK;
  while (offset + 8 <= value.byteLength) {
    const lane = (readUint64LE(value, offset) * PRIME2) & UINT64_MASK;
    hash ^= (rotateLeft(lane, 31) * PRIME1) & UINT64_MASK;
    hash = (rotateLeft(hash, 27) * PRIME1 + PRIME4) & UINT64_MASK;
    offset += 8;
  }
  if (offset + 4 <= value.byteLength) {
    hash ^= (BigInt(readUint32LE(value, offset)) * PRIME1) & UINT64_MASK;
    hash = (rotateLeft(hash, 23) * PRIME2 + PRIME3) & UINT64_MASK;
    offset += 4;
  }
  while (offset < value.byteLength) {
    hash ^= (BigInt(value[offset++]) * PRIME5) & UINT64_MASK;
    hash = (rotateLeft(hash, 11) * PRIME1) & UINT64_MASK;
  }
  hash ^= hash >> 33n;
  hash = (hash * PRIME2) & UINT64_MASK;
  hash ^= hash >> 29n;
  hash = (hash * PRIME3) & UINT64_MASK;
  hash ^= hash >> 32n;
  return hash & UINT64_MASK;
}

function roundXxHash64(accumulator: bigint, lane: bigint): bigint {
  return (rotateLeft((accumulator + lane * PRIME2) & UINT64_MASK, 31) * PRIME1) & UINT64_MASK;
}

function mergeXxHash64(accumulator: bigint, value: bigint): bigint {
  let result = accumulator ^ roundXxHash64(0n, value);
  result = (result * PRIME1 + PRIME4) & UINT64_MASK;
  return result;
}

function rotateLeft(value: bigint, bits: bigint | number): bigint {
  const shift = BigInt(bits);
  return ((value << shift) | (value >> (64n - shift))) & UINT64_MASK;
}

function readUint32LE(value: Uint8Array, offset: number): number {
  return (
    (value[offset] |
      (value[offset + 1] << 8) |
      (value[offset + 2] << 16) |
      (value[offset + 3] << 24)) >>>
    0
  );
}

function writeUint32LE(value: Uint8Array, offset: number, numberValue: number): void {
  value[offset] = numberValue;
  value[offset + 1] = numberValue >>> 8;
  value[offset + 2] = numberValue >>> 16;
  value[offset + 3] = numberValue >>> 24;
}

function readUint64LE(value: Uint8Array, offset: number): bigint {
  return BigInt(readUint32LE(value, offset)) | (BigInt(readUint32LE(value, offset + 4)) << 32n);
}
