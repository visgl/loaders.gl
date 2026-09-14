// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  convertColorArrayToFloat16,
  convertColorArrayToFloat32,
  createFloat16Array,
  encodeFloat16,
  getFloat16Storage,
  getFloat16Value,
  isNativeFloat16Array,
  setFloat16Value
} from '@loaders.gl/schema';
import {expect, test, vi} from 'vitest';

// Exercise native storage paths deterministically even in browsers without Float16Array.
vi.mock('@math.gl/types', () => ({
  getFloat16ArrayConstructor: () => Float32Array,
  NativeFloat16ArrayConstructor: Float32Array
}));

test('Float16 helpers support native and fallback storage', () => {
  const nativeStorage = createFloat16Array(2);
  const fallbackStorage = new Uint16Array(2);

  expect(isNativeFloat16Array(nativeStorage)).toBe(true);
  expect(isNativeFloat16Array(fallbackStorage)).toBe(false);

  setFloat16Value(nativeStorage, 0, 0.5);
  setFloat16Value(fallbackStorage, 0, 0.5);
  expect(getFloat16Value(nativeStorage, 0)).toBe(0.5);
  expect(getFloat16Value(fallbackStorage, 0)).toBeCloseTo(0.5, 3);

  expect(getFloat16Storage(nativeStorage)).toBeInstanceOf(Uint16Array);
  expect(getFloat16Storage(fallbackStorage)).toBe(fallbackStorage);

  const float16Colors = convertColorArrayToFloat16([0, 128, 255], 255);
  expect(getFloat16Value(float16Colors, 0)).toBe(0);
  expect(getFloat16Value(float16Colors, 1)).toBeCloseTo(0.50195, 4);
  expect(getFloat16Value(float16Colors, 2)).toBe(1);

  const float32Colors = convertColorArrayToFloat32([0, 128, 255], 255);
  expect(float32Colors[0]).toBe(0);
  expect(float32Colors[1]).toBeCloseTo(128 / 255, 6);
  expect(float32Colors[2]).toBe(1);
});

test('Float16 helpers cover binary16 special values and rounding boundaries', () => {
  expect(encodeFloat16(Infinity)).toBe(0x7c00);
  expect(encodeFloat16(-Infinity)).toBe(0xfc00);
  expect(encodeFloat16(NaN)).toBe(0x7e00);
  expect(encodeFloat16(0)).toBe(0x0000);
  expect(encodeFloat16(-0)).toBe(0x8000);
  expect(encodeFloat16(-1)).toBe(0xbc00);
  expect(encodeFloat16(65504)).toBe(0x7bff);
  expect(encodeFloat16(65520)).toBe(0x7c00);
  expect(encodeFloat16(70000)).toBe(0x7c00);
  expect(encodeFloat16(2 ** -24)).toBe(0x0001);
  expect(encodeFloat16(1.9999)).toBe(0x4000);

  const values = new Uint16Array([0x0000, 0x8001, 0x7c00, 0xfc00, 0x7e00, 0x3c00]);
  expect(getFloat16Value(values, 0)).toBe(0);
  expect(getFloat16Value(values, 1)).toBeCloseTo(-(2 ** -24), 10);
  expect(getFloat16Value(values, 2)).toBe(Infinity);
  expect(getFloat16Value(values, 3)).toBe(-Infinity);
  expect(getFloat16Value(values, 4)).toBeNaN();
  expect(getFloat16Value(values, 5)).toBe(1);
});
