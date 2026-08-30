// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {decodeVariant} from '../../src/parquetjs/schema/variant';
import {ParquetSchema} from '../../src/parquetjs/schema/schema';
import {materializeRows} from '../../src/parquetjs/schema/shred';
import {convertParquetSchema} from '../../src/lib/arrow/convert-schema-from-parquet';

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

  test('decodes the complete primitive type family', () => {
    const metadata = createMetadata([]);
    const float32 = new Uint8Array(5);
    float32[0] = 14 << 2;
    new DataView(float32.buffer).setFloat32(1, 1.5, true);
    const float64 = new Uint8Array(9);
    float64[0] = 7 << 2;
    new DataView(float64.buffer).setFloat64(1, -2.25, true);

    expect(decodeVariant(metadata, new Uint8Array([3 << 2, 0xff]))).toBe(-1);
    expect(decodeVariant(metadata, new Uint8Array([4 << 2, 0x00, 0x80]))).toBe(-32768);
    expect(decodeVariant(metadata, float32)).toBe(1.5);
    expect(decodeVariant(metadata, float64)).toBe(-2.25);
    expect(decodeVariant(metadata, new Uint8Array([8 << 2, 2, 0xd2, 0x04, 0, 0]))).toBe(
      '12.34'
    );
    expect(
      decodeVariant(metadata, new Uint8Array([9 << 2, 0, 42, 0, 0, 0, 0, 0, 0, 0]))
    ).toBe(42);
    expect(
      decodeVariant(metadata, new Uint8Array([10 << 2, 1, 0xff, ...new Array(15).fill(0xff)]))
    ).toBe('-0.1');
    expect(decodeVariant(metadata, new Uint8Array([11 << 2, 1, 0, 0, 0]))).toBe(1);
    for (const primitiveType of [12, 13, 17, 18, 19]) {
      expect(
        decodeVariant(metadata, new Uint8Array([primitiveType << 2, 1, 0, 0, 0, 0, 0, 0, 0]))
      ).toBe(1n);
    }
    expect(
      decodeVariant(metadata, new Uint8Array([16 << 2, 3, 0, 0, 0, 0x66, 0x6f, 0x6f]))
    ).toBe('foo');
    expect(
      decodeVariant(metadata, new Uint8Array([20 << 2, ...Array.from({length: 16}, (_, i) => i)]))
    ).toEqual(Uint8Array.from({length: 16}, (_, i) => i));
  });

  test('validates metadata dictionaries, primitive bounds, and object fields', () => {
    expect(() => decodeVariant(new Uint8Array([1]), new Uint8Array([0]))).toThrow('truncated');
    expect(() => decodeVariant(new Uint8Array([1, 1, 0]), new Uint8Array([0]))).toThrow(
      'offsets are truncated'
    );
    expect(() => decodeVariant(new Uint8Array([1, 1, 1, 0, 0x61]), new Uint8Array([0]))).toThrow(
      'dictionary offset'
    );
    expect(() => decodeVariant(new Uint8Array([1, 0, 0, 0x61]), new Uint8Array([0]))).toThrow(
      'does not consume'
    );

    const metadata = createMetadata(['field']);
    expect(() => decodeVariant(metadata, new Uint8Array([0, 0]))).toThrow('trailing bytes');
    expect(() => decodeVariant(metadata, new Uint8Array([15 << 2, 5, 0, 0, 0, 1]))).toThrow(
      'truncated'
    );
    expect(() => decodeVariant(metadata, new Uint8Array([21 << 2]))).toThrow(
      'unsupported VARIANT primitive type'
    );
    expect(() => decodeVariant(metadata, new Uint8Array([2, 1, 1, 0, 1, 0]))).toThrow(
      'invalid VARIANT object field id'
    );
    expect(
      () =>
        decodeVariant(
          metadata,
          new Uint8Array([2, 2, 0, 0, 0, 1, 2, 0, 0])
        )
    ).toThrow('duplicate VARIANT object field');
  });

  test('rejects excessive Variant nesting with a small deterministic fixture', () => {
    const metadata = createMetadata([]);
    let nested = new Uint8Array([0]);
    for (let depth = 0; depth < 1025; depth++) {
      if (nested.length > 255) {
        // Two-byte array offsets, encoded by setting the low value-header bit.
        nested = new Uint8Array([
          7,
          1,
          0,
          0,
          nested.length & 0xff,
          nested.length >> 8,
          ...nested
        ]);
      } else {
        nested = new Uint8Array([3, 1, 0, nested.length, ...nested]);
      }
    }
    expect(() => decodeVariant(metadata, nested)).toThrow('excessively nested');
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

  test('materializes a shredded typed_value Variant child', () => {
    const schema = new ParquetSchema({
      event: {
        optional: true,
        logicalType: {type: 'VARIANT', specificationVersion: 1},
        fields: {
          typed_value: {fields: {string_value: {type: 'UTF8'}}}
        }
      }
    });
    const rows = materializeRows(schema, {
      rowCount: 1,
      columnData: {
        'event,typed_value,string_value': {
          count: 1,
          dlevels: [1],
          rlevels: [0],
          values: [new TextEncoder().encode('typed result')],
          pageHeaders: []
        }
      }
    });
    expect(rows).toEqual([{event: 'typed result'}]);
  });

  test('preserves object-shaped typed_value fields ending in _value', () => {
    const schema = new ParquetSchema({
      event: {
        optional: true,
        logicalType: {type: 'VARIANT', specificationVersion: 1},
        fields: {
          typed_value: {fields: {price_value: {type: 'INT32'}}}
        }
      }
    });
    const rows = materializeRows(schema, {
      rowCount: 1,
      columnData: {
        'event,typed_value,price_value': {
          count: 1,
          dlevels: [1],
          rlevels: [0],
          values: [10],
          pageHeaders: []
        }
      }
    });
    expect(rows).toEqual([{event: {price_value: 10}}]);
  });

  test('marks Arrow Variant storage with its Parquet specification version', () => {
    const schema = new ParquetSchema({
      event: {
        logicalType: {type: 'VARIANT', specificationVersion: 1},
        fields: {typed_value: {type: 'UTF8'}}
      }
    });
    const arrowSchema = convertParquetSchema(schema, null);
    expect(arrowSchema.fields[0]).toMatchObject({
      type: {type: 'struct'},
      metadata: {'parquet.variant.specification_version': '1'}
    });
  });
});
