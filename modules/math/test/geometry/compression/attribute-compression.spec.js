/* eslint-disable max-statements */
import {it, expect} from 'test/utils/expect-assertions';
import {Vector2, Vector3, Vector4, _MathUtils} from '@math.gl/core';
import {
  octEncodeInRange,
  octEncode,
  octEncodeToVector4,
  octDecodeInRange,
  octDecode,
  octDecodeFromVector4,
  octPackFloat,
  octEncodeFloat,
  octDecodeFloat,
  octPack,
  octUnpack,
  compressTextureCoordinates,
  decompressTextureCoordinates,
  zigZagDeltaDecode
} from '@loaders.gl/math';

const negativeUnitZ = new Vector3(0.0, 0.0, -1.0);

const VECTOR3_UNIT_X = new Vector3(1, 0, 0);
const VECTOR3_UNIT_Y = new Vector3(0, 1, 0);
const VECTOR3_UNIT_Z = new Vector3(0, 0, 1);

it('oct decode(0, 0)', () => {
  const result = new Vector3();
  octDecode(0, 0, result);
  expect(result).toEqual(negativeUnitZ);
});

it('oct encode(0, 0, -1)', () => {
  const result = new Vector2();
  octEncode(negativeUnitZ, result);
  expect(result).toEqual(new Vector2(255, 255));
});

it('oct encode(0, 0, 1)', () => {
  const result = new Vector2();
  octEncode(VECTOR3_UNIT_Z, result);
  expect(result).toEqual(new Vector2(128, 128));
});

it('oct encode(0, 0, -1) to 4 components', () => {
  const result = new Vector4();
  // @ts-ignore
  octEncodeToVector4(negativeUnitZ, result);
  expect(result).toEqual(new Vector4(255, 255, 255, 255));
});

it('oct encode(0, 0, 1) to 4 components', () => {
  const result = new Vector4();
  // @ts-ignore
  octEncodeToVector4(VECTOR3_UNIT_Z, result);
  expect(result).toEqual(new Vector4(128, 0, 128, 0));
});

it('oct extents are equal', () => {
  const result = new Vector3();
  // lower left
  octDecode(0, 0, result);
  expect(result).toEqual(negativeUnitZ);
  // lower right
  octDecode(255, 0, result);
  expect(result).toEqual(negativeUnitZ);
  // upper right
  octDecode(255, 255, result);
  expect(result).toEqual(negativeUnitZ);
  // upper left
  octDecode(255, 0, result);
  expect(result).toEqual(negativeUnitZ);
});

it('throws oct encode vector undefined', () => {
  const vector = undefined;
  const result = new Vector3();
  // @ts-ignore
  expect(() => octEncode(vector, result)).toThrow();
});

it('throws oct encode result undefined', () => {
  const result = undefined;
  expect(() => octEncode(VECTOR3_UNIT_Z, result)).toThrow();
});

it('throws oct encode non unit vector', () => {
  const nonUnitLengthVector = new Vector3(2.0, 0.0, 0.0);
  const result = new Vector2();
  expect(() => octEncode(nonUnitLengthVector, result)).toThrow();
});

it('throws oct encode zero length vector', () => {
  const result = new Vector2();
  expect(() => octEncode(Vector3.ZERO, result)).toThrow();
});

it('throws oct decode result undefined', () => {
  const result = undefined;
  expect(() => octDecode(0, 0, result)).toThrow();
});

it('throws oct decode x out of bounds', () => {
  const result = new Vector3();
  expect(() => octDecode(256, 0, result)).toThrow();
});

it('throws oct decode y out of bounds', () => {
  const result = new Vector3();
  expect(() => octDecode(0, 256, result)).toThrow();
});

it('throws 4-component oct decode out of bounds', () => {
  const result = new Vector3();
  // @ts-ignore
  expect(() => octDecodeFromVector4(new Vector4(256, 0, 0, 0), result)).toThrow();

  // @ts-ignore
  expect(() => octDecodeFromVector4(new Vector4(0, 256, 0, 0), result)).toThrow();

  // @ts-ignore
  expect(() => octDecodeFromVector4(new Vector4(0, 0, 256, 0), result)).toThrow();

  // @ts-ignore
  expect(() => octDecodeFromVector4(new Vector4(0, 0, 0, 256), result)).toThrow();
});

