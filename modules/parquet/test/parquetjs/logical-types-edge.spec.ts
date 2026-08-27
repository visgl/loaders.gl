// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {fromPrimitive, toPrimitive} from '../../src/parquetjs/schema/types';

test('Parquet logical types convert scalar, text, JSON, and temporal values', () => {
  expect(toPrimitive('BOOLEAN' as any, 1)).toBe(true);
  expect(toPrimitive('FLOAT' as any, '1.25')).toBe(1.25);
  expect(toPrimitive('DOUBLE' as any, '2.5')).toBe(2.5);
  expect(toPrimitive('INT_8' as any, '-8')).toBe(-8);
  expect(toPrimitive('UINT_16' as any, '65535')).toBe(65535);
  expect(toPrimitive('INT64' as any, '9007199254740993')).toBe(9007199254740993n);
  expect(toPrimitive('UINT_64' as any, 7)).toBe(7n);
  expect(toPrimitive('INT96' as any, '123')).toBe(123);

  const text = toPrimitive('UTF8' as any, 'café');
  expect(fromPrimitive('UTF8' as any, text)).toBe('café');
  const json = toPrimitive('JSON' as any, {id: 3, ok: true});
  expect(fromPrimitive('JSON' as any, json)).toEqual({id: 3, ok: true});

  const date = new Date('2024-01-02T00:00:00.000Z');
  expect(fromPrimitive('DATE' as any, toPrimitive('DATE' as any, date))).toEqual(date);
  expect(fromPrimitive('TIMESTAMP_MILLIS' as any, toPrimitive('TIMESTAMP_MILLIS' as any, date))).toEqual(date);
  expect(toPrimitive('TIMESTAMP_MICROS' as any, date)).toBe(BigInt(date.getTime()) * 1000n);
  expect(toPrimitive('TIMESTAMP_NANOS' as any, date)).toBe(BigInt(date.getTime()) * 1_000_000n);
  expect(toPrimitive('TIME_MILLIS' as any, '1234')).toBe(1234);
  expect(toPrimitive('TIME_MICROS' as any, '1234')).toBe(1234n);
  expect(toPrimitive('TIME_NANOS' as any, '1234')).toBe(1234n);
});

test('Parquet logical types convert binary16, intervals, and decimals', () => {
  for (const value of [0, 1, -2, 65504, Infinity, NaN]) {
    const encoded = toPrimitive('FLOAT16' as any, value);
    const decoded = fromPrimitive('FLOAT16' as any, encoded) as number;
    expect(Number.isNaN(value) ? Number.isNaN(decoded) : typeof decoded).toBe(
      Number.isNaN(value) ? true : 'number'
    );
  }

  const interval = toPrimitive('INTERVAL' as any, {months: 2, days: 3, milliseconds: 4000});
  expect(fromPrimitive('INTERVAL' as any, interval)).toEqual({
    months: 2,
    days: 3,
    milliseconds: 4000
  });

  const decimalField = {scale: 2, precision: 6, typeLength: 4} as any;
  const decimal = toPrimitive('DECIMAL_BYTE_ARRAY' as any, '-12.34', decimalField);
  expect(Array.from(decimal as Uint8Array)).toEqual([255, 255, 251, 46]);
  expect(
    fromPrimitive('DECIMAL_BYTE_ARRAY' as any, new Uint8Array([0, 0, 4, 210]), {
      ...decimalField,
      presision: 2
    })
  ).toBe(12.34);
  expect(toPrimitive('DECIMAL_INT32' as any, 1.25, {scale: 2, presision: 4} as any)).toBe(125);
});

test('Parquet logical types reject invalid values and unknown types', () => {
  expect(() => toPrimitive('FLOAT' as any, 'nope')).toThrow(/invalid value/);
  expect(() => toPrimitive('INT_8' as any, 200)).toThrow(/invalid value/);
  expect(() => toPrimitive('TIME_MILLIS' as any, 86400000)).toThrow(/invalid value/);
  expect(() => toPrimitive('TIME_MICROS' as any, -1)).toThrow(/invalid value/);
  expect(() => toPrimitive('FLOAT16' as any, 'nope')).toThrow(/invalid value/);
  expect(() => fromPrimitive('FLOAT16' as any, new Uint8Array([1]))).toThrow(/byte length/);
  expect(() => toPrimitive('INTERVAL' as any, {months: 1})).toThrow(/INTERVAL/);
  expect(() => toPrimitive('DECIMAL_BYTE_ARRAY' as any, '1.234', {scale: 2} as any)).toThrow(
    /fractional digits/
  );
  expect(() => toPrimitive('UNKNOWN_TYPE' as any, 1)).toThrow(/invalid type/);
  expect(() => fromPrimitive('UNKNOWN_TYPE' as any, 1)).toThrow(/invalid type/);
});
