// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {PARQUET_CODECS} from '@loaders.gl/parquet/parquetjs/codecs';

/** Creates an exact byte vector for concise codec fixtures. */
function bytes(values: number[]): Uint8Array {
  return new Uint8Array(values);
}

test('PLAIN writes values into a caller-provided typed buffer', () => {
  const output = new Int32Array(5).fill(-1);
  const decoded = PARQUET_CODECS.PLAIN.decodeValues(
    'INT32',
    {buffer: bytes([1, 0, 0, 0, 254, 255, 255, 255, 3, 0, 0, 0]), offset: 0},
    3,
    {output, outputOffset: 1}
  );

  expect(decoded).toBe(output);
  expect(output).toEqual(new Int32Array([-1, 1, -2, 3, -1]));
});

test('RLE resolves bit-packed dictionary indices into the destination', () => {
  const output = new Float64Array(10).fill(-1);
  const dictionary = [11, 13, 17, 19, 23, 29, 31, 37];
  const decoded = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {buffer: bytes([0x03, 0x88, 0xc6, 0xfa]), offset: 0},
    8,
    {disableEnvelope: true, bitWidth: 3, dictionary, output, outputOffset: 1}
  );

  expect(decoded).toBe(output);
  expect(Array.from(output)).toEqual([-1, ...dictionary, -1]);
});

test('RLE resolves repeated dictionary indices into the destination', () => {
  const output = new Int32Array(8);
  PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {buffer: bytes([0x10, 0x02]), offset: 0},
    8,
    {disableEnvelope: true, bitWidth: 3, dictionary: [10, 20, 30], output}
  );

  expect(output).toEqual(new Int32Array(8).fill(30));
});

test('RLE rejects corrupt dictionary indices instead of writing coerced zeroes', () => {
  expect(() =>
    PARQUET_CODECS.RLE.decodeValues(
      'INT32',
      {buffer: bytes([0x10, 0x03]), offset: 0},
      8,
      {disableEnvelope: true, bitWidth: 3, dictionary: [10, 20, 30], output: new Int32Array(8)}
    )
  ).toThrow('Invalid Parquet dictionary index 3');
});

test('DELTA_BINARY_PACKED writes values at a destination offset', () => {
  const output = new Int32Array(6).fill(-1);
  const decoded = PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues(
    'INT32',
    {
      buffer: bytes([0x80, 0x01, 0x04, 0x03, 0x02, 0x02, 0x00, 0x00, 0x00, 0x00]),
      offset: 0
    },
    3,
    {output, outputOffset: 2}
  );

  expect(decoded).toBe(output);
  expect(output).toEqual(new Int32Array([-1, -1, 1, 2, 3, -1]));
});

test('PLAIN keeps boolean arrays compatible and supports compact typed destinations', () => {
  const arrayValues = PARQUET_CODECS.PLAIN.decodeValues(
    'BOOLEAN',
    {buffer: bytes([0x05]), offset: 0},
    3,
    {}
  );
  const typedValues = new Uint8Array(3);
  PARQUET_CODECS.PLAIN.decodeValues(
    'BOOLEAN',
    {buffer: bytes([0x05]), offset: 0},
    3,
    {output: typedValues}
  );

  expect(arrayValues).toEqual([true, false, true]);
  expect(typedValues).toEqual(new Uint8Array([1, 0, 1]));
});

test('PLAIN preserves exact INT64 values in BigInt destinations', () => {
  const encoded = new Uint8Array(8);
  new DataView(encoded.buffer).setBigInt64(0, 9007199254740993n, true);
  const output = new BigInt64Array(1);

  PARQUET_CODECS.PLAIN.decodeValues('INT64', {buffer: encoded, offset: 0}, 1, {
    int64AsBigInt: true,
    output
  });

  expect(output[0]).toBe(9007199254740993n);
});
