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

test('PLAIN exposes fixed-length values as contiguous Arrow bytes and offsets', () => {
  const encoded = bytes([0x61, 0x62, 0x63, 0x64, 0x65, 0x66]);
  const byteArrayOutput = {
    data: new Uint8Array(0),
    valueOffsets: new Int32Array(3),
    byteLength: 0
  };

  PARQUET_CODECS.PLAIN.decodeValues(
    'FIXED_LEN_BYTE_ARRAY',
    {buffer: encoded, offset: 0},
    2,
    {typeLength: 3, byteArrayOutput}
  );

  expect(byteArrayOutput.data.buffer).toBe(encoded.buffer);
  expect(byteArrayOutput.data).toEqual(encoded);
  expect(byteArrayOutput.valueOffsets).toEqual(new Int32Array([0, 3, 6]));
  expect(byteArrayOutput.byteLength).toBe(6);
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

test.each([1, 2, 3, 4])('RLE decodes complete groups and tails of %i-bit unsigned values', bitWidth => {
  const values = Array.from({length: 23}, (_, index) => index % 2 ** bitWidth);
  const encoded = PARQUET_CODECS.RLE.encodeValues('INT32', values, {
    bitWidth,
    disableEnvelope: true
  });
  const output = new Uint8Array(values.length + 2).fill(0xff);

  PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {buffer: encoded, offset: 0},
    values.length,
    {bitWidth, disableEnvelope: true, output, outputOffset: 1}
  );

  expect(output).toEqual(new Uint8Array([0xff, ...values, 0xff]));
});

test.each([1, 2, 3, 4, 10, 12])(
  'RLE resolves complete groups and tails of %i-bit dictionary indices',
  bitWidth => {
    const dictionary = Array.from({length: 2 ** bitWidth}, (_, index) => `value-${index}`);
    const indices = Array.from({length: 23}, (_, index) => index % dictionary.length);
    const encoded = PARQUET_CODECS.RLE.encodeValues('INT32', indices, {
      bitWidth,
      disableEnvelope: true
    });
    const output = new Array<unknown>(indices.length + 2).fill('untouched');

    PARQUET_CODECS.RLE.decodeValues(
      'INT32',
      {buffer: encoded, offset: 0},
      indices.length,
      {bitWidth, disableEnvelope: true, dictionary, output, outputOffset: 1}
    );

    expect(output).toEqual([
      'untouched',
      ...indices.map(index => dictionary[index]),
      'untouched'
    ]);
  }
);

test.each([
  {bitWidth: 10, dictionaryLength: 1000, invalidIndex: 1023, bytes: [0x03, 0xff, 0x03]},
  {bitWidth: 12, dictionaryLength: 4095, invalidIndex: 4095, bytes: [0x03, 0xff, 0x0f]}
])(
  'RLE rejects corrupt $bitWidth-bit dictionary index $invalidIndex',
  ({bitWidth, dictionaryLength, invalidIndex, bytes: encodedBytes}) => {
    expect(() =>
      PARQUET_CODECS.RLE.decodeValues(
        'INT32',
        {buffer: bytes(encodedBytes), offset: 0},
        8,
        {
          disableEnvelope: true,
          bitWidth,
          dictionary: new Array(dictionaryLength).fill(0),
          output: new Array(8)
        }
      )
    ).toThrow(`Invalid Parquet dictionary index ${invalidIndex}`);
  }
);

test('RLE rejects corrupt narrow bit-packed dictionary indices', () => {
  expect(() =>
    PARQUET_CODECS.RLE.decodeValues(
      'INT32',
      {buffer: bytes([0x03, 0x03]), offset: 0},
      8,
      {disableEnvelope: true, bitWidth: 1, dictionary: ['zero'], output: new Array(8)}
    )
  ).toThrow('Invalid Parquet dictionary index 1');
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

test('DELTA_BINARY_PACKED writes wrapping INT64 values directly into Arrow storage', () => {
  const values = [0x7fff_ffff_ffff_ffffn, -0x8000_0000_0000_0000n, 0x7fff_ffff_ffff_ffffn];
  const encoded = PARQUET_CODECS.DELTA_BINARY_PACKED.encodeValues('INT64', values, {});
  const output = new BigInt64Array(5).fill(-1n);
  const decoded = PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues(
    'INT64',
    {buffer: encoded, offset: 0},
    values.length,
    {output, outputOffset: 1, int64AsBigInt: true}
  );

  expect(decoded).toBe(output);
  expect(output).toEqual(new BigInt64Array([-1n, ...values, -1n]));
});

test('DELTA_LENGTH_BYTE_ARRAY writes contiguous Arrow bytes and offsets', () => {
  const values = [bytes([0x61]), bytes([0x62, 0x63]), bytes([0x64, 0x65, 0x66])];
  const encoded = PARQUET_CODECS.DELTA_LENGTH_BYTE_ARRAY.encodeValues('BYTE_ARRAY', values);
  const byteArrayOutput = {
    data: bytes([0xaa, 0xbb, 0, 0, 0, 0, 0, 0]),
    valueOffsets: new Int32Array(5),
    byteLength: 2
  };
  const output: unknown[] = [];

  const decoded = PARQUET_CODECS.DELTA_LENGTH_BYTE_ARRAY.decodeValues(
    'BYTE_ARRAY',
    {buffer: encoded, offset: 0},
    values.length,
    {output, outputOffset: 1, byteArrayOutput}
  );

  expect(decoded).toBe(output);
  expect(byteArrayOutput.data.subarray(0, byteArrayOutput.byteLength)).toEqual(
    bytes([0xaa, 0xbb, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66])
  );
  expect(byteArrayOutput.valueOffsets).toEqual(new Int32Array([0, 2, 3, 5, 8]));
});

test('DELTA_BYTE_ARRAY reconstructs shared prefixes in contiguous Arrow storage', () => {
  const values = [
    bytes([0x61, 0x62, 0x63]),
    bytes([0x61, 0x62, 0x64]),
    bytes([0x61, 0x62, 0x64, 0x65])
  ];
  const encoded = PARQUET_CODECS.DELTA_BYTE_ARRAY.encodeValues('BYTE_ARRAY', values);
  const byteArrayOutput = {
    data: new Uint8Array(4),
    valueOffsets: new Int32Array(values.length + 1),
    byteLength: 0
  };

  PARQUET_CODECS.DELTA_BYTE_ARRAY.decodeValues(
    'BYTE_ARRAY',
    {buffer: encoded, offset: 0},
    values.length,
    {byteArrayOutput}
  );

  expect(byteArrayOutput.data.subarray(0, byteArrayOutput.byteLength)).toEqual(
    bytes([0x61, 0x62, 0x63, 0x61, 0x62, 0x64, 0x61, 0x62, 0x64, 0x65])
  );
  expect(byteArrayOutput.valueOffsets).toEqual(new Int32Array([0, 3, 6, 10]));
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
