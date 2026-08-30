// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fromPrimitive, toPrimitive} from '../../src/parquetjs/schema/types';

test('Parquet integer logical types enforce every signed and unsigned boundary', () => {
  const validCases: Array<[string, unknown, number | bigint]> = [
    ['INT_8', -128, -128],
    ['INT_8', 127, 127],
    ['UINT_8', 255, 255],
    ['INT_16', -32768, -32768],
    ['INT_16', 32767, 32767],
    ['UINT_16', 65535, 65535],
    ['INT_32', -2147483648, -2147483648],
    ['INT32', 2147483647, 2147483647],
    ['UINT_32', 4294967295, 4294967295],
    ['INT64', -(2n ** 63n), -(2n ** 63n)],
    ['INT_64', 2n ** 63n - 1n, 2n ** 63n - 1n],
    ['UINT_64', 2n ** 64n - 1n, -1n]
  ];
  for (const [type, value, expected] of validCases) {
    expect(toPrimitive(type as any, value)).toBe(expected);
  }

  const invalidCases: Array<[string, unknown]> = [
    ['INT_8', -129],
    ['INT_8', 128],
    ['UINT_8', -1],
    ['UINT_8', 256],
    ['INT_16', -32769],
    ['INT_16', 32768],
    ['UINT_16', -1],
    ['UINT_16', 65536],
    ['INT32', -2147483649],
    ['INT_32', 2147483648],
    ['UINT_32', -1],
    ['UINT_32', 4294967296],
    ['INT64', Number.MAX_SAFE_INTEGER + 1],
    ['INT64', 'invalid'],
    ['INT64', 2n ** 63n],
    ['UINT_64', -1],
    ['UINT_64', 2n ** 64n]
  ];
  for (const [type, value] of invalidCases) {
    expect(() => toPrimitive(type as any, value)).toThrow('invalid value');
  }
});

test('Parquet INT96 preserves safe numbers and promotes large decimal strings', () => {
  expect(toPrimitive('INT96' as any, 42)).toBe(42);
  expect(toPrimitive('INT96' as any, 42n)).toBe(42n);
  expect(toPrimitive('INT96' as any, '9007199254740992')).toBe(9007199254740992n);
  expect(toPrimitive('INT96' as any, '-7')).toBe(-7);
  expect(() => toPrimitive('INT96' as any, Number.MAX_SAFE_INTEGER + 1)).toThrow('invalid value');
  expect(() => toPrimitive('INT96' as any, '1.5')).toThrow('invalid value');
  expect(() => toPrimitive('INT96' as any, {})).toThrow('invalid value');
});

test('Parquet floating-point logical types cover special binary16 encodings', () => {
  const float16Cases = [
    [0, 0],
    [-0, -0],
    [2 ** -24, 2 ** -24],
    [2 ** -25, 0],
    [65504, 65504],
    [1e10, Infinity],
    [-Infinity, -Infinity]
  ];
  for (const [value, expected] of float16Cases) {
    const decoded = fromPrimitive('FLOAT16' as any, toPrimitive('FLOAT16' as any, value));
    expect(Object.is(decoded, expected) || decoded === expected).toBe(true);
  }
  expect(Number.isNaN(fromPrimitive('FLOAT16' as any, new Uint8Array([0x00, 0x7e])))).toBe(true);
  expect(() => toPrimitive('DOUBLE' as any, 'invalid')).toThrow('invalid value');
  expect(() => toPrimitive('FLOAT' as any, undefined)).toThrow('invalid value');
});

test('Parquet byte arrays accept strings and every ArrayBuffer view shape', () => {
  expect(new TextDecoder().decode(toPrimitive('BYTE_ARRAY' as any, 'hello') as Uint8Array)).toBe(
    'hello'
  );
  const buffer = Uint8Array.from([1, 2, 3, 4]).buffer;
  expect(Array.from(toPrimitive('FIXED_LEN_BYTE_ARRAY' as any, buffer) as Uint8Array)).toEqual([
    1, 2, 3, 4
  ]);
  expect(
    Array.from(toPrimitive('GEOMETRY' as any, new Uint8Array(buffer, 1, 2)) as Uint8Array)
  ).toEqual([2, 3]);
  expect(fromPrimitive('INT32' as any, 12)).toBe(12);
});

