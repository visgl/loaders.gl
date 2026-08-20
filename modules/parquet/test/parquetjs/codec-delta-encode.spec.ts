// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {PARQUET_CODECS} from '../../src/parquetjs/codecs';

test('DELTA_BINARY_PACKED encoder matches the canonical constant-delta layout', () => {
  expect(Array.from(PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT32', [1, 2, 3], {}))).toEqual(
    [0x80, 0x01, 0x04, 0x03, 0x02, 0x02, 0x00, 0x00, 0x00, 0x00]
  );
});

test('DELTA_BINARY_PACKED encoder round-trips multiple INT32 blocks', () => {
  const values = Array.from({length: 300}, (_, index) =>
    index % 17 === 0 ? -2_147_483_648 + index : (index * index - 5000) | 0
  );
  const encoded = PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT32', values, {});
  const decoded = PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues(
    'INT32',
    {buffer: encoded, offset: 0, size: encoded.length},
    values.length,
    {}
  );
  expect(Array.from(decoded)).toEqual(values);
});

test('DELTA_BINARY_PACKED encoder preserves exact wide INT64 values', () => {
  const values = [-(2n ** 63n), 2n ** 63n - 1n, -1n, 0n, 9_007_199_254_740_993n];
  const encoded = PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT64', values, {});
  const decoded = PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues(
    'INT64',
    {buffer: encoded, offset: 0, size: encoded.length},
    values.length,
    {int64AsBigInt: true}
  );
  expect(Array.from(decoded)).toEqual(values);
});

test.each(['DELTA_LENGTH_BYTE_ARRAY', 'DELTA_BYTE_ARRAY'] as const)(
  '%s encoder round-trips byte arrays',
  encoding => {
    const values = [
      new Uint8Array([97, 98, 99]),
      new Uint8Array([97, 98, 100]),
      new Uint8Array([97, 98, 100, 101]),
      new Uint8Array(0)
    ];
    const encoded = PARQUET_CODECS[encoding].encodeValues('BYTE_ARRAY', values, {});
    const decoded = PARQUET_CODECS[encoding].decodeValues(
      'BYTE_ARRAY',
      {buffer: encoded, offset: 0, size: encoded.length},
      values.length,
      {}
    );
    expect(Array.from(decoded)).toEqual(values);
  }
);

test('delta encoders reject unsupported physical types', () => {
  expect(() => PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('FLOAT', [1], {})).toThrow(
    'does not support Parquet type FLOAT'
  );
  expect(() =>
    PARQUET_CODECS.DELTA_LENGTH_BYTE_ARRAY.encodeValues(
      'FIXED_LEN_BYTE_ARRAY',
      [new Uint8Array(2)],
      {}
    )
  ).toThrow('does not support Parquet type FIXED_LEN_BYTE_ARRAY');
});