it('oct encoding', () => {
  const epsilon = _MathUtils.EPSILON1;

  const encoded = new Vector2();
  const result = new Vector3();
  let normal = new Vector3(0.0, 0.0, 1.0);
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, 0.0, -1.0);
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, 1.0, 0.0);
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, -1.0, 0.0);
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 0.0, 0.0);
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 0.0, 0.0);
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 1.0, 1.0);
  normal.normalize();
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, -1.0, 1.0);
  normal.normalize();
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, -1.0, 1.0);
  normal.normalize();
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 1.0, 1.0);
  normal.normalize();
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 1.0, -1.0);
  normal.normalize();
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, -1.0, -1.0);
  normal.normalize();
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 1.0, -1.0);
  normal.normalize();
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, -1.0, -1.0);
  normal.normalize();
  octEncode(normal, encoded);
  expect(octDecode(encoded.x, encoded.y, result)).toEqualEpsilon(normal, epsilon);
});

it('oct encoding high precision', () => {
  const rangeMax = 4294967295;
  const epsilon = _MathUtils.EPSILON8;

  const encoded = new Vector2();
  const result = new Vector3();
  let normal = new Vector3(0.0, 0.0, 1.0);
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, 0.0, -1.0);
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, 1.0, 0.0);
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, -1.0, 0.0);
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 0.0, 0.0);
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 0.0, 0.0);
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 1.0, 1.0);
  normal.normalize();
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, -1.0, 1.0);
  normal.normalize();
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, -1.0, 1.0);
  normal.normalize();
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 1.0, 1.0);
  normal.normalize();
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 1.0, -1.0);
  normal.normalize();
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, -1.0, -1.0);
  normal.normalize();
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 1.0, -1.0);
  normal.normalize();
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, -1.0, -1.0);
  normal.normalize();
  octEncodeInRange(normal, rangeMax, encoded);
  expect(octDecodeInRange(encoded.x, encoded.y, rangeMax, result)).toEqualEpsilon(normal, epsilon);
});

it('oct encoding to 4 components', () => {
  const epsilon = _MathUtils.EPSILON1;

  const encoded = new Vector4();
  const result = new Vector3();
  let normal = new Vector3(0.0, 0.0, 1.0);
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, 0.0, -1.0);
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, 1.0, 0.0);
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, -1.0, 0.0);
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 0.0, 0.0);
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 0.0, 0.0);
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 1.0, 1.0);
  normal.normalize();
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, -1.0, 1.0);
  normal.normalize();
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, -1.0, 1.0);
  normal.normalize();
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 1.0, 1.0);
  normal.normalize();
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 1.0, -1.0);
  normal.normalize();
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, -1.0, -1.0);
  normal.normalize();
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 1.0, -1.0);
  normal.normalize();
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, -1.0, -1.0);
  normal.normalize();
  // @ts-ignore
  octEncodeToVector4(normal, encoded);
  // @ts-ignore
  expect(octDecodeFromVector4(encoded, result)).toEqualEpsilon(normal, epsilon);
});

it('octFloat encoding', () => {
  const epsilon = _MathUtils.EPSILON1;

  const result = new Vector3();
  let normal = new Vector3(0.0, 0.0, 1.0);
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, 0.0, -1.0);
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, 1.0, 0.0);
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(0.0, -1.0, 0.0);
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 0.0, 0.0);
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 0.0, 0.0);
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 1.0, 1.0);
  normal.normalize();
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, -1.0, 1.0);
  normal.normalize();
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, -1.0, 1.0);
  normal.normalize();
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 1.0, 1.0);
  normal.normalize();
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, 1.0, -1.0);
  normal.normalize();
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(1.0, -1.0, -1.0);
  normal.normalize();
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, 1.0, -1.0);
  normal.normalize();
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);

  normal = new Vector3(-1.0, -1.0, -1.0);
  normal.normalize();
  expect(octDecodeFloat(octEncodeFloat(normal), result)).toEqualEpsilon(normal, epsilon);
});

it('octFloat encoding is equivalent to oct encoding', () => {
  const encoded = new Vector2();
  const result1 = new Vector3();
  const result2 = new Vector3();

  let normal = new Vector3(0.0, 0.0, 1.0);
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(0.0, 0.0, -1.0);
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(0.0, 1.0, 0.0);
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(0.0, -1.0, 0.0);
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(1.0, 0.0, 0.0);
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(-1.0, 0.0, 0.0);
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(1.0, 1.0, 1.0);
  normal.normalize();
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(1.0, -1.0, 1.0);
  normal.normalize();
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(-1.0, -1.0, 1.0);
  normal.normalize();
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(-1.0, 1.0, 1.0);
  normal.normalize();
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(1.0, 1.0, -1.0);
  normal.normalize();
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(1.0, -1.0, -1.0);
  normal.normalize();
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(-1.0, 1.0, -1.0);
  normal.normalize();
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);

  normal = new Vector3(-1.0, -1.0, -1.0);
  normal.normalize();
  octEncode(normal, encoded);
  octDecode(encoded.x, encoded.y, result1);
  octDecodeFloat(octEncodeFloat(normal), result2);
  expect(result1).toEqual(result2);
});

