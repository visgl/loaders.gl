import {encode} from '@loaders.gl/core';
import {BlobFile} from '@loaders.gl/loader-utils';
import {ParquetJSWriter, ParquetReader} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {expect, test} from 'vitest';

import {convertParquetSchema} from '../src/lib/arrow/convert-schema-from-parquet';
import {PARQUET_CODECS} from '../src/parquetjs/codecs';
import {ParquetSchema} from '../src/parquetjs/schema/schema';

const JULIAN_DAY_UNIX_EPOCH = 2440588;

test('INT96 decoder can produce canonical epoch nanoseconds', () => {
  const bytes = new Uint8Array(12);
  const dataView = new DataView(bytes.buffer);
  dataView.setBigUint64(0, 1_234_567_890n, true);
  dataView.setInt32(8, JULIAN_DAY_UNIX_EPOCH, true);

  const cursor = {buffer: bytes, offset: 0};
  const values = PARQUET_CODECS.PLAIN.decodeValues('INT96', cursor, 1, {
    int96AsTimestamp: true
  });

  expect(values).toEqual([1_234_567_890n]);
  expect(cursor.offset).toBe(12);
});

test('INT96 encoder writes canonical Julian-day timestamps', () => {
  const encoded = PARQUET_CODECS.PLAIN.encodeValues(
    'INT96',
    [-1n, 0n, 86_400_000_000_001n],
    {int96AsTimestamp: true}
  );
  const values = PARQUET_CODECS.PLAIN.decodeValues(
    'INT96',
    {buffer: encoded, offset: 0},
    3,
    {int96AsTimestamp: true}
  );

  expect(values).toEqual([-1n, 0n, 86_400_000_000_001n]);
});

test('INT96 decoder rejects an invalid nanoseconds-of-day value', () => {
  const bytes = new Uint8Array(12);
  const dataView = new DataView(bytes.buffer);
  dataView.setBigUint64(0, 86_400_000_000_000n, true);
  dataView.setInt32(8, JULIAN_DAY_UNIX_EPOCH, true);

  expect(() =>
    PARQUET_CODECS.PLAIN.decodeValues('INT96', {buffer: bytes, offset: 0}, 1, {
      int96AsTimestamp: true
    })
  ).toThrow('Invalid INT96 nanoseconds of day');
});

test('INT96 decoder rejects timestamps outside the Arrow nanosecond range', () => {
  const bytes = new Uint8Array(12);
  const dataView = new DataView(bytes.buffer);
  dataView.setBigUint64(0, 0n, true);
  dataView.setInt32(8, 3_000_000, true);

  expect(() =>
    PARQUET_CODECS.PLAIN.decodeValues('INT96', {buffer: bytes, offset: 0}, 1, {
      int96AsTimestamp: true
    })
  ).toThrow('outside the signed 64-bit range');
});

test('INT96 encoder rejects timestamps outside the signed 64-bit range', () => {
  expect(() =>
    PARQUET_CODECS.PLAIN.encodeValues('INT96', [2n ** 63n], {int96AsTimestamp: true})
  ).toThrow('outside the signed 64-bit range');
});

test('ParquetJSWriter maps timestamp-nanosecond fields to canonical INT96', async () => {
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [{name: 'event_time', type: 'timestamp-nanosecond', nullable: false}],
      metadata: {}
    },
    data: [{event_time: -1n}, {event_time: 0n}]
  };

  const parquetBuffer = await encode(table, ParquetJSWriter, {
    worker: false,
    parquet: {int96AsTimestamp: true}
  });
  const schema = await new ParquetReader(new BlobFile(parquetBuffer)).getSchema();

  expect(schema.findField('event_time').primitiveType).toBe('INT96');
});

test('INT96 schema mapping is opt-in for timestamp Arrow output', () => {
  const parquetSchema = new ParquetSchema({event_time: {type: 'INT96', optional: false}});

  expect(convertParquetSchema(parquetSchema, null).fields[0].type).toBe('float64');
  expect(
    convertParquetSchema(parquetSchema, null, {int96AsTimestamp: true}).fields[0].type
  ).toBe('timestamp-nanosecond');
});
