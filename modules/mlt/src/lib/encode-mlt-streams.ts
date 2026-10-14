// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Concatenates bounded byte chunks without spreading large arrays onto the call stack. */
export function concatenateBytes(chunks: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/** Encodes unsigned safe integers without 32-bit truncation. */
export function encodeVarints(values: readonly number[]): Uint8Array {
  const bytes: number[] = [];
  for (let value of values) {
    do {
      const remainder = value % 128;
      value = Math.floor(value / 128);
      bytes.push(remainder + (value ? 128 : 0));
    } while (value);
  }
  return Uint8Array.from(bytes);
}

/** Encodes a length-prefixed UTF-8 metadata string. */
export function encodeString(value: string): Uint8Array {
  const bytes = new TextEncoder().encode(value);
  return concatenateBytes([encodeVarints([bytes.length]), bytes]);
}

/** Encodes an MLT stream header followed by its payload. */
export function encodeStream(
  type: number,
  encoding: number,
  count: number,
  bytes: Uint8Array
): Uint8Array {
  return concatenateBytes([
    Uint8Array.of(type, encoding),
    encodeVarints([count, bytes.length]),
    bytes
  ]);
}

/** Encodes a plain unsigned integer stream with VarInt physical encoding. */
export function encodeIntegerStream(type: number, values: number[]): Uint8Array {
  return encodeStream(type, 2, values.length, encodeVarints(values));
}

/** Encodes bit-packed booleans using ORC byte-RLE literal runs (also used by Present). */
export function encodeBooleanStream(type: number, values: boolean[]): Uint8Array {
  const packed = new Uint8Array(Math.ceil(values.length / 8));
  for (let index = 0; index < values.length; index++)
    if (values[index]) packed[index >> 3] |= 1 << (index % 8);
  const chunks: Uint8Array[] = [];
  for (let offset = 0; offset < packed.length; offset += 128) {
    const chunk = packed.subarray(offset, offset + 128);
    chunks.push(Uint8Array.of(256 - chunk.length), chunk);
  }
  // MLT v1 Boolean RLE: logical RLE (3 << 5), physical NONE; no integer RLE metadata.
  return encodeStream(type, 0x60, values.length, concatenateBytes(chunks));
}
