// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {encode, load} from '@loaders.gl/core';
import {ParquetJSLoader, ParquetJSWriter} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {expect, test} from 'vitest';

const TIMESTAMP_NANOS = 1_700_000_000_123_456_789n;
const TIME_NANOS = 43_200_123_456_789n;
const UINT64_MAXIMUM = 18_446_744_073_709_551_615n;

test('ParquetJS logical types round-trip into exact Arrow vectors', async () => {
  const input: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {name: 'unsigned8', type: 'uint8', nullable: false},
        {name: 'unsigned64', type: 'uint64', nullable: false},
        {name: 'timeNanos', type: 'time-nanosecond', nullable: false},
        {name: 'timestampNanos', type: 'timestamp-nanosecond', nullable: false},
        {
          name: 'decimal',
          type: {type: 'decimal', bitWidth: 128, precision: 18, scale: 3},
          nullable: false
        },
        {name: 'half', type: 'float16', nullable: false},
        {name: 'date', type: 'date-day', nullable: false}
      ],
      metadata: {}
    },
    data: [
      {
        unsigned8: 255,
        unsigned64: UINT64_MAXIMUM,
        timeNanos: TIME_NANOS,
        timestampNanos: TIMESTAMP_NANOS,
        decimal: 12_345.678,
        half: 1.5,
        date: -1
      }
    ]
  };

  const parquetBuffer = await encode(input, ParquetJSWriter, {worker: false});
  const output = await load(parquetBuffer, ParquetJSLoader, {
    core: {worker: false},
    parquet: {shape: 'arrow-table'}
  });

  expect(output.shape).toBe('arrow-table');
  if (output.shape !== 'arrow-table') return;

  const fields = output.data.schema.fields;
  expect(fields.map(field => field.type.constructor)).toEqual([
    arrow.Uint8,
    arrow.Uint64,
    arrow.TimeNanosecond,
    arrow.TimestampNanosecond,
    arrow.Decimal,
    arrow.Float16,
    arrow.DateDay
  ]);
  expect(output.data.getChild('unsigned8')?.get(0)).toBe(255);
  expect(output.data.getChild('unsigned64')?.get(0)).toBe(UINT64_MAXIMUM);
  expect(output.data.getChild('timeNanos')?.data[0].values[0]).toBe(TIME_NANOS);
  expect(output.data.getChild('timestampNanos')?.data[0].values[0]).toBe(TIMESTAMP_NANOS);
  expect(output.data.getChild('decimal')?.data[0].values[0]).toBe(12_345_678);
  expect(output.data.getChild('decimal')?.type).toMatchObject({precision: 18, scale: 3, bitWidth: 128});
  expect(output.data.getChild('half')?.get(0)).toBe(1.5);
  expect(output.data.getChild('date')?.get(0)).toBe(-86_400_000);
});
