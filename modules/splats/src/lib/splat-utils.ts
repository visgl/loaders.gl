// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const SH_C0 = 0.28209479177387814;

/** Converts a normalized RGB value to a spherical harmonic DC coefficient. */
export function convertColorByteToSphericalHarmonicDc(colorByte: number): number {
  return (colorByte / 255 - 0.5) / SH_C0;
}

/** Converts an unorm8 alpha byte to linear opacity. */
export function convertAlphaByteToLinearOpacity(alphaByte: number): number {
  return Math.min(Math.max(alphaByte / 255, 0), 1);
}

/** Returns a normalized quaternion, falling back to identity when invalid. */
export function normalizeQuaternion(
  w: number,
  x: number,
  y: number,
  z: number
): [number, number, number, number] {
  const length = Math.hypot(w, x, y, z);
  if (!Number.isFinite(length) || length <= Number.EPSILON) {
    return [1, 0, 0, 0];
  }
  return [w / length, x / length, y / length, z / length];
}

/** Decodes the GaussianSplats3D uint8 quaternion component encoding. */
export function decodeQuaternionByte(byte: number): number {
  return (byte - 128) / 128;
}

/** Decodes an IEEE 754 binary16 value. */
export function decodeFloat16(value: number): number {
  const sign = value & 0x8000 ? -1 : 1;
  const exponent = (value >> 10) & 0x1f;
  const fraction = value & 0x03ff;

  if (exponent === 0) {
    return sign * Math.pow(2, -14) * (fraction / 1024);
  }
  if (exponent === 0x1f) {
    return fraction ? Number.NaN : sign * Number.POSITIVE_INFINITY;
  }
  return sign * Math.pow(2, exponent - 15) * (1 + fraction / 1024);
}