test('Parquet decimal byte arrays cover exact scaling, sizing, and rejection paths', () => {
  expect(
    Array.from(
      toPrimitive('DECIMAL_BYTE_ARRAY' as any, '1.2e2', {scale: 1, precision: 5} as any) as Uint8Array
    )
  ).toEqual([4, 176]);
  expect(
    Array.from(
      toPrimitive('DECIMAL_BYTE_ARRAY' as any, -128n, {scale: 0, precision: 4} as any) as Uint8Array
    )
  ).toEqual([128]);
  expect(
    toPrimitive('DECIMAL_BYTE_ARRAY' as any, new Uint8Array([1, 2]), {
      scale: 0,
      typeLength: 2
    } as any)
  ).toEqual(new Uint8Array([1, 2]));
  expect(() =>
    toPrimitive('DECIMAL_BYTE_ARRAY' as any, new Uint8Array([1]), {typeLength: 2} as any)
  ).toThrow('byte width');
  expect(() =>
    toPrimitive('DECIMAL_BYTE_ARRAY' as any, '1234', {precision: 3} as any)
  ).toThrow('exceeds precision');
  expect(() =>
    toPrimitive('DECIMAL_FIXED_LEN_BYTE_ARRAY' as any, 128, {typeLength: 1} as any)
  ).toThrow('does not fit');
  expect(() =>
    toPrimitive('DECIMAL_BYTE_ARRAY' as any, 1, {scale: -1} as any)
  ).toThrow('invalid DECIMAL scale');
  expect(() =>
    toPrimitive('DECIMAL_BYTE_ARRAY' as any, Number.POSITIVE_INFINITY, {scale: 2} as any)
  ).toThrow('cannot be represented exactly');
  expect(() =>
    toPrimitive('DECIMAL_BYTE_ARRAY' as any, {}, {scale: 2} as any)
  ).toThrow('invalid value for DECIMAL');
  expect(() =>
    toPrimitive('DECIMAL_BYTE_ARRAY' as any, 'nope', {scale: 2} as any)
  ).toThrow('invalid value for DECIMAL');
  expect(() =>
    toPrimitive('DECIMAL_BYTE_ARRAY' as any, '1.234', {scale: 2} as any)
  ).toThrow('fractional digits');
});

test('Parquet temporal, interval, JSON, and BSON conversions cover alternate inputs', () => {
  expect(toPrimitive('DATE' as any, '-1')).toBe(-1);
  expect(toPrimitive('TIMESTAMP_MILLIS' as any, '1000')).toBe(1000);
  expect(toPrimitive('TIMESTAMP_MICROS' as any, '1000000')).toBe(1000000n);
  expect(toPrimitive('TIMESTAMP_NANOS' as any, '1000000')).toBe(1000000n);
  expect(fromPrimitive('TIMESTAMP_MICROS' as any, 1000000n)).toEqual(new Date(1000));
  expect(() => toPrimitive('DATE' as any, 2147483648)).toThrow('invalid value');
  expect(() => toPrimitive('TIMESTAMP_MILLIS' as any, Number.MAX_SAFE_INTEGER + 1)).toThrow(
    'invalid value'
  );
  expect(() => toPrimitive('TIMESTAMP_MICROS' as any, 'invalid')).toThrow('invalid value');
  expect(() => toPrimitive('TIME_NANOS' as any, 86_400_000_000_000n)).toThrow('invalid value');

  const interval = toPrimitive('INTERVAL' as any, {months: 12, days: 31, milliseconds: 999});
  expect(fromPrimitive('INTERVAL' as any, interval)).toEqual({
    months: 12,
    days: 31,
    milliseconds: 999
  });
  const bson = toPrimitive('BSON' as any, {name: 'tile', count: 2});
  expect(fromPrimitive('BSON' as any, bson)).toEqual({name: 'tile', count: 2});
});
