// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Bounded parsing of HDF5 simple dataspaces, primitive types and contiguous layouts. */
export type HDF5Primitive = {
  kind: 'integer' | 'float';
  size: number;
  littleEndian: boolean;
  signed: boolean;
};
export type HDF5Dataspace = {shape: number[]; elementCount: number};
export type HDF5ContiguousLayout = {address: bigint; byteLength: number};
function fail(message: string): never {
  throw new Error('HDF5: ' + message);
}
function requireLength(bytes: Uint8Array, count: number): void {
  if (bytes.length < count) fail('truncated metadata message');
}
export function readHDF5Unsigned(bytes: Uint8Array, offset: number, size: number): bigint {
  if (offset < 0 || size < 1 || size > 8 || offset + size > bytes.length) fail('truncated integer');
  let value = 0n;
  for (let i = size - 1; i >= 0; i--) value = value * 256n + BigInt(bytes[offset + i]);
  return value;
}
function safe(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) fail('integer exceeds JS safe range');
  return Number(value);
}
export function parseHDF5Dataspace(bytes: Uint8Array, lengthSize: number): HDF5Dataspace {
  requireLength(bytes, 4);
  const version = bytes[0];
  if (version !== 1 && version !== 2) fail('unsupported dataspace version');
  const rank = bytes[1],
    flags = bytes[2];
  if (rank > 32) fail('unsupported dataspace rank');
  const start = version === 1 ? 8 : 4;
  if (version === 1) requireLength(bytes, 8);
  const shape: number[] = [];
  for (let i = 0; i < rank; i++) {
    shape.push(safe(readHDF5Unsigned(bytes, start + i * lengthSize, lengthSize)));
  }
  if (flags & 1) {
    requireLength(bytes, start + rank * lengthSize * 2);
  }
  const elementCount = shape.reduce((n, dimension) => {
    if (dimension > Number.MAX_SAFE_INTEGER / Math.max(n, 1)) fail('dataspace too large');
    return n * dimension;
  }, 1);
  return {shape, elementCount};
}
export function parseHDF5PrimitiveType(bytes: Uint8Array): HDF5Primitive {
  requireLength(bytes, 12);
  const kind = bytes[0] & 15,
    version = bytes[0] >>> 4;
  if (version < 1 || version > 4 || (kind !== 0 && kind !== 1)) fail('unsupported datatype class');
  const size = safe(readHDF5Unsigned(bytes, 4, 4));
  if (![1, 2, 4, 8].includes(size)) fail('unsupported primitive size');
  const littleEndian = (bytes[1] & 1) === 0;
  const signed = kind === 1 || Boolean(bytes[1] & 8);
  if (kind === 1 && size !== 4 && size !== 8) fail('unsupported float width');
  // Reject nonstandard bit offsets and precisions rather than silently misdecoding.
  const bitOffset = Number(readHDF5Unsigned(bytes, 8, 2));
  const precision = Number(readHDF5Unsigned(bytes, 10, 2));
  if (kind === 0 && (bitOffset !== 0 || precision !== size * 8)) {
    fail('nonstandard integer bitfield');
  }
  return {kind: kind === 0 ? 'integer' : 'float', size, littleEndian, signed};
}
export function parseHDF5ContiguousLayout(
  bytes: Uint8Array,
  offsetSize: number,
  lengthSize: number
): HDF5ContiguousLayout {
  requireLength(bytes, 2);
  const version = bytes[0];
  if (version !== 3 || bytes[1] !== 1) fail('only contiguous layout v3 supported');
  const address = readHDF5Unsigned(bytes, 2, offsetSize);
  const byteLength = safe(readHDF5Unsigned(bytes, 2 + offsetSize, lengthSize));
  if (address === (1n << BigInt(offsetSize * 8)) - 1n) fail('unallocated contiguous storage');
  return {address, byteLength};
}
export function decodeHDF5Primitive(bytes: Uint8Array, type: HDF5Primitive): ArrayBufferView {
  if (bytes.length % type.size) fail('misaligned primitive payload');
  const count = bytes.length / type.size;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result:
    | Float32Array
    | Float64Array
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | BigInt64Array
    | BigUint64Array =
    type.kind === 'float'
      ? type.size === 4
        ? new Float32Array(count)
        : new Float64Array(count)
      : type.size === 1
        ? type.signed
          ? new Int8Array(count)
          : new Uint8Array(count)
        : type.size === 2
          ? type.signed
            ? new Int16Array(count)
            : new Uint16Array(count)
          : type.size === 4
            ? type.signed
              ? new Int32Array(count)
              : new Uint32Array(count)
            : type.signed
              ? new BigInt64Array(count)
              : new BigUint64Array(count);
  for (let i = 0; i < count; i++) {
    const offset = i * type.size;
    const value =
      type.kind === 'float'
        ? type.size === 4
          ? view.getFloat32(offset, type.littleEndian)
          : view.getFloat64(offset, type.littleEndian)
        : type.size === 1
          ? type.signed
            ? view.getInt8(offset)
            : view.getUint8(offset)
          : type.size === 2
            ? type.signed
              ? view.getInt16(offset, type.littleEndian)
              : view.getUint16(offset, type.littleEndian)
            : type.size === 4
              ? type.signed
                ? view.getInt32(offset, type.littleEndian)
                : view.getUint32(offset, type.littleEndian)
              : type.signed
                ? view.getBigInt64(offset, type.littleEndian)
                : view.getBigUint64(offset, type.littleEndian);
    (result as any)[i] = value;
  }
  return result;
}
