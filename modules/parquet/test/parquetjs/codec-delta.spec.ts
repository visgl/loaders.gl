// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {PARQUET_CODECS} from '@loaders.gl/parquet/parquetjs/codecs';

/** Creates an exact byte vector for concise codec fixtures. */
function bytes(values: number[]): Uint8Array {
  return new Uint8Array(values);
}

test('ParquetCodec::DELTA_BINARY_PACKED#decodes constant deltas', t => {
  const cursor = {
    buffer: bytes([0x80, 0x01, 0x04, 0x03, 0x02, 0x02, 0x00, 0x00, 0x00, 0x00]),
    offset: 0
  };

  t.deepEqual(PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues('INT32', cursor, 3, {}), [
    1, 2, 3
  ]);
  t.equal(cursor.offset, cursor.buffer.length, 'consumes the encoded block');
  t.end();
});

test('ParquetCodec::DELTA_LENGTH_BYTE_ARRAY#decodes lengths and payloads', t => {
  const cursor = {
    buffer: bytes([
      0x80,
      0x01,
      0x04,
      0x02,
      0x02,
      0x02,
      0x00,
      0x00,
      0x00,
      0x00,
      0x61,
      0x62,
      0x63
    ]),
    offset: 0
  };

  const values = PARQUET_CODECS.DELTA_LENGTH_BYTE_ARRAY.decodeValues(
    'BYTE_ARRAY',
    cursor,
    2,
    {}
  );
  t.deepEqual(values.map(value => Array.from(value)), [[0x61], [0x62, 0x63]]);
  t.equal(cursor.offset, cursor.buffer.length, 'consumes lengths and payloads');
  t.end();
});

test('ParquetCodec::DELTA_BYTE_ARRAY#reconstructs shared prefixes', t => {
  const prefixLengths = [
    0x80, 0x01, 0x04, 0x02, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00
  ];
  const suffixLengths = [
    0x80, 0x01, 0x04, 0x02, 0x06, 0x03, 0x00, 0x00, 0x00, 0x00
  ];
  const cursor = {
    buffer: bytes([...prefixLengths, ...suffixLengths, 0x61, 0x62, 0x63, 0x64]),
    offset: 0
  };

  const values = PARQUET_CODECS.DELTA_BYTE_ARRAY.decodeValues('BYTE_ARRAY', cursor, 2, {});
  t.deepEqual(values.map(value => Array.from(value)), [
    [0x61, 0x62, 0x63],
    [0x61, 0x62, 0x64]
  ]);
  t.equal(cursor.offset, cursor.buffer.length, 'consumes prefixes, suffixes, and payloads');
  t.end();
});

test('ParquetCodec::DELTA_BINARY_PACKED#rejects truncated data', t => {
  t.throws(
    () =>
      PARQUET_CODECS.DELTA_BINARY_PACKED.decodeValues(
        'INT32',
        {buffer: bytes([0x80]), offset: 0},
        1,
        {}
      ),
    /Unexpected end/
  );
  t.end();
});
