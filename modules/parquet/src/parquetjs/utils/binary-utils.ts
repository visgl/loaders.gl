// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const TEXT_DECODER = new TextDecoder();

/** Returns bytes as an exact Uint8Array view. */
export function toUint8Array(binary: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (binary instanceof Uint8Array) {
    return binary;
  }
  if (ArrayBuffer.isView(binary)) {
    return new Uint8Array(binary.buffer, binary.byteOffset, binary.byteLength);
  }
  return new Uint8Array(binary);
}

/** Returns bytes as a copied ArrayBuffer with no extra prefix/suffix bytes. */
export function toArrayBuffer(binary: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  const bytes = toUint8Array(binary);
  return bytes.slice().buffer;
}

/** Returns a copied Uint8Array. */
export function copyUint8Array(binary: Uint8Array): Uint8Array {
  return binary.slice();
}

/** Decode UTF-8 bytes. */
export function decodeUtf8(binary: Uint8Array): string {
  return TEXT_DECODER.decode(binary);
}

/** Encode text as UTF-8 bytes. */
export function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/** Decode an ASCII/UTF-8 range from bytes. */
export function decodeString(
  binary: Uint8Array,
  start: number = 0,
  end: number = binary.length
): string {
  return decodeUtf8(binary.subarray(start, end));
}

function getDataView(binary: Uint8Array): DataView {
  return new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
}

/** Read signed little-endian 32-bit integer. */
export function readInt32LE(binary: Uint8Array, offset: number): number {
  return getDataView(binary).getInt32(offset, true);
}

/** Read unsigned little-endian 32-bit integer. */
export function readUInt32LE(binary: Uint8Array, offset: number): number {
  return getDataView(binary).getUint32(offset, true);
}

/** Read signed little-endian 64-bit integer as number. */
export function readInt64LE(binary: Uint8Array, offset: number): number {
  return Number(getDataView(binary).getBigInt64(offset, true));
}

/** Read little-endian 32-bit float. */
export function readFloatLE(binary: Uint8Array, offset: number): number {
  return getDataView(binary).getFloat32(offset, true);
}

/** Read little-endian 64-bit float. */
export function readDoubleLE(binary: Uint8Array, offset: number): number {
  return getDataView(binary).getFloat64(offset, true);
}