it('encodeFloat throws without vector', () => {
  // @ts-ignore
  expect(() => octEncodeFloat(undefined)).toThrow();
});

it('decodeFloat throws without value', () => {
  // @ts-ignore
  expect(() => octDecodeFloat(undefined, new Vector3())).toThrow();
});

it('decodeFloat throws without result', () => {
  // @ts-ignore
  expect(() => octDecodeFloat(0.0, undefined)).toThrow();
});

it('encode and packFloat is equivalent to oct encoding', () => {
  const vector = new Vector3(1.0, 1.0, 1.0);
  vector.normalize();

  const encoded = octEncode(vector, new Vector2());
  const encodedFloat = octPackFloat(encoded);
  expect(octDecodeFloat(encodedFloat, new Vector3())).toEqual(
    octDecode(encoded.x, encoded.y, new Vector3())
  );
});

it('packFloat throws without encoded', () => {
  // @ts-ignore
  expect(() => octPackFloat(undefined)).toThrow();
});

it('pack is equivalent to oct encoding', () => {
  const x = VECTOR3_UNIT_X;
  const y = VECTOR3_UNIT_Y;
  const z = VECTOR3_UNIT_Z;

  const packed = octPack(x, y, z, new Vector2());
  const decodedX = new Vector3();
  const decodedY = new Vector3();
  const decodedZ = new Vector3();
  octUnpack(packed, decodedX, decodedY, decodedZ);

  expect(decodedX).toEqual(octDecodeFloat(octEncodeFloat(x), new Vector3()));
  expect(decodedY).toEqual(octDecodeFloat(octEncodeFloat(y), new Vector3()));
  expect(decodedZ).toEqual(octDecodeFloat(octEncodeFloat(z), new Vector3()));
});

it('pack throws without v1', () => {
  // @ts-ignore
  expect(() => octPack(undefined, new Vector3(), new Vector3(), new Vector2())).toThrow();
});

it('pack throws without v2', () => {
  // @ts-ignore
  expect(() => octPack(new Vector3(), undefined, new Vector3(), new Vector2())).toThrow();
});

it('pack throws without v3', () => {
  // @ts-ignore
  expect(() => octPack(new Vector3(), new Vector3(), undefined, new Vector2())).toThrow();
});

it('pack throws without result', () => {
  // @ts-ignore
  expect(() => octPack(new Vector3(), new Vector3(), new Vector3(), undefined)).toThrow();
});

it('unpack throws without packed', () => {
  // @ts-ignore
  expect(() => octUnpack(undefined, new Vector3(), new Vector3(), new Vector3())).toThrow();
});

it('unpack throws without v1', () => {
  // @ts-ignore
  expect(() => octUnpack(new Vector2(), undefined, new Vector3(), new Vector3())).toThrow();
});

it('unpack throws without v2', () => {
  // @ts-ignore
  expect(() => octUnpack(new Vector2(), new Vector3(), undefined, new Vector3())).toThrow();
});

it('unpack throws without v3', () => {
  // @ts-ignore
  expect(() => octUnpack(new Vector2(), new Vector3(), new Vector3(), undefined)).toThrow();
});

it('compresses texture coordinates', () => {
  const coords = new Vector2(0.5, 0.5);
  expect(
    decompressTextureCoordinates(compressTextureCoordinates(coords), new Vector2())
  ).toEqualEpsilon(coords, 1.0 / 4096.0);
});

it('compress texture coordinates throws without texture coordinates', () => {
  // @ts-ignore
  expect(() => compressTextureCoordinates(undefined)).toThrow();
});

it('decompress texture coordinates throws without encoded texture coordinates', () => {
  // @ts-ignore
  expect(() => decompressTextureCoordinates(undefined, new Vector2())).toThrow();
});

it('decompress texture coordinates throws without result', () => {
  // @ts-ignore
  expect(() => decompressTextureCoordinates(0.0, undefined)).toThrow();
});

it('compresses/decompresses 1.0', () => {
  const coords = new Vector2(1.0, 1.0);
  expect(decompressTextureCoordinates(compressTextureCoordinates(coords), new Vector2())).toEqual(
    coords
  );
});

it('compresses/decompresses 0.0', () => {
  const coords = new Vector2(1.0, 1.0);
  expect(decompressTextureCoordinates(compressTextureCoordinates(coords), new Vector2())).toEqual(
    coords
  );
});

it('compresses/decompresses 0.5 / 1.0', () => {
  const coords = new Vector2(0.5, 1.0);
  expect(
    decompressTextureCoordinates(compressTextureCoordinates(coords), new Vector2())
  ).toEqualEpsilon(coords, 1.0 / 4095.0);
});

