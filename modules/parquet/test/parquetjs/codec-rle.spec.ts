import test from 'tape-promise/tape';
import {PARQUET_CODECS} from '@loaders.gl/parquet/parquetjs/codecs';

test('ParquetCodec::RLE#should encode bitpacked values', assert => {
  const buf = PARQUET_CODECS.RLE.encodeValues(
    'INT32',
    [0, 1, 2, 3, 4, 5, 6, 7],
    {
      disableEnvelope: true,
      bitWidth: 3
    });

  assert.deepEqual(buf, new Buffer([0x03, 0x88, 0xc6, 0xfa]));
  assert.end();
});

test('ParquetCodec::RLE#should decode bitpacked values', assert => {
  const vals = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {
      buffer: new Buffer([0x03, 0x88, 0xc6, 0xfa]),
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

  assert.deepEqual(buf, new Buffer([0x05, 0x88, 0xc6, 0xfa, 0x2e, 0x00, 0x00]));
  assert.end();
});

test('ParquetCodec::RLE#should decode bitpacked values', assert => {
  const vals = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {
      buffer: new Buffer([0x05, 0x88, 0xc6, 0xfa, 0x2e, 0x00, 0x00]),
      offset: 0,
    },
    10,
    {
      disableEnvelope: true,
      bitWidth: 3
    });

  assert.deepEqual(vals, [0, 1, 2, 3, 4, 5, 6, 7, 6, 5]);
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

  assert.deepEqual(buf, new Buffer([0x10, 0x2a]));
  assert.end();
});

test('ParquetCodec::RLE#should decode repeated values', assert => {
  const vals = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {
      buffer: new Buffer([0x10, 0x2a]),
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

test('ParquetCodec::RLE#should encode mixed runs', assert => {
  const buf = PARQUET_CODECS.RLE.encodeValues(
    'INT32',
    [0, 1, 2, 3, 4, 5, 6, 7, 4, 4, 4, 4, 4, 4, 4, 4, 0, 1, 2, 3, 4, 5, 6, 7],
    {
      disableEnvelope: true,
      bitWidth: 3
    });

  assert.deepEqual(buf, new Buffer([0x03, 0x88, 0xc6, 0xfa, 0x10, 0x04, 0x03, 0x88, 0xc6, 0xfa]));
  assert.end();
});

test('ParquetCodec::RLE#should decode mixed runs', assert => {
  const vals = PARQUET_CODECS.RLE.decodeValues(
    'INT32',
    {
      buffer: new Buffer([0x03, 0x88, 0xc6, 0xfa, 0x10, 0x04, 0x03, 0x88, 0xc6, 0xfa]),
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
