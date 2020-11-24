// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// Attribute compression and decompression functions.

/** @typedef {import('@math.gl/core')} mathgl_core */
import {Vector2, Vector3, clamp, _MathUtils} from '@math.gl/core';
import assert from '../utils/assert';

const RIGHT_SHIFT = 1.0 / 256.0;
const LEFT_SHIFT = 256.0;

const scratchVector2 = new Vector2();
const scratchVector3 = new Vector3();
const scratchEncodeVector2 = new Vector2();
const octEncodeScratch = new Vector2();

const uint8ForceArray = new Uint8Array(1);

// Force a value to Uint8
function forceUint8(value) {
  uint8ForceArray[0] = value;
  return uint8ForceArray[0];
}

/**
 * Converts a SNORM value in the range [0, rangeMaximum] to a scalar in the range [-1.0, 1.0].
 * @param {Number} value SNORM value in the range [0, rangeMaximum]
 * @param {Number} [rangeMaximum=255] The maximum value in the SNORM range, 255 by default.
 * @returns {Number} Scalar in the range [-1.0, 1.0].
 *
 * @see CesiumMath.toSNorm
 */
function fromSNorm(value, rangeMaximum = 255) {
  return (clamp(value, 0.0, rangeMaximum) / rangeMaximum) * 2.0 - 1.0;
}

/**
 * Converts a scalar value in the range [-1.0, 1.0] to a SNORM in the range [0, rangeMaximum]
 * @param {Number} value The scalar value in the range [-1.0, 1.0]
 * @param {Number} [rangeMaximum=255] The maximum value in the mapped range, 255 by default.
 * @returns {Number} A SNORM value, where 0 maps to -1.0 and rangeMaximum maps to 1.0.
 *
 * @see CesiumMath.fromSNorm
 */
function toSNorm(value, rangeMaximum = 255) {
  return Math.round((clamp(value, -1.0, 1.0) * 0.5 + 0.5) * rangeMaximum);
}

/**
 * Returns 1.0 if the given value is positive or zero, and -1.0 if it is negative.
 * This is similar to `Math.sign` except that returns 1.0 instead of
 * 0.0 when the input value is 0.0.
 * @param {Number} value The value to return the sign of.
 * @returns {Number} The sign of value.
 */
function signNotZero(value) {
  return value < 0.0 ? -1.0 : 1.0;
}

/**
 * Encodes a normalized vector into 2 SNORM values in the range of [0-rangeMax] following the 'oct' encoding.
 *
 * Oct encoding is a compact representation of unit length vectors.
 * The 'oct' encoding is described in "A Survey of Efficient Representations of Independent Unit Vectors",
 * Cigolle et al 2014: {@link http://jcgt.org/published/0003/02/01/}
 *
 * @param {Vector3} vector The normalized vector to be compressed into 2 component 'oct' encoding.
 * @param {Vector2} result The 2 component oct-encoded unit length vector.
 * @param {Number} rangeMax The maximum value of the SNORM range. The encoded vector is stored in log2(rangeMax+1) bits.
 * @returns {Vector2} The 2 component oct-encoded unit length vector.
 *
 * @exception {Error} vector must be normalized.
 *
 * @see octDecodeInRange
 */
