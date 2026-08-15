// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {PARQUET_CODECS} from '@loaders.gl/parquet/parquetjs/codecs';

function bytes(values: number[]): Uint8Array {
  return new Uint8Array(values);
}

/** Encodes one eight-value bit-packed run for cross-width decoder tests. */
function encodeBitPackedRun(values: number[], bitWidth: number): Uint8Array {
  const encoded = [0x03];
  let packedBits = 0n;
  let packedBitCount = 0;
  for (const value of values) {
    packedBits |= BigInt(value) << BigInt(packedBitCount);
    packedBitCount += bitWidth;
    while (packedBitCount >= 8) {
      encoded.push(Number(packedBits & 0xffn));
      packedBits >>= 8n;
      packedBitCount -= 8;
    }
  }
  return bytes(encoded);
}

test('ParquetCodec::RLE#should encode bitpacked values', assert => {
  const buf = PARQUET_CODECS.RLE.encodeValues(
    'INT32',
    [0, 1, 2, 3, 4, 5, 6, 7],
    {
      disableEnvelope: true,
      bitWidth: 3
    });

  assert.deepEqual(buf, bytes([0x03, 0x88, 0xc6, 0xfa]));
  assert.end();
});

test('ParquetCodec::RLE#should decode bitpacked values', assert => {
  const vals = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {
      buffer: bytes([0x03, 0x88, 0xc6, 0xfa]),
      offset: 0,
    },
    8,
    {
      disableEnvelope: true,
      bitWidth: 3
    });

  assert.deepEqual(vals, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.end();
});

// test('number of values not a multiple of 8', () => {

test('ParquetCodec::RLE#should encode bitpacked values', assert => {
  const buf = PARQUET_CODECS.RLE.encodeValues(
    'INT32',
    [0, 1, 2, 3, 4, 5, 6, 7, 6, 5],
    {
      disableEnvelope: true,
      bitWidth: 3
    });

  assert.deepEqual(buf, bytes([0x05, 0x88, 0xc6, 0xfa, 0x2e, 0x00, 0x00]));
  assert.end();
});

test('ParquetCodec::RLE#should decode bitpacked values', assert => {
  const cursor = {
    buffer: bytes([0x05, 0x88, 0xc6, 0xfa, 0x2e, 0x00, 0x00]),
    offset: 0
  };
  const vals = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    cursor,
    10,
    {
      disableEnvelope: true,
      bitWidth: 3
    });

  assert.deepEqual(vals, [0, 1, 2, 3, 4, 5, 6, 7, 6, 5]);
  assert.equal(cursor.offset, cursor.buffer.length, 'consumes padding from the complete run');
  assert.end();
});

test('ParquetCodec::RLE#decodes wide bitpacked values', assert => {
  const vals = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {
      buffer: bytes([0x03, 0xbc, 0x3a, 0x12, 0xff, 0x0f, 0x00, 0x01, 0x20, 0x00, 0x03, 0x40, 0x00]),
      offset: 0
    },
    8,
    {
      disableEnvelope: true,
      bitWidth: 12
    }
  );

  assert.deepEqual(vals, [0xabc, 0x123, 0xfff, 0, 1, 2, 3, 4]);
  assert.end();
});

test('ParquetCodec::RLE#decodes every reservoir width', assert => {
  for (const bitWidth of [0, 1, 7, 8, 9, 16, 24, 25, 32, 45, 46, 53, 64]) {
    const divisor = bitWidth === 0 ? 1 : 2 ** Math.min(bitWidth, 52);
    const values = [0, 1, 2, 3, 7, 15, 31, divisor - 1].map(value => value % divisor);
    const decoded = PARQUET_CODECS.RLE.decodeValues(
      'INT64',
      {buffer: encodeBitPackedRun(values, bitWidth), offset: 0},
      values.length,
      {disableEnvelope: true, bitWidth}
    );
    assert.deepEqual(decoded, values, `decodes bit width ${bitWidth}`);
  }
  assert.end();
});

test('ParquetCodec::RLE#should encode repeated values', assert => {
  const buf = PARQUET_CODECS.RLE.encodeValues(
    'INT32',
    [42, 42, 42, 42, 42, 42, 42, 42],
    {
      disableEnvelope: true,
      bitWidth: 6
    });

  assert.deepEqual(buf, bytes([0x10, 0x2a]));
  assert.end();
});

test('ParquetCodec::RLE#should decode repeated values', assert => {
  const vals = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {
      buffer: bytes([0x10, 0x2a]),
      offset: 0,
    },
    8,
    {
      disableEnvelope: true,
      bitWidth: 3
    });

  assert.deepEqual(vals, [42, 42, 42, 42, 42, 42, 42, 42]);
  assert.end();
});

test('ParquetCodec::RLE#decodes multi-byte repeated values as little endian', assert => {
  const vals = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {
      buffer: bytes([0x10, 0xbc, 0x0a]),
      offset: 0
    },
    8,
    {
      disableEnvelope: true,
      bitWidth: 12
    }
  );

  assert.deepEqual(vals, new Array(8).fill(0xabc));
  assert.end();
});

test('ParquetCodec::RLE#zero-fills malformed dictionary runs', assert => {
  assert.deepEqual(
    PARQUET_CODECS.RLE.decodeValues(
      'INT32',
      {buffer: bytes([0x03, 0x88]), offset: 0},
      8,
      {disableEnvelope: true, bitWidth: 3}
    ),
    [0, 1, 2, 0, 0, 0, 0, 0],
    'preserves compatibility with legacy files that omit trailing dictionary bytes'
  );
  assert.end();
});

test('ParquetCodec::RLE#should encode mixed runs', assert => {
  const buf = PARQUET_CODECS.RLE.encodeValues(
    'INT32',
    [0, 1, 2, 3, 4, 5, 6, 7, 4, 4, 4, 4, 4, 4, 4, 4, 0, 1, 2, 3, 4, 5, 6, 7],
    {
      disableEnvelope: true,
      bitWidth: 3
    });

  assert.deepEqual(buf, bytes([0x03, 0x88, 0xc6, 0xfa, 0x10, 0x04, 0x03, 0x88, 0xc6, 0xfa]));
  assert.end();
});

test('ParquetCodec::RLE#should decode mixed runs', assert => {
  const vals = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {
      buffer: bytes([0x03, 0x88, 0xc6, 0xfa, 0x10, 0x04, 0x03, 0x88, 0xc6, 0xfa]),
      offset: 0,
    },
    24,
    {
      disableEnvelope: true,
      bitWidth: 3
    });

  assert.deepEqual(
    vals,
    [0, 1, 2, 3, 4, 5, 6, 7, 4, 4, 4, 4, 4, 4, 4, 4, 0, 1, 2, 3, 4, 5, 6, 7]);
  assert.end();
});
