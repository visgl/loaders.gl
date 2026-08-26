// loaders.gl
// SPDX-License-Identifier: MIT

import {describe, expect, test} from 'vitest';

import {
  checkParquetSplitBlockBloomFilter,
  decodeParquetSplitBlockBloomFilter,
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
