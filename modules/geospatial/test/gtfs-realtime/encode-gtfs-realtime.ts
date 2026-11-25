// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Writes a protobuf varint, including two's-complement signed integers. */
export function encodeVarint(value: number | bigint): number[] {
  let remainder = BigInt.asUintN(64, BigInt(value));
  const bytes: number[] = [];
  while (remainder >= 128n) {
    bytes.push(Number(remainder % 128n) + 128);
    remainder /= 128n;
  }
  bytes.push(Number(remainder));
  return bytes;
}

/** Writes a varint field. */
export function encodeInteger(field: number, value: number | bigint): number[] {
  return [...encodeVarint(field * 8), ...encodeVarint(value)];
}

/** Writes a string or nested protobuf message. */
export function encodeMessage(field: number, ...fields: number[][]): number[] {
  const bytes = fields.flat();
  return [...encodeVarint(field * 8 + 2), ...encodeVarint(bytes.length), ...bytes];
}

/** Writes a UTF-8 field. */
export function encodeString(field: number, value: string): number[] {
  return encodeMessage(field, [...new TextEncoder().encode(value)]);
}

/** Writes a little-endian protobuf float or double. */
export function encodeFloat(field: number, value: number, double = false): number[] {
  const payload = new ArrayBuffer(double ? 8 : 4);
  const view = new DataView(payload);
  if (double) view.setFloat64(0, value, true);
  else view.setFloat32(0, value, true);
  return [...encodeVarint(field * 8 + (double ? 1 : 5)), ...new Uint8Array(payload)];
}

/** Writes an unknown legacy group with an optional nested field. */
export function encodeGroup(field: number, ...fields: number[][]): number[] {
  return [...encodeVarint(field * 8 + 3), ...fields.flat(), ...encodeVarint(field * 8 + 4)];
}

/** Writes a complete feed with the default GTFS Realtime version. */
export function encodeFeed(headerFields: number[][], ...entities: number[][]): ArrayBuffer {
  return Uint8Array.from([
    ...encodeMessage(1, encodeString(1, '2.0'), ...headerFields),
    ...entities.flat()
  ]).buffer;
}
