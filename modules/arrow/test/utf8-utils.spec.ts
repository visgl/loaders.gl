// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {compareUTF8, parseUTF8BigInt, parseUTF8Boolean, parseUTF8Number} from '@loaders.gl/arrow';
test('UTF8Utils#compareUTF8', () => {
  const bytes = new Uint8Array([
    0x70, 0x72, 0x65, 0x66, 0x69, 0x78, 0x3a, 0x61, 0x70, 0x70, 0x6c, 0x65, 0x7c, 0x62, 0x61, 0x6e,
    0x61, 0x6e, 0x61, 0x7c, 0xc3, 0xa4, 0x70, 0x70, 0x6c, 0x65, 0x7c, 0x61, 0x70, 0x70, 0x6c, 0x65,
    0x3a, 0x65, 0x6e, 0x64
  ]);
  const appleStart = 7;
  const appleEnd = 12;
  const bananaStart = appleEnd + 1;
  const bananaEnd = 19;
  const encodedAppleStart = bananaEnd + 1;
  const encodedAppleEnd = 26;
  const secondAppleStart = encodedAppleEnd + 1;
  const secondAppleEnd = 32;
  expect(
    compareUTF8(bytes, appleStart, appleEnd, bytes, secondAppleStart, secondAppleEnd),
    'compares equal byte ranges'
  ).toBe(0);
  expect(
    compareUTF8(bytes, appleStart, appleEnd, bytes, bananaStart, bananaEnd),
    'orders lower ASCII range before higher ASCII range'
  ).toBe(-1);
  expect(
    compareUTF8(bytes, bananaStart, bananaEnd, bytes, appleStart, appleEnd),
    'orders higher ASCII range after lower ASCII range'
  ).toBe(1);
  expect(
    compareUTF8(bytes, appleStart, appleEnd, bytes, encodedAppleStart, encodedAppleEnd),
    'orders ASCII bytes before non-ASCII UTF-8 bytes'
  ).toBe(-1);
  const prefixBytes = new Uint8Array([0x61, 0x7c, 0x61, 0x61]);
  expect(compareUTF8(prefixBytes, 0, 1, prefixBytes, 2, 4), 'orders prefix first').toBe(-1);
  expect(compareUTF8(prefixBytes, 2, 4, prefixBytes, 0, 1), 'orders longer prefix match last').toBe(
    1
  );
  expect(compareUTF8(prefixBytes, 0, 0, prefixBytes, 0, 0), 'compares empty ranges').toBe(0);
  expect(
    () => compareUTF8(prefixBytes, -1, 1, prefixBytes, 0, 1),
    'throws on invalid byte ranges'
  ).toThrow(/Invalid UTF-8 byte range/);
  expect(
    () => compareUTF8(prefixBytes, 0, 5, prefixBytes, 0, 1),
    'throws when a byte range exceeds the buffer'
  ).toThrow(/Invalid UTF-8 byte range/);
});
test('UTF8Utils#parseUTF8Number', () => {
  const bytes = new Uint8Array([
    0x78, 0x7c, 0x2d, 0x34, 0x32, 0x7c, 0x20, 0x20, 0x33, 0x2e, 0x35, 0x65, 0x32, 0x20, 0x20, 0x7c,
    0x2d, 0x2e, 0x32, 0x35, 0x7c, 0x31, 0x2e, 0x7c, 0x2e, 0x7c, 0x31, 0x65, 0x7c, 0x49, 0x6e, 0x66,
    0x69, 0x6e, 0x69, 0x74, 0x79, 0x7c, 0x31, 0x2c, 0x30, 0x30, 0x30, 0x7c, 0x30, 0x2e, 0x33, 0x7c,
    0x79
  ]);
  expect(parseUTF8Number(bytes, 2, 5), 'parses signed integer numbers').toBe(-42);
  expect(parseUTF8Number(bytes, 6, 15), 'parses trimmed decimal exponent numbers').toBe(350);
  expect(parseUTF8Number(bytes, 16, 20), 'parses leading-decimal numbers').toBe(-0.25);
  expect(parseUTF8Number(bytes, 21, 23), 'parses trailing-decimal numbers').toBe(1);
  expect(parseUTF8Number(bytes, 24, 25), 'rejects decimal point without digits').toBe(undefined);
  expect(parseUTF8Number(bytes, 26, 28), 'rejects exponent without digits').toBe(undefined);
  expect(parseUTF8Number(bytes, 29, 37), 'rejects Infinity').toBe(undefined);
  expect(parseUTF8Number(bytes, 38, 43), 'rejects formatted numbers').toBe(undefined);
  expect(parseUTF8Number(bytes, 44, 47), 'parses decimals without incremental scale error').toBe(
    0.3
  );
  expect(parseUTF8Number(bytes, 0, 0), 'rejects empty ranges').toBe(undefined);
  const extraBytes = new Uint8Array([
    0x2b, 0x31, 0x32, 0x7c, 0x31, 0x65, 0x2d, 0x32, 0x7c, 0x31, 0x65, 0x2b, 0x32, 0x7c, 0x09, 0x37,
    0x0d, 0x7c, 0x2b, 0x7c, 0x2d
  ]);
  expect(parseUTF8Number(extraBytes, 0, 3), 'parses plus-signed numbers').toBe(12);
  expect(parseUTF8Number(extraBytes, 4, 8), 'parses negative exponent numbers').toBe(0.01);
  expect(parseUTF8Number(extraBytes, 9, 13), 'parses plus-signed exponent numbers').toBe(100);
  expect(parseUTF8Number(extraBytes, 14, 17), 'trims ASCII control whitespace').toBe(7);
  expect(parseUTF8Number(extraBytes, 18, 19), 'rejects plus sign without digits').toBe(undefined);
  expect(parseUTF8Number(extraBytes, 20, 21), 'rejects minus sign without digits').toBe(undefined);
  expect(() => parseUTF8Number(extraBytes, 3, 2), 'throws on invalid number byte ranges').toThrow(
    /Invalid UTF-8 byte range/
  );
});
test('UTF8Utils#parseUTF8BigInt', () => {
  const bytes = new Uint8Array([
    0x78, 0x7c, 0x2d, 0x34, 0x32, 0x7c, 0x20, 0x2b, 0x39, 0x30, 0x30, 0x37, 0x31, 0x39, 0x39, 0x32,
    0x35, 0x34, 0x37, 0x34, 0x30, 0x39, 0x39, 0x33, 0x20, 0x7c, 0x31, 0x32, 0x2e, 0x35, 0x7c, 0x31,
    0x65, 0x33, 0x7c
  ]);
  expect(parseUTF8BigInt(bytes, 2, 5), 'parses signed bigint values').toBe(-42n);
  expect(
    parseUTF8BigInt(bytes, 6, 25),
    'parses trimmed bigint values beyond safe integer range'
  ).toBe(9007199254740993n);
  expect(parseUTF8BigInt(bytes, 26, 30), 'rejects decimal bigint values').toBe(undefined);
  expect(parseUTF8BigInt(bytes, 31, 34), 'rejects exponent bigint values').toBe(undefined);
  expect(parseUTF8BigInt(bytes, 0, 0), 'rejects empty ranges').toBe(undefined);
  const extraBytes = new Uint8Array([0x2b, 0x37, 0x7c, 0x2b, 0x7c, 0x20, 0x2d, 0x20]);
  expect(parseUTF8BigInt(extraBytes, 0, 2), 'parses plus-signed bigint values').toBe(7n);
  expect(parseUTF8BigInt(extraBytes, 3, 4), 'rejects plus-only bigint values').toBe(undefined);
  expect(parseUTF8BigInt(extraBytes, 5, 8), 'rejects minus-only bigint values').toBe(undefined);
  expect(
    () => parseUTF8BigInt(extraBytes, Number.NaN, 1),
    'throws on invalid bigint byte ranges'
  ).toThrow(/Invalid UTF-8 byte range/);
});
test('UTF8Utils#parseUTF8Boolean', () => {
  const bytes = new Uint8Array([
    0x78, 0x7c, 0x74, 0x72, 0x75, 0x65, 0x7c, 0x46, 0x41, 0x4c, 0x53, 0x45, 0x7c, 0x20, 0x54, 0x72,
    0x75, 0x65, 0x20, 0x7c, 0x30, 0x7c, 0x79, 0x65, 0x73, 0x7c
  ]);
  expect(parseUTF8Boolean(bytes, 2, 6), 'parses true').toBe(true);
  expect(parseUTF8Boolean(bytes, 7, 12), 'parses uppercase false').toBe(false);
  expect(parseUTF8Boolean(bytes, 13, 19), 'parses mixed-case trimmed true').toBe(true);
  expect(parseUTF8Boolean(bytes, 20, 21), 'rejects numeric booleans').toBe(undefined);
  expect(parseUTF8Boolean(bytes, 22, 25), 'rejects non-boolean text').toBe(undefined);
  expect(parseUTF8Boolean(bytes, 0, 0), 'rejects empty ranges').toBe(undefined);
  const extraBytes = new Uint8Array([
    0x66, 0x61, 0x6c, 0x73, 0x65, 0x7c, 0x54, 0x52, 0x55, 0x45, 0x53
  ]);
  expect(parseUTF8Boolean(extraBytes, 0, 5), 'parses lowercase false').toBe(false);
  expect(parseUTF8Boolean(extraBytes, 6, 11), 'rejects boolean prefixes').toBe(undefined);
  expect(
    () => parseUTF8Boolean(extraBytes, 0, 12),
    'throws on invalid boolean byte ranges'
  ).toThrow(/Invalid UTF-8 byte range/);
});
