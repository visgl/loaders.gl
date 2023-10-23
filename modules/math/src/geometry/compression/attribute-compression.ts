// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// Attribute compression and decompression functions.

import {Vector2, Vector3, clamp, _MathUtils} from '@math.gl/core';
import {assert} from '../utils/assert';

type Vector4 = {
  x: number;
  y: number;
  z: number;
  w: number;
};

const RIGHT_SHIFT = 1.0 / 256.0;
const LEFT_SHIFT = 256.0;

const scratchVector2 = new Vector2();
const scratchVector3 = new Vector3();
const scratchEncodeVector2 = new Vector2();
const octEncodeScratch = new Vector2();

const uint8ForceArray = new Uint8Array(1);

/**
 * Force a value to Uint8
 *
 * @param value
 * @returns
 */
function forceUint8(value: number): number {
  uint8ForceArray[0] = value;
  return uint8ForceArray[0];
}

/**
 * Converts a SNORM value in the range [0, rangeMaximum] to a scalar in the range [-1.0, 1.0].
 *
 * @param value SNORM value in the range [0, rangeMaximum]
 * @param [rangeMaximum=255] The maximum value in the SNORM range, 255 by default.
 * @returns Scalar in the range [-1.0, 1.0].
 *
 * @see CesiumMath.toSNorm
 */
function fromSNorm(value: number, rangeMaximum = 255): number {
  return (clamp(value, 0.0, rangeMaximum) / rangeMaximum) * 2.0 - 1.0;
}

/**
 * Converts a scalar value in the range [-1.0, 1.0] to a SNORM in the range [0, rangeMaximum].
 *
 * @param value The scalar value in the range [-1.0, 1.0]
 * @param [rangeMaximum=255] The maximum value in the mapped range, 255 by default.
 * @returns A SNORM value, where 0 maps to -1.0 and rangeMaximum maps to 1.0.
 *
 * @see CesiumMath.fromSNorm
 */
function toSNorm(value: number, rangeMaximum = 255): number {
  return Math.round((clamp(value, -1.0, 1.0) * 0.5 + 0.5) * rangeMaximum);
}

/**
 * Returns 1.0 if the given value is positive or zero, and -1.0 if it is negative.
 * This is similar to `Math.sign` except that returns 1.0 instead of
 * 0.0 when the input value is 0.0.
 *
 * @param value The value to return the sign of.
 * @returns The sign of value.
 */
function signNotZero(value: number): number {
  return value < 0.0 ? -1.0 : 1.0;
}

/**
 * Encodes a normalized vector into 2 SNORM values in the range of [0-rangeMax] following the 'oct' encoding.
 *
 * Oct encoding is a compact representation of unit length vectors.
 * The 'oct' encoding is described in "A Survey of Efficient Representations of Independent Unit Vectors",
 * Cigolle et al 2014: {@link http://jcgt.org/published/0003/02/01/}
 *
 * @param vector The normalized vector to be compressed into 2 component 'oct' encoding.
 * @param result The 2 component oct-encoded unit length vector.
 * @param rangeMax The maximum value of the SNORM range. The encoded vector is stored in log2(rangeMax+1) bits.
 * @returns The 2 component oct-encoded unit length vector.
 *
 * @exception vector must be normalized.
 *
 * @see octDecodeInRange
 */
export function octEncodeInRange(vector: Vector3, rangeMax: number, result: Vector2): Vector2 {
  assert(vector);
  assert(result);

  const vector3 = scratchVector3.from(vector);

  assert(Math.abs(vector3.magnitudeSquared() - 1.0) <= _MathUtils.EPSILON6);

  result.x = vector.x / (Math.abs(vector.x) + Math.abs(vector.y) + Math.abs(vector.z));
  result.y = vector.y / (Math.abs(vector.x) + Math.abs(vector.y) + Math.abs(vector.z));

  if (vector.z < 0) {
    const x = result.x;
    const y = result.y;
    result.x = (1.0 - Math.abs(y)) * signNotZero(x);
    result.y = (1.0 - Math.abs(x)) * signNotZero(y);
  }

  result.x = toSNorm(result.x, rangeMax);
  result.y = toSNorm(result.y, rangeMax);

  return result;
}

/**
 * Encodes a normalized vector into 2 SNORM values in the range of [0-255] following the 'oct' encoding.
 *
 * @param vector The normalized vector to be compressed into 2 byte 'oct' encoding.
 * @param result The 2 byte oct-encoded unit length vector.
 * @returns he 2 byte oct-encoded unit length vector.
 *
 * @exception vector must be normalized.
 *
 * @see octEncodeInRange
 * @see octDecode
 */
export function octEncode(vector: Vector3, result: Vector2): Vector2 {
  return octEncodeInRange(vector, 255, result);
}