export function octEncodeInRange(vector, rangeMax, result) {
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
 * @param {Vector3} vector The normalized vector to be compressed into 2 byte 'oct' encoding.
 * @param {Vector2} result The 2 byte oct-encoded unit length vector.
 * @returns {Vector2} The 2 byte oct-encoded unit length vector.
 *
 * @exception {Error} vector must be normalized.
 *
 * @see octEncodeInRange
 * @see octDecode
 */
export function octEncode(vector, result) {
  return octEncodeInRange(vector, 255, result);
}

/**
 * @param {Vector3} vector The normalized vector to be compressed into 4 byte 'oct' encoding.
 * @param {mathgl_core['Vector4']} result The 4 byte oct-encoded unit length vector.
 * @returns {mathgl_core['Vector4']} The 4 byte oct-encoded unit length vector.
 *
 * @exception {Error} vector must be normalized.
 *
 * @see octEncodeInRange
 * @see octDecodeFromVector4
 */
export function octEncodeToVector4(vector, result) {
  octEncodeInRange(vector, 65535, octEncodeScratch);
  // @ts-ignore
  result.x = forceUint8(octEncodeScratch.x * RIGHT_SHIFT);
  // @ts-ignore
  result.y = forceUint8(octEncodeScratch.x);
  // @ts-ignore
  result.z = forceUint8(octEncodeScratch.y * RIGHT_SHIFT);
  // @ts-ignore
  result.w = forceUint8(octEncodeScratch.y);
  return result;
}

/**
 * Decodes a unit-length vector in 'oct' encoding to a normalized 3-component vector.
 *
 * @param {Number} x The x component of the oct-encoded unit length vector.
 * @param {Number} y The y component of the oct-encoded unit length vector.
 * @param {Number} rangeMax The maximum value of the SNORM range. The encoded vector is stored in log2(rangeMax+1) bits.
 * @param {Vector3} result The decoded and normalized vector
 * @returns {Vector3} The decoded and normalized vector.
 *
 * @exception {Error} x and y must be unsigned normalized integers between 0 and rangeMax.
 *
 * @see octEncodeInRange
 */
export function octDecodeInRange(x, y, rangeMax, result) {
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
 * @param {Number} x The x component of the oct-encoded unit length vector.
 * @param {Number} y The y component of the oct-encoded unit length vector.
 * @param {Vector3} result The decoded and normalized vector.
 * @returns {Vector3} The decoded and normalized vector.
 *
 * @exception {Error} x and y must be an unsigned normalized integer between 0 and 255.
 *
 * @see octDecodeInRange
 */
export function octDecode(x, y, result) {
  return octDecodeInRange(x, y, 255, result);
}

/**
 * Decodes a unit-length vector in 4 byte 'oct' encoding to a normalized 3-component vector.
 *
 * @param {mathgl_core['Vector4']} encoded The oct-encoded unit length vector.
 * @param {Vector3} result The decoded and normalized vector.
 * @returns {Vector3} The decoded and normalized vector.
 *
 * @exception {Error} x, y, z, and w must be unsigned normalized integers between 0 and 255.
 *
 * @see octDecodeInRange
 * @see octEncodeToVector4
 */
export function octDecodeFromVector4(encoded, result) {
  assert(encoded);
  assert(result);
  // @ts-ignore
  const x = encoded.x;
  // @ts-ignore
  const y = encoded.y;
  // @ts-ignore
  const z = encoded.z;
  // @ts-ignore
  const w = encoded.w;
  // @ts-ignore
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
 * @param {Vector2} encoded The oct encoded vector.
 * @returns {Number} The oct encoded vector packed into a single float.
 *
 */
export function octPackFloat(encoded) {
  const vector2 = scratchVector2.from(encoded);
  return 256.0 * vector2.x + vector2.y;
}

/**
 * Encodes a normalized vector into 2 SNORM values in the range of [0-255] following the 'oct' encoding and
 * stores those values in a single float-point number.
 *
 * @param {Vector3} vector The normalized vector to be compressed into 2 byte 'oct' encoding.
 * @returns {Number} The 2 byte oct-encoded unit length vector.
 *
 * @exception {Error} vector must be normalized.
 */
export function octEncodeFloat(vector) {
  octEncode(vector, scratchEncodeVector2);
  return octPackFloat(scratchEncodeVector2);
}

/**
 * Decodes a unit-length vector in 'oct' encoding packed in a floating-point number to a normalized 3-component vector.
 *
 * @param {Number} value The oct-encoded unit length vector stored as a single floating-point number.
 * @param {Vector3} result The decoded and normalized vector
 * @returns {Vector3} The decoded and normalized vector.
 *
 */
export function octDecodeFloat(value, result) {
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
 * @param {Vector3} v1 A normalized vector to be compressed.
 * @param {Vector3} v2 A normalized vector to be compressed.
 * @param {Vector3} v3 A normalized vector to be compressed.
 * @param {Vector2} result The 'oct' encoded vectors packed into two floating-point numbers.
 * @returns {Vector2} The 'oct' encoded vectors packed into two floating-point numbers.
 *
 */
export function octPack(v1, v2, v3, result) {
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
 * @param {Vector2} packed The three oct-encoded unit length vectors stored as two floating-point number.
 * @param {Vector3} v1 One decoded and normalized vector.
 * @param {Vector3} v2 One decoded and normalized vector.
 * @param {Vector3} v3 One decoded and normalized vector.
 */
export function octUnpack(packed, v1, v2, v3) {
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
 * @param {Vector2} textureCoordinates The texture coordinates to compress.  Both coordinates must be in the range 0.0-1.0.
 * @returns {Number} The packed texture coordinates.
 *
 */
export function compressTextureCoordinates(textureCoordinates) {
  // Move x and y to the range 0-4095;
  const x = (textureCoordinates.x * 4095.0) | 0;
  const y = (textureCoordinates.y * 4095.0) | 0;
  return 4096.0 * x + y;
}

/**
 * Decompresses texture coordinates that were packed into a single float.
 *
 * @param {Number} compressed The compressed texture coordinates.
 * @param {Vector2} result The decompressed texture coordinates.
 * @returns {Vector2} The modified result parameter.
 *
 */
export function decompressTextureCoordinates(compressed, result) {
  const temp = compressed / 4096.0;
  const xZeroTo4095 = Math.floor(temp);
  result.x = xZeroTo4095 / 4095.0;
  result.y = (compressed - xZeroTo4095 * 4096) / 4095;
  return result;
}

/**
 * Decodes delta and ZigZag encoded vertices. This modifies the buffers in place.
 *
 * @param {Uint16Array} uBuffer The buffer view of u values.
 * @param {Uint16Array} vBuffer The buffer view of v values.
 * @param {Uint16Array} [heightBuffer] The buffer view of height values.
 *
 * @see {@link https://github.com/AnalyticalGraphicsInc/quantized-mesh|quantized-mesh-1.0 terrain format}
 */
export function zigZagDeltaDecode(uBuffer, vBuffer, heightBuffer) {
  assert(uBuffer);
  assert(vBuffer);
  assert(uBuffer.length === vBuffer.length);
  if (heightBuffer) {
    assert(uBuffer.length === heightBuffer.length);
  }

  function zigZagDecode(value) {
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
