// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const PERFETTO_TRACE_PACKET_FIELDS = new Set([
  1, 2, 6, 9, 11, 33, 34, 35, 37, 43, 44, 45, 50, 59, 60, 67, 89
]);

/** Detects a Perfetto trace from its first complete TracePacket. */
export function testPerfettoTrace(arrayBuffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(arrayBuffer);
  const tag = readVarint(bytes, 0);
  if (!tag || tag.value !== 0x0an) {
    return false;
  }
  const length = readVarint(bytes, tag.byteOffset);
  if (!length || length.value > BigInt(Number.MAX_SAFE_INTEGER)) {
    return false;
  }
  const packetEndOffset = length.byteOffset + Number(length.value);
  if (packetEndOffset > bytes.byteLength || packetEndOffset === length.byteOffset) {
    return false;
  }
  return hasPerfettoPacketField(bytes.subarray(length.byteOffset, packetEndOffset));
}

/** Returns true when a protobuf message contains a recognized TracePacket payload field. */
function hasPerfettoPacketField(bytes: Uint8Array): boolean {
  let byteOffset = 0;
  while (byteOffset < bytes.byteLength) {
    const tag = readVarint(bytes, byteOffset);
    if (!tag) {
      return false;
    }
    byteOffset = tag.byteOffset;
    const fieldNumber = Number(tag.value >> 3n);
    const wireType = Number(tag.value & 7n);
    if (PERFETTO_TRACE_PACKET_FIELDS.has(fieldNumber)) {
      return true;
    }
    if (wireType === 0) {
      const value = readVarint(bytes, byteOffset);
      if (!value) {
        return false;
      }
      byteOffset = value.byteOffset;
    } else if (wireType === 1 || wireType === 5) {
      byteOffset += wireType === 1 ? 8 : 4;
    } else if (wireType === 2) {
      const length = readVarint(bytes, byteOffset);
      if (!length || length.value > BigInt(Number.MAX_SAFE_INTEGER)) {
        return false;
      }
      byteOffset = length.byteOffset + Number(length.value);
    } else {
      return false;
    }
    if (byteOffset > bytes.byteLength) {
      return false;
    }
  }
  return false;
}

/** Reads one complete unsigned protobuf varint from a sniff buffer. */
function readVarint(
  bytes: Uint8Array,
  startByteOffset: number
): {value: bigint; byteOffset: number} | undefined {
  let value = 0n;
  let shift = 0n;
  let byteOffset = startByteOffset;
  while (byteOffset < bytes.byteLength && shift < 70n) {
    const byte = bytes[byteOffset++];
    value |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return {value, byteOffset};
    }
    shift += 7n;
  }
  return undefined;
}