/**
 * Encodes a normalized vector into 4-byte vector
 * @param vector The normalized vector to be compressed into 4 byte 'oct' encoding.
 * @param result The 4 byte oct-encoded unit length vector.
 * @returns The 4 byte oct-encoded unit length vector.
 *
 * @exception vector must be normalized.
 *
 * @see octEncodeInRange
 * @see octDecodeFromVector4
 */
export function octEncodeToVector4(vector: Vector3, result: Vector4): Vector4 {
  octEncodeInRange(vector, 65535, octEncodeScratch);
  result.x = forceUint8(octEncodeScratch.x * RIGHT_SHIFT);
  result.y = forceUint8(octEncodeScratch.x);
  result.z = forceUint8(octEncodeScratch.y * RIGHT_SHIFT);
  result.w = forceUint8(octEncodeScratch.y);
  return result;
}

/**
 * Decodes a unit-length vector in 'oct' encoding to a normalized 3-component vector.
 *
 * @param x The x component of the oct-encoded unit length vector.
 * @param y The y component of the oct-encoded unit length vector.
 * @param rangeMax The maximum value of the SNORM range. The encoded vector is stored in log2(rangeMax+1) bits.
 * @param result The decoded and normalized vector
 * @returns The decoded and normalized vector.
 *
 * @exception x and y must be unsigned normalized integers between 0 and rangeMax.
 *
 * @see octEncodeInRange
 */
export function octDecodeInRange(x: number, y: number, rangeMax: number, result: Vector3): Vector3 {
  assert(result);
  if (x < 0 || x > rangeMax || y < 0 || y > rangeMax) {
    throw new Error(`x and y must be unsigned normalized integers between 0 and ${rangeMax}`);
  }

  result.x = fromSNorm(x, rangeMax);
  result.y = fromSNorm(y, rangeMax);
  result.z = 1.0 - (Math.abs(result.x) + Math.abs(result.y));

  if (result.z < 0.0) {
    const oldVX = result.x;
    result.x = (1.0 - Math.abs(result.y)) * signNotZero(oldVX);
    result.y = (1.0 - Math.abs(oldVX)) * signNotZero(result.y);
  }

  return result.normalize();
}

/**
 * Decodes a unit-length vector in 2 byte 'oct' encoding to a normalized 3-component vector.
 *
 * @param x The x component of the oct-encoded unit length vector.
 * @param y The y component of the oct-encoded unit length vector.
 * @param result The decoded and normalized vector.
 * @returns he decoded and normalized vector.
 *
 * @exception x and y must be an unsigned normalized integer between 0 and 255.
 *
 * @see octDecodeInRange
 */
export function octDecode(x: number, y: number, result: Vector3): Vector3 {
  return octDecodeInRange(x, y, 255, result);
}

/**
 * Decodes a unit-length vector in 4 byte 'oct' encoding to a normalized 3-component vector.
 *
 * @param encoded The oct-encoded unit length vector.
 * @param esult The decoded and normalized vector.
 * @returns The decoded and normalized vector.
 *
 * @exception x, y, z, and w must be unsigned normalized integers between 0 and 255.
 *
 * @see octDecodeInRange
 * @see octEncodeToVector4
 */
export function octDecodeFromVector4(encoded: Vector4, result: Vector3): Vector3 {
  assert(encoded);
  assert(result);
  const x = encoded.x;
  const y = encoded.y;
  const z = encoded.z;
  const w = encoded.w;

  if (x < 0 || x > 255 || y < 0 || y > 255 || z < 0 || z > 255 || w < 0 || w > 255) {
    throw new Error('x, y, z, and w must be unsigned normalized integers between 0 and 255');
  }

  const xOct16 = x * LEFT_SHIFT + y;
  const yOct16 = z * LEFT_SHIFT + w;
  return octDecodeInRange(xOct16, yOct16, 65535, result);
}

/**
 * Packs an oct encoded vector into a single floating-point number.
 *
 * @param encoded The oct encoded vector.
 * @returns The oct encoded vector packed into a single float.
 *
 */
export function octPackFloat(encoded: Vector2): number {
  const vector2 = scratchVector2.from(encoded);
  return 256.0 * vector2.x + vector2.y;
}

/**
 * Encodes a normalized vector into 2 SNORM values in the range of [0-255] following the 'oct' encoding and
 * stores those values in a single float-point number.
 *
 * @param vector The normalized vector to be compressed into 2 byte 'oct' encoding.
 * @returns The 2 byte oct-encoded unit length vector.
 *
 * @exception vector must be normalized.
 */
export function octEncodeFloat(vector: Vector3): number {
  octEncode(vector, scratchEncodeVector2);
  return octPackFloat(scratchEncodeVector2);
}

