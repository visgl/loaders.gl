// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {PARQUET_CODECS} from '../../src/parquetjs/codecs';
import {isByteStreamSplitType} from '../../src/parquetjs/codecs/byte-stream-split';

const CODEC = PARQUET_CODECS.BYTE_STREAM_SPLIT;

describe('ParquetCodec::BYTE_STREAM_SPLIT', () => {
  test('uses the byte-stream layout defined by the Parquet specification', () => {
    const encoded = CODEC.encodeValues('INT32', [0x04030201, 0x08070605], {});
    expect(Array.from(encoded)).toEqual([1, 5, 2, 6, 3, 7, 4, 8]);
  });

  test.each([
    ['INT32', [-2_147_483_648, -1, 0, 2_147_483_647], {}],
    ['INT64', [-(2n ** 63n), -1n, 0n, 2n ** 63n - 1n], {int64AsBigInt: true}],
    ['FLOAT', [-1.5, 0, 3.25, Number.POSITIVE_INFINITY], {}],
    ['DOUBLE', [-Math.PI, 0, Math.E, Number.NEGATIVE_INFINITY], {}],
    [
      'FIXED_LEN_BYTE_ARRAY',
      [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6])],
      {typeLength: 3}
    ]
  ] as const)('round-trips %s values', (type, values, options) => {
    const encoded = CODEC.encodeValues(type, values as any[], options);
    const cursor = {buffer: encoded, offset: 0, size: encoded.length};
    const decoded = CODEC.decodeValues(type, cursor, values.length, options);

    if (type === 'FIXED_LEN_BYTE_ARRAY') {
      expect(Array.from(decoded as unknown[])).toEqual(values);
    } else {
      expect(Array.from(decoded as ArrayLike<unknown>)).toEqual(values);
    }
    expect(cursor.offset).toBe(encoded.length);
  });

  test('writes into typed column buffers at an offset', () => {
    const encoded = CODEC.encodeValues('FLOAT', [1.5, 2.5], {});
    const output = new Float32Array(4).fill(-1);
    const decoded = CODEC.decodeValues(
      'FLOAT',
      {buffer: encoded, offset: 0, size: encoded.length},
      2,
      {output, outputOffset: 1}
    );

    expect(decoded).toBe(output);
    expect(Array.from(output)).toEqual([-1, 1.5, 2.5, -1]);
  });

  test('rejects unsupported physical types and malformed payloads', () => {
    expect(() => CODEC.encodeValues('BOOLEAN', [true], {})).toThrow(
      'BYTE_STREAM_SPLIT does not support BOOLEAN'
    );
    expect(() =>
      CODEC.decodeValues(
        'DOUBLE',
        {buffer: new Uint8Array(7), offset: 0, size: 7},
        1,
        {}
      )
    ).toThrow('Invalid BYTE_STREAM_SPLIT payload');
  });

  test('requires a width for FIXED_LEN_BYTE_ARRAY', () => {
    expect(() => CODEC.encodeValues('FIXED_LEN_BYTE_ARRAY', [new Uint8Array(2)], {})).toThrow(
      'missing option: typeLength'
    );
  });

  test.each(['INT32', 'INT64', 'FLOAT', 'DOUBLE', 'FIXED_LEN_BYTE_ARRAY'] as const)(
    'accepts the specification-defined %s physical type',
    type => {
      expect(isByteStreamSplitType(type)).toBe(true);
    }
  );

  test.each(['BOOLEAN', 'INT96', 'BYTE_ARRAY'] as const)(
    'rejects the specification-excluded %s physical type',
    type => {
      expect(isByteStreamSplitType(type)).toBe(false);
    }
  );
});
