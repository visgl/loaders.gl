// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, expectTypeOf, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {encode, encodeText, encodeTable, encodeTableAsText} from '@loaders.gl/core';
import type {WriterDataType} from '@loaders.gl/core/loader-utils';
import {CSVWriter} from '@loaders.gl/tables/csv';

/** Exact timestamp storage including one null, independent of JS Date precision. */
function makeTimestamps(type: arrow.Timestamp, positive: bigint): arrow.Vector<arrow.Timestamp> {
  return arrow.makeVector(
    arrow.makeData({
      type,
      length: 4,
      data: BigInt64Array.from([0n, positive, -1n, 0n]),
      nullBitmap: new Uint8Array([7]),
      nullCount: 1
    })
  );
}

/** Four Arrow units with epoch, positive, negative and null values. */
function makeTimestampTable(): arrow.Table {
  return new arrow.Table({
    seconds: makeTimestamps(new arrow.TimestampSecond('UTC'), 1479600000n),
    milliseconds: makeTimestamps(
      new arrow.TimestampMillisecond('America/New_York'),
      1479600000123n
    ),
    microseconds: makeTimestamps(new arrow.TimestampMicrosecond(), 1479600000123456n),
    nanoseconds: makeTimestamps(new arrow.TimestampNanosecond('UTC'), 1479600000123456789n)
  });
}

/** Unit-specific precision is retained, including fractions before the epoch. */
const EXPECTED = [
  'seconds,milliseconds,microseconds,nanoseconds',
  '1970-01-01T00:00:00Z,1970-01-01T00:00:00.000Z,1970-01-01T00:00:00.000000Z,1970-01-01T00:00:00.000000000Z',
  '2016-11-20T00:00:00Z,2016-11-20T00:00:00.123Z,2016-11-20T00:00:00.123456Z,2016-11-20T00:00:00.123456789Z',
  '1969-12-31T23:59:59Z,1969-12-31T23:59:59.999Z,1969-12-31T23:59:59.999999Z,1969-12-31T23:59:59.999999999Z',
  ',,,'
];

test('CSVWriter optionally formats native Arrow timestamp units without losing precision', async () => {
  const table = makeTimestampTable();
  const options = {csv: {timestampFormat: 'iso' as const}};
  expect(await encodeText(table, CSVWriter, options)).toBe(EXPECTED.join('\n'));
  expect(await encodeTableAsText(table, CSVWriter, options)).toBe(EXPECTED.join('\n'));
  expect(new TextDecoder().decode(await encodeTable(table, CSVWriter, options))).toBe(
    EXPECTED.join('\n')
  );
  expect(new TextDecoder().decode(await encode(table, CSVWriter, options))).toBe(
    EXPECTED.join('\n')
  );
  expectTypeOf(encodeTableAsText<typeof CSVWriter>)
    .parameter(0)
    .toEqualTypeOf<WriterDataType<typeof CSVWriter>>();
  expectTypeOf(encodeTable<typeof CSVWriter>)
    .parameter(0)
    .toEqualTypeOf<WriterDataType<typeof CSVWriter>>();
});

test('CSVWriter respects sliced value buffers, validity offsets and multiple record batches', async () => {
  const table = makeTimestampTable();
  const options = {csv: {timestampFormat: 'iso' as const}};
  expect(await encodeText(table.slice(1, 4), CSVWriter, options)).toBe(
    [EXPECTED[0], ...EXPECTED.slice(2)].join('\n')
  );
  const chunked = table.slice(0, 1).concat(table.slice(1, 3), table.slice(3, 4));
  expect(await encodeText(chunked, CSVWriter, options)).toBe(EXPECTED.join('\n'));
  expect(await encodeText(table.slice(0, 0), CSVWriter, options)).toBe(EXPECTED[0]);
});

test('CSVWriter preserves numeric timestamp output by default and ignores non-timestamp columns', async () => {
  const table = new arrow.Table({
    time: arrow.vectorFromArray(
      [new Date('2016-11-20T00:00:00Z')],
      new arrow.TimestampMillisecond('UTC')
    ),
    text: arrow.vectorFromArray(['2016-11-20, UTC'], new arrow.Utf8()),
    count: arrow.vectorFromArray([12], new arrow.Int32())
  });
  const expected = 'time,text,count\n1479600000000,"2016-11-20, UTC",12';
  expect(await encodeText(table, CSVWriter)).toBe(expected);
  expect(await encodeText(table, CSVWriter, {csv: {timestampFormat: 'number'}})).toBe(expected);
  expect(await encodeText(table, CSVWriter, {csv: {timestampFormat: 'iso'}})).toBe(
    'time,text,count\n2016-11-20T00:00:00.000Z,"2016-11-20, UTC",12'
  );
});

test('CSVWriter rejects timestamps outside the supported ISO calendar range', async () => {
  const table = new arrow.Table({
    time: makeTimestamps(new arrow.TimestampSecond(), 9223372036854775807n)
  });
  await expect(encodeText(table, CSVWriter, {csv: {timestampFormat: 'iso'}})).rejects.toThrow(
    'outside the ISO date range'
  );
});
