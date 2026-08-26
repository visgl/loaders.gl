// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {decodeVariant} from '../../src/parquetjs/schema/variant';
import {ParquetSchema} from '../../src/parquetjs/schema/schema';
import {materializeRows} from '../../src/parquetjs/schema/shred';

function createMetadata(dictionary: string[]): Uint8Array {
  const dictionaryBytes = new TextEncoder().encode(dictionary.join(''));
  const offsets = [0];
  for (const value of dictionary) {
    offsets.push(offsets[offsets.length - 1] + new TextEncoder().encode(value).length);
  }
  return new Uint8Array([
    0x01,
    dictionary.length,
    ...offsets,
    ...dictionaryBytes
  ]);
}

describe('Parquet VARIANT binary encoding', () => {
  test('decodes primitive and short-string values', () => {
    const metadata = createMetadata([]);
    expect(decodeVariant(metadata, new Uint8Array([0]))).toBeNull();
    expect(decodeVariant(metadata, new Uint8Array([4]))).toBe(true);
    expect(decodeVariant(metadata, new Uint8Array([8]))).toBe(false);
    expect(decodeVariant(metadata, new Uint8Array([20, 42, 0, 0, 0]))).toBe(42);
    expect(decodeVariant(metadata, new Uint8Array([1 | (5 << 2), 104, 101, 108, 108, 111]))).toBe(
      'hello'
    );
  });

  test('decodes arrays and objects whose value offsets are not monotonic', () => {
    const metadata = createMetadata(['a', 'b']);
    // Object header: basic type 2, one-byte field ids and offsets.
    // The values are stored as "b", then "a", while the sorted field ids are a, b.
    const value = new Uint8Array([
      2,
      2,
      0,
      1,
      2,
      0,
      4,
      5,
      98,
      5,
      97
    ]);
    expect(decodeVariant(metadata, value)).toEqual({a: 'a', b: 'b'});

    // Array header: basic type 3 and one-byte offsets, containing true and null.
    expect(decodeVariant(metadata, new Uint8Array([3, 2, 0, 1, 2, 4, 0]))).toEqual([true, null]);
  });

  test('preserves exact int64 values and binary values', () => {
    const metadata = createMetadata([]);
    expect(decodeVariant(metadata, new Uint8Array([24, 0, 0, 0, 0, 0, 0, 0, 128]))).toBe(
      -9223372036854775808n
    );
    expect(decodeVariant(metadata, new Uint8Array([60, 2, 0, 0, 0, 1, 2]))).toEqual(
      new Uint8Array([1, 2])
    );
  });

  test('handles negative decimal scales and prototype-shaped field names', () => {
    const metadata = createMetadata(['__proto__']);
    // decimal4: primitive type 8, scale -2, unscaled value 123.
    expect(
      decodeVariant(metadata, new Uint8Array([8 << 2, 0xfe, 123, 0, 0, 0]))
    ).toBe('12300');

    // Object header with one-byte field IDs and offsets; the key is __proto__.
    const decoded = decodeVariant(
      metadata,
      new Uint8Array([2, 1, 0, 0, 2, 5, 120])
    ) as Record<string, unknown>;
    expect(Object.getPrototypeOf(decoded)).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(decoded, '__proto__')).toBe(true);
    expect(decoded['__proto__']).toBe('x');
  });

  test('rejects unsupported metadata versions', () => {
    expect(() => decodeVariant(new Uint8Array([2, 0, 0]), new Uint8Array([0]))).toThrow(
      'unsupported VARIANT metadata version'
    );
  });

  test('decodes an unshredded Variant while materializing object rows', () => {
    const schema = new ParquetSchema({
      event: {
        optional: true,
        logicalType: {type: 'VARIANT', specificationVersion: 1},
        fields: {
          metadata: {type: 'BYTE_ARRAY'},
          value: {type: 'BYTE_ARRAY'}
        }
      }
    });
    const metadata = createMetadata(['message']);
    const value = new Uint8Array([1 | (2 << 2), 104, 105]);
    const rows = materializeRows(schema, {
      rowCount: 1,
      columnData: {
        'event,metadata': {count: 1, dlevels: [1], rlevels: [0], values: [metadata], pageHeaders: []},
        'event,value': {count: 1, dlevels: [1], rlevels: [0], values: [value], pageHeaders: []}
      }
    });
    expect(rows).toEqual([{event: 'hi'}]);
  });

  test('does not add absent optional Variant fields to object rows', () => {
    const schema = new ParquetSchema({
      event: {
        optional: true,
        logicalType: {type: 'VARIANT', specificationVersion: 1},
        fields: {
          metadata: {type: 'BYTE_ARRAY'},
          value: {type: 'BYTE_ARRAY'}
        }
      }
    });
    const rows = materializeRows(schema, {rowCount: 1, columnData: {}});
    expect(rows).toEqual([{}]);
    expect(Object.prototype.hasOwnProperty.call(rows[0], 'event')).toBe(false);
  });
});