it('compresses/decompresses 1.0 / 0.5', () => {
  const coords = new Vector2(1.0, 0.5);
  expect(
    decompressTextureCoordinates(compressTextureCoordinates(coords), new Vector2())
  ).toEqualEpsilon(coords, 1.0 / 4095.0);
});

it('compresses/decompresses values very close but not equal to 1.0', () => {
  const coords = new Vector2(0.99999999999999, 0.99999999999999);
  expect(
    decompressTextureCoordinates(compressTextureCoordinates(coords), new Vector2())
  ).toEqualEpsilon(coords, 1.0 / 4095.0);
});

function zigZag(value) {
  return ((value << 1) ^ (value >> 15)) & 0xffff;
}

const maxShort = 32767;

function deltaZigZagEncode(uBuffer, vBuffer, heightBuffer) {
  const length = uBuffer.length;
  const buffer = new Uint16Array(length * (heightBuffer ? 3 : 2));

  let lastU = 0;
  let lastV = 0;
  let lastHeight = 0;

  for (let i = 0; i < length; ++i) {
    const u = uBuffer[i];
    const v = vBuffer[i];

    buffer[i] = zigZag(u - lastU);
    buffer[i + length] = zigZag(v - lastV);

    lastU = u;
    lastV = v;

    if (heightBuffer) {
      const height = heightBuffer[i];

      buffer[i + length * 2] = zigZag(height - lastHeight);

      lastHeight = height;
    }
  }

  return buffer;
}

it('decodes delta and ZigZag encoded vertices without height', () => {
  const length = 10;
  const decodedUBuffer = new Array(length);
  const decodedVBuffer = new Array(length);
  for (let i = 0; i < length; ++i) {
    decodedUBuffer[i] = Math.floor(Math.random() * maxShort);
    decodedVBuffer[i] = Math.floor(Math.random() * maxShort);
  }

  const encoded = deltaZigZagEncode(decodedUBuffer, decodedVBuffer);
  const uBuffer = new Uint16Array(encoded.buffer, 0, length);
  const vBuffer = new Uint16Array(encoded.buffer, length * Uint16Array.BYTES_PER_ELEMENT, length);

  zigZagDeltaDecode(uBuffer, vBuffer);

  expect(uBuffer).toEqual(decodedUBuffer);
  expect(vBuffer).toEqual(decodedVBuffer);
});

it('decodes delta and ZigZag encoded vertices with height', () => {
  const length = 10;
  const decodedUBuffer = new Array(length);
  const decodedVBuffer = new Array(length);
  const decodedHeightBuffer = new Array(length);
  for (let i = 0; i < length; ++i) {
    decodedUBuffer[i] = Math.floor(Math.random() * maxShort);
    decodedVBuffer[i] = Math.floor(Math.random() * maxShort);
    decodedHeightBuffer[i] = Math.floor(Math.random() * maxShort);
  }

  const encoded = deltaZigZagEncode(decodedUBuffer, decodedVBuffer, decodedHeightBuffer);
  const uBuffer = new Uint16Array(encoded.buffer, 0, length);
  const vBuffer = new Uint16Array(encoded.buffer, length * Uint16Array.BYTES_PER_ELEMENT, length);
  const heightBuffer = new Uint16Array(
    encoded.buffer,
    2 * length * Uint16Array.BYTES_PER_ELEMENT,
    length
  );

  zigZagDeltaDecode(uBuffer, vBuffer, heightBuffer);

  expect(uBuffer).toEqual(decodedUBuffer);
  expect(vBuffer).toEqual(decodedVBuffer);
  expect(heightBuffer).toEqual(decodedHeightBuffer);
});

it('throws when zigZagDeltaDecode has an undefined uBuffer', () => {
  // @ts-ignore
  expect(() => zigZagDeltaDecode(undefined, new Uint16Array(10))).toThrow();
});

it('throws when zigZagDeltaDecode has an undefined vBuffer', () => {
  // @ts-ignore
  expect(() => zigZagDeltaDecode(new Uint16Array(10), undefined)).toThrow();
});

it('throws when zigZagDeltaDecode has unequal uBuffer and vBuffer length', () => {
  expect(() => zigZagDeltaDecode(new Uint16Array(10), new Uint16Array(11))).toThrow();
});

it('throws when zigZagDeltaDecode has unequal uBuffer, vBuffer, and heightBuffer length', () => {
  expect(() =>
    zigZagDeltaDecode(new Uint16Array(10), new Uint16Array(10), new Uint16Array(11))
  ).toThrow();
});
