// loaders.gl
// SPDX-License-Identifier: MIT

import {describe, expect, test} from 'vitest';

import {
  checkParquetSplitBlockBloomFilter,
  decodeParquetSplitBlockBloomFilter,
  encodeParquetBloomFilterValue,
  encodeParquetSplitBlockBloomFilter,
  hashParquetBloomFilterValue,
  insertParquetSplitBlockBloomFilter
} from '../src/lib/parquet-bloom-filter';
import {getParquetBloomFilterProbes} from '../src/lib/parquet-bloom-filter-planner';
import {Uint8ArrayCompactProtocolWriter} from '../src/parquetjs/utils/uint8-array-compact-protocol-writer';
import {Thrift} from '../src/parquetjs/utils/thrift-runtime';

describe('Parquet split-block Bloom filters', () => {
  test('matches the Parquet XXH64 empty-input vector', () => {
    expect(hashParquetBloomFilterValue(new Uint8Array())).toBe(0xef46db3751d8e999n);
    expect(hashParquetBloomFilterValue(new TextEncoder().encode('a'))).toBe(0xd24ec4f1a98c6e5bn);
    expect(hashParquetBloomFilterValue(new TextEncoder().encode('12345678'))).toBe(
      0xd2d02f08cf7cfd4an
    );
  });

  test('inserts and checks values without false negatives', () => {
    const filter = new Uint8Array(32);
    const inserted = new TextEncoder().encode('vis.gl');
    const absent = new TextEncoder().encode('not present');
    const insertedHash = hashParquetBloomFilterValue(inserted);

    insertParquetSplitBlockBloomFilter(filter, insertedHash);

    expect(checkParquetSplitBlockBloomFilter(filter, insertedHash)).toBe(true);
    expect(checkParquetSplitBlockBloomFilter(filter, hashParquetBloomFilterValue(absent))).toBe(
      false
    );
  });

  test('rejects malformed bitsets conservatively', () => {
    expect(checkParquetSplitBlockBloomFilter(new Uint8Array(31), 0n)).toBe(false);
    expect(() => insertParquetSplitBlockBloomFilter(new Uint8Array(31), 0n)).toThrow();
  });

  test('decodes the Thrift header and isolates the bitset', () => {
    const writer = new Uint8ArrayCompactProtocolWriter();
    writer.writeStructBegin('BloomFilterHeader');
    writer.writeFieldBegin('numBytes', Thrift.Type.I32, 1);
    writer.writeI32(32);
    writer.writeFieldEnd();
    writeEmptyBloomUnion(writer, 'algorithm', 2, 'BLOCK');
    writeEmptyBloomUnion(writer, 'hash', 3, 'XXHASH');
    writeEmptyBloomUnion(writer, 'compression', 4, 'UNCOMPRESSED');
    writer.writeFieldStop();
    writer.writeStructEnd();
    const payload = new Uint8Array(writer.getBytes().byteLength + 32);
    payload.set(writer.getBytes());
    payload.fill(0x5a, writer.getBytes().byteLength);

    const decoded = decodeParquetSplitBlockBloomFilter(payload);
    expect(decoded.bitsetByteLength).toBe(32);
    expect(decoded.headerByteLength).toBe(writer.getBytes().byteLength);
    expect(decoded.bitset.every(byte => byte === 0x5a)).toBe(true);
  });

  test('encodes scalar values using Parquet PLAIN bytes', () => {
    expect(Array.from(encodeParquetBloomFilterValue(42, 'INT32'))).toEqual([42, 0, 0, 0]);
    expect(Array.from(encodeParquetBloomFilterValue(42n, 'INT64'))).toEqual([
      42, 0, 0, 0, 0, 0, 0, 0
    ]);
    expect(Array.from(encodeParquetBloomFilterValue('id', 'BYTE_ARRAY'))).toEqual([105, 100]);
    expect(() => encodeParquetBloomFilterValue(new Uint8Array(2), 'FIXED_LEN_BYTE_ARRAY', 3)).toThrow();
  });

  test('encodes every physical scalar type into a complete searchable filter', () => {
    const cases = [
      ['BOOLEAN', [true, false]],
      ['INT32', [-1, 42]],
      ['INT64', [-2n, '9223372036854775807']],
      ['FLOAT', [1.25, Number.NaN]],
      ['DOUBLE', [-2.5, Number.POSITIVE_INFINITY]],
      ['BYTE_ARRAY', ['text', new Uint8Array([1, 2])]],
      ['FIXED_LEN_BYTE_ARRAY', [new Uint8Array([3, 4]), new Uint8Array([5, 6])], 2]
    ] as const;

    for (const [physicalType, values, typeLength] of cases) {
      const encoded = encodeParquetSplitBlockBloomFilter(values as any, physicalType, typeLength);
      const decoded = decodeParquetSplitBlockBloomFilter(encoded!);
      expect(decoded.algorithm).toBe('BLOCK');
      expect(decoded.hash).toBe('XXHASH');
      expect(decoded.compression).toBe('UNCOMPRESSED');
      for (const value of values) {
        const bytes = encodeParquetBloomFilterValue(value as any, physicalType, typeLength);
        expect(checkParquetSplitBlockBloomFilter(decoded.bitset, hashParquetBloomFilterValue(bytes))).toBe(true);
      }
    }
    expect(encodeParquetSplitBlockBloomFilter([], 'INT32')).toBeUndefined();
  });

  test('hashes all XXH64 lane and tail layouts deterministically', () => {
    for (const byteLength of [4, 7, 8, 12, 15, 31, 32, 33, 40, 63, 64, 65]) {
      const bytes = Uint8Array.from({length: byteLength}, (_, index) => index * 17);
      const first = hashParquetBloomFilterValue(bytes);
      expect(hashParquetBloomFilterValue(bytes)).toBe(first);
      expect(first).toBeGreaterThanOrEqual(0n);
      expect(first).toBeLessThanOrEqual(0xffffffffffffffffn);
    }
  });

  test.each([
    [1, 'BOOLEAN'],
    [1.5, 'INT32'],
    [{}, 'INT64'],
    ['1', 'FLOAT'],
    ['1', 'DOUBLE'],
    [1, 'BYTE_ARRAY'],
    [new Uint8Array([1]), 'FIXED_LEN_BYTE_ARRAY'],
    [1, 'UNSUPPORTED']
  ] as const)('rejects invalid Bloom scalar %#', (value, physicalType) => {
    expect(() =>
      encodeParquetBloomFilterValue(value as any, physicalType as any, 2)
    ).toThrow();
  });

  test('rejects missing, invalid, and truncated Bloom headers', () => {
    const missingLength = new Uint8Array([0]);
    expect(() => decodeParquetSplitBlockBloomFilter(missingLength)).toThrow(/bitset length/);

    for (const bitsetByteLength of [0, 31]) {
      const writer = new Uint8ArrayCompactProtocolWriter();
      writer.writeStructBegin('BloomFilterHeader');
      writer.writeFieldBegin('ignored', Thrift.Type.I32, 9);
      writer.writeI32(123);
      writer.writeFieldEnd();
      writer.writeFieldBegin('numBytes', Thrift.Type.I32, 1);
      writer.writeI32(bitsetByteLength);
      writer.writeFieldEnd();
      writer.writeFieldStop();
      writer.writeStructEnd();
      expect(() => decodeParquetSplitBlockBloomFilter(writer.getBytes())).toThrow(/bitset length/);
    }

    const writer = new Uint8ArrayCompactProtocolWriter();
    writer.writeStructBegin('BloomFilterHeader');
    writer.writeFieldBegin('numBytes', Thrift.Type.I32, 1);
    writer.writeI32(32);
    writer.writeFieldEnd();
    writer.writeFieldStop();
    writer.writeStructEnd();
    expect(() => decodeParquetSplitBlockBloomFilter(writer.getBytes())).toThrow(/Truncated/);
  });

  test('plans only safe equality and IN probes', () => {
    const rowGroup = {
      index: 0,
      rowOffset: 0,
      rowCount: 10,
      uncompressedByteLength: 0,
      uncompressedSize: 0,
      compressedByteLength: 0,
      compressedSize: 0,
      columns: [
        {
          path: ['id'],
          compression: 'UNCOMPRESSED',
          encodings: ['PLAIN'],
          valueCount: 10,
          fileOffset: 0,
          compressedByteLength: 0,
          compressedSize: 0,
          uncompressedByteLength: 0,
          uncompressedSize: 0,
          dataPageOffset: 0,
          bloomFilterOffset: 128,
          bloomFilterByteLength: 64
        }
      ]
    } as const;

    expect(
      getParquetBloomFilterProbes(
        {op: '=', args: [{property: 'id'}, 42]},
        rowGroup
      )
    ).toHaveLength(1);
    expect(
      getParquetBloomFilterProbes(
        {op: 'or', args: [{op: '=', args: [{property: 'id'}, 42]}, {op: '=', args: [{property: 'id'}, 43]}]},
        rowGroup
      )
    ).toHaveLength(0);
  });
});

function writeEmptyBloomUnion(
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
