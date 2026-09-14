// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getFloat16ArrayConstructor, NativeFloat16ArrayConstructor} from '@math.gl/types';

/** Array storage used for logical Float16 values. */
export type Float16ArrayStorage = Float16Array | Uint16Array;

/** Create native Float16 storage when the runtime supports it. */
export function createFloat16Array(length: number): Float16ArrayStorage {
  const ArrayConstructor = getFloat16ArrayConstructor();
  return new ArrayConstructor(length) as Float16ArrayStorage;
}

/** Check whether an array is backed by the native Float16Array implementation. */
export function isNativeFloat16Array(value: unknown): value is Float16Array {
  return Boolean(NativeFloat16ArrayConstructor && value instanceof NativeFloat16ArrayConstructor);
}

/** Write a numeric value into native or binary16 fallback storage. */
export function setFloat16Value(array: Float16ArrayStorage, index: number, value: number): void {
  if (isNativeFloat16Array(array)) {
    array[index] = value;
  } else {
    array[index] = encodeFloat16(value);
  }
}

/** Read a numeric value from native or binary16 fallback storage. */
export function getFloat16Value(array: Float16ArrayStorage, index: number): number {
  if (isNativeFloat16Array(array)) {
    return array[index];
  }
  return decodeFloat16(array[index]);
}

/** Return the binary16 words used by Apache Arrow and GPU APIs. */
export function getFloat16Storage(array: Float16ArrayStorage): Uint16Array {
  return isNativeFloat16Array(array)
    ? new Uint16Array(array.buffer, array.byteOffset, array.length)
    : array;
}

/** Convert byte- or word-scaled color components to logical Float16 values. */
export function convertColorArrayToFloat16(
  values: ArrayLike<number>,
  sourceScale: number
): Float16ArrayStorage {
  const result = createFloat16Array(values.length);
  for (let index = 0; index < values.length; index++) {
    setFloat16Value(result, index, values[index] / sourceScale);
  }
  return result;
}

/** Convert byte- or word-scaled color components to logical Float32 values. */
export function convertColorArrayToFloat32(
  values: ArrayLike<number>,
  sourceScale: number
): Float32Array {
  return Float32Array.from(values, value => value / sourceScale);
}

/** Encode a JavaScript number as an IEEE-754 binary16 bit pattern. */
export function encodeFloat16(value: number): number {
  if (!Number.isFinite(value)) {
    return value === Infinity ? 0x7c00 : value === -Infinity ? 0xfc00 : 0x7e00;
  }

  const sign = value < 0 || Object.is(value, -0) ? 0x8000 : 0;
  const absoluteValue = Math.abs(value);
  if (absoluteValue === 0) {
    return sign;
  }

  if (absoluteValue >= 65504) {
    return sign | 0x7bff;
  }

  const exponent = Math.floor(Math.log2(absoluteValue));
  if (exponent < -14) {
    return sign | Math.round(absoluteValue / 2 ** -24);
  }

  const normalizedExponent = exponent + 15;
  const mantissa = Math.round((absoluteValue / 2 ** exponent - 1) * 1024);
  if (mantissa === 1024) {
    return sign | ((normalizedExponent + 1) << 10);
  }
  return sign | (normalizedExponent << 10) | mantissa;
}

/** Decode an IEEE-754 binary16 bit pattern. */
function decodeFloat16(value: number): number {
  const sign = value & 0x8000 ? -1 : 1;
  const exponent = (value >> 10) & 0x1f;
  const mantissa = value & 0x3ff;
  if (exponent === 0) {
    return sign * mantissa * 2 ** -24;
  }
  if (exponent === 0x1f) {
    return mantissa ? NaN : sign * Infinity;
  }
  return sign * (1 + mantissa / 1024) * 2 ** (exponent - 15);
}
