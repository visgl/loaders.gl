// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** One decoded protobuf field used by the Perfetto codec. */
export type ProtobufField = {
  fieldNumber: number;
  wireType: number;
  value: bigint | Uint8Array;
};

/** Reads all fields from one protobuf message without requiring generated code. */
export function readProtobufFields(bytes: Uint8Array): ProtobufField[] {
  const fields: ProtobufField[] = [];
  let offset = 0;

  while (offset < bytes.length) {
    const tag = readProtobufVarint(bytes, offset);
    offset = tag.offset;
    const fieldNumber = Number(tag.value >> 3n);
    const wireType = Number(tag.value & 7n);

    if (fieldNumber === 0) {
      throw new Error('Invalid protobuf field number 0.');
    }

    if (wireType === 0) {
      const value = readProtobufVarint(bytes, offset);
      fields.push({fieldNumber, wireType, value: value.value});
      offset = value.offset;
      continue;
    }

    if (wireType === 2) {
      const length = readProtobufVarint(bytes, offset);
      offset = length.offset;
      const endOffset = offset + Number(length.value);
      if (endOffset > bytes.length) {
        throw new Error('Truncated length-delimited protobuf field.');
      }
      fields.push({fieldNumber, wireType, value: bytes.subarray(offset, endOffset)});
      offset = endOffset;
      continue;
    }

    if (wireType === 1) {
      offset += 8;
    } else if (wireType === 5) {
      offset += 4;
    } else {
      throw new Error(`Unsupported protobuf wire type ${wireType}.`);
    }

    if (offset > bytes.length) {
      throw new Error('Truncated fixed-width protobuf field.');
    }
  }

  return fields;
}

/** Streams length-delimited messages from a repeated field in an outer protobuf message. */
export async function* streamProtobufMessages(
  iterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  fieldNumber: number
): AsyncIterable<Uint8Array> {
  let pending: Uint8Array<ArrayBufferLike> = new Uint8Array();

  for await (const chunk of iterator) {
    const bytes = toUint8Array(chunk);
    pending = concatenateUint8Arrays([pending, bytes]);
    const parsed = readCompleteFields(pending, fieldNumber);
    pending = pending.subarray(parsed.byteOffset);
    yield* parsed.messages;
  }

  if (pending.byteLength > 0) {
    const parsed = readCompleteFields(pending, fieldNumber);
    yield* parsed.messages;
    if (parsed.byteOffset !== pending.byteLength) {
      throw new Error('Truncated protobuf stream.');
    }
  }
}

/** Encodes one unsigned protobuf varint. */
export function encodeProtobufVarint(value: bigint | number): Uint8Array {
  let remaining = typeof value === 'bigint' ? value : BigInt(value);
  remaining = BigInt.asUintN(64, remaining);
  const bytes: number[] = [];

  do {
    let byte = Number(remaining & 0x7fn);
    remaining >>= 7n;
    if (remaining !== 0n) {
      byte |= 0x80;
    }
    bytes.push(byte);
  } while (remaining !== 0n);

  return Uint8Array.from(bytes);
}

/** Encodes one varint protobuf field. */
export function encodeProtobufVarintField(fieldNumber: number, value: bigint | number): Uint8Array {
  return concatenateUint8Arrays([
    encodeProtobufVarint((fieldNumber << 3) | 0),
    encodeProtobufVarint(value)
  ]);
}

/** Encodes one length-delimited protobuf field. */
export function encodeProtobufBytesField(fieldNumber: number, value: Uint8Array): Uint8Array {
  return concatenateUint8Arrays([
    encodeProtobufVarint((fieldNumber << 3) | 2),
    encodeProtobufVarint(value.byteLength),
    value
  ]);
}

/** Encodes one UTF-8 protobuf string field. */
export function encodeProtobufStringField(fieldNumber: number, value: string): Uint8Array {
  return encodeProtobufBytesField(fieldNumber, new TextEncoder().encode(value));
}

/** Concatenates byte arrays into one compact buffer. */
export function concatenateUint8Arrays(arrays: readonly Uint8Array[]): Uint8Array {
  const byteLength = arrays.reduce((sum, array) => sum + array.byteLength, 0);
  const result = new Uint8Array(byteLength);
  let offset = 0;

  for (const array of arrays) {
    result.set(array, offset);
    offset += array.byteLength;
  }

  return result;
}

/** Reads one protobuf varint at the supplied byte offset. */
function readProtobufVarint(
  bytes: Uint8Array,
  startOffset: number
): {value: bigint; offset: number} {
  let value = 0n;
  let shift = 0n;
  let offset = startOffset;

  while (offset < bytes.length && shift < 70n) {
    const byte = bytes[offset++];
    value |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return {value, offset};
    }
    shift += 7n;
  }

  throw new Error('Invalid or truncated protobuf varint.');
}

/** Reads all complete fields currently buffered and returns matching nested messages. */
function readCompleteFields(
  bytes: Uint8Array,
  targetFieldNumber: number
): {byteOffset: number; messages: Uint8Array[]} {
  const messages: Uint8Array[] = [];
  let byteOffset = 0;

  while (byteOffset < bytes.byteLength) {
    const fieldStartOffset = byteOffset;
    const tag = tryReadProtobufVarint(bytes, byteOffset);
    if (!tag) {
      break;
    }
    byteOffset = tag.offset;
    const fieldNumber = Number(tag.value >> 3n);
    const wireType = Number(tag.value & 7n);
    if (fieldNumber === 0) {
      throw new Error('Invalid protobuf field number 0.');
    }

    if (wireType === 0) {
      const value = tryReadProtobufVarint(bytes, byteOffset);
      if (!value) {
        byteOffset = fieldStartOffset;
        break;
      }
      byteOffset = value.offset;
    } else if (wireType === 1 || wireType === 5) {
      const byteLength = wireType === 1 ? 8 : 4;
      if (byteOffset + byteLength > bytes.byteLength) {
        byteOffset = fieldStartOffset;
        break;
      }
      byteOffset += byteLength;
    } else if (wireType === 2) {
      const length = tryReadProtobufVarint(bytes, byteOffset);
      if (!length || length.value > BigInt(Number.MAX_SAFE_INTEGER)) {
        byteOffset = fieldStartOffset;
        break;
      }
      const valueStartOffset = length.offset;
      const valueEndOffset = valueStartOffset + Number(length.value);
      if (valueEndOffset > bytes.byteLength) {
        byteOffset = fieldStartOffset;
        break;
      }
      if (fieldNumber === targetFieldNumber) {
        messages.push(bytes.slice(valueStartOffset, valueEndOffset));
      }
      byteOffset = valueEndOffset;
    } else {
      throw new Error(`Unsupported protobuf wire type ${wireType}.`);
    }
  }

  return {byteOffset, messages};
}

/** Attempts to read a varint, returning undefined until all bytes are available. */
function tryReadProtobufVarint(
  bytes: Uint8Array,
  startOffset: number
): {value: bigint; offset: number} | undefined {
  let value = 0n;
  let shift = 0n;
  let offset = startOffset;

  while (offset < bytes.byteLength && shift < 70n) {
    const byte = bytes[offset++];
    value |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return {value, offset};
    }
    shift += 7n;
  }
  if (shift >= 70n) {
    throw new Error('Invalid protobuf varint.');
  }
  return undefined;
}

/** Normalizes one binary stream chunk without copying it. */
function toUint8Array(chunk: ArrayBufferLike | ArrayBufferView): Uint8Array {
  return ArrayBuffer.isView(chunk)
    ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
    : new Uint8Array(chunk);
}