/**
 * Decodes a unit-length vector in 'oct' encoding packed in a floating-point number to a normalized 3-component vector.
 *
 * @param value The oct-encoded unit length vector stored as a single floating-point number.
 * @param result The decoded and normalized vector
 * @returns The decoded and normalized vector.
 *
 */
export function octDecodeFloat(value: number, result: Vector3): Vector3 {
  assert(Number.isFinite(value));

  const temp = value / 256.0;
  const x = Math.floor(temp);
  const y = (temp - x) * 256.0;

  return octDecode(x, y, result);
}

/**
 * Encodes three normalized vectors into 6 SNORM values in the range of [0-255] following the 'oct' encoding and
 * packs those into two floating-point numbers.
 *
 * @param v1 A normalized vector to be compressed.
 * @param v2 A normalized vector to be compressed.
 * @param v3 A normalized vector to be compressed.
 * @param result The 'oct' encoded vectors packed into two floating-point numbers.
 * @returns The 'oct' encoded vectors packed into two floating-point numbers.
 *
 */
export function octPack(v1: Vector3, v2: Vector3, v3: Vector3, result: Vector2): Vector2 {
  assert(v1);
  assert(v2);
  assert(v3);
  assert(result);

  const encoded1 = octEncodeFloat(v1);
  const encoded2 = octEncodeFloat(v2);

  const encoded3 = octEncode(v3, scratchEncodeVector2);
  result.x = 65536.0 * encoded3.x + encoded1;
  result.y = 65536.0 * encoded3.y + encoded2;
  return result;
}

/**
 * Decodes three unit-length vectors in 'oct' encoding packed into a floating-point number to a normalized 3-component vector.
 *
 * @param packed The three oct-encoded unit length vectors stored as two floating-point number.
 * @param v1 One decoded and normalized vector.
 * @param v2 One decoded and normalized vector.
 * @param v3 One decoded and normalized vector.
 */
export function octUnpack(packed: Vector2, v1: Vector3, v2: Vector3, v3: Vector3): void {
  let temp = packed.x / 65536.0;
  const x = Math.floor(temp);
  const encodedFloat1 = (temp - x) * 65536.0;

  temp = packed.y / 65536.0;
  const y = Math.floor(temp);
  const encodedFloat2 = (temp - y) * 65536.0;

  octDecodeFloat(encodedFloat1, v1);
  octDecodeFloat(encodedFloat2, v2);
  octDecode(x, y, v3);
}

/**
 * Pack texture coordinates into a single float. The texture coordinates will only preserve 12 bits of precision.
 *
 * @param textureCoordinates The texture coordinates to compress.  Both coordinates must be in the range 0.0-1.0.
 * @returns The packed texture coordinates.
 *
 */
export function compressTextureCoordinates(textureCoordinates: Vector2): number {
  // Move x and y to the range 0-4095;
  const x = (textureCoordinates.x * 4095.0) | 0;
  const y = (textureCoordinates.y * 4095.0) | 0;
  return 4096.0 * x + y;
}

/**
 * Decompresses texture coordinates that were packed into a single float.
 *
 * @param compressed The compressed texture coordinates.
 * @param result The decompressed texture coordinates.
 * @returns The modified result parameter.
 *
 */
export function decompressTextureCoordinates(compressed: number, result: Vector2): Vector2 {
  const temp = compressed / 4096.0;
  const xZeroTo4095 = Math.floor(temp);
  result.x = xZeroTo4095 / 4095.0;
  result.y = (compressed - xZeroTo4095 * 4096) / 4095;
  return result;
}

/**
 * Decodes delta and ZigZag encoded vertices. This modifies the buffers in place.
 *
 * @param uBuffer The buffer view of u values.
 * @param vBuffer The buffer view of v values.
 * @param [heightBuffer] The buffer view of height values.
 *
 * @link https://github.com/AnalyticalGraphicsInc/quantized-mesh|quantized-mesh-1.0 terrain format
 */
export function zigZagDeltaDecode(
  uBuffer: Uint16Array,
  vBuffer: Uint16Array,
  heightBuffer?: Uint16Array | number[]
) {
  assert(uBuffer);
  assert(vBuffer);
  assert(uBuffer.length === vBuffer.length);
  if (heightBuffer) {
    assert(uBuffer.length === heightBuffer.length);
  }

  function zigZagDecode(value: number) {
    return (value >> 1) ^ -(value & 1);
  }

  let u = 0;
  let v = 0;
  let height = 0;

  for (let i = 0; i < uBuffer.length; ++i) {
    u += zigZagDecode(uBuffer[i]);
    v += zigZagDecode(vBuffer[i]);

    uBuffer[i] = u;
    vBuffer[i] = v;

    if (heightBuffer) {
      height += zigZagDecode(heightBuffer[i]);
      heightBuffer[i] = height;
    }
  }
}
