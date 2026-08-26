// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {decodeUtf8, toUint8Array} from '../utils/binary-utils';

const MAXIMUM_VARIANT_NESTING = 1024;

/** Decodes the binary metadata/value pair used by the Parquet VARIANT type. */
export function decodeVariant(
  metadataInput: ArrayBuffer | ArrayBufferView,
  valueInput: ArrayBuffer | ArrayBufferView
): unknown {
  const metadata = toUint8Array(metadataInput);
  const value = toUint8Array(valueInput);
  const dictionary = decodeVariantMetadata(metadata);
  const decoded = decodeVariantValue(value, 0, value.length, dictionary, 0);
  if (decoded.nextOffset !== value.length) {
    throw new Error(
      `parquet: trailing bytes in VARIANT value (${value.length - decoded.nextOffset})`
    );
  }
  return decoded.value;
}

interface VariantMetadata {
  /** Dictionary strings used by object field IDs. */
  dictionary: string[];
}

interface DecodedVariantValue {
  /** Decoded JavaScript value. */
  value: unknown;
  /** Offset immediately following the encoded value. */
  nextOffset: number;
}

/** Parses the versioned dictionary at the start of every Variant value. */
function decodeVariantMetadata(bytes: Uint8Array): VariantMetadata {
  if (bytes.length < 2) {
    throw new Error('parquet: VARIANT metadata is truncated');
  }
  const header = bytes[0];
  const version = header & 0xf;
  if (version !== 1) {
    throw new Error(`parquet: unsupported VARIANT metadata version ${version}`);
  }
  const offsetSize = ((header >> 6) & 0x3) + 1;
  const dictionarySize = readUnsigned(bytes, 1, offsetSize);
  const offsetsStart = 1 + offsetSize;
  const offsetsEnd = offsetsStart + (dictionarySize + 1) * offsetSize;
  if (offsetsEnd > bytes.length) {
    throw new Error('parquet: VARIANT metadata offsets are truncated');
  }
  const dictionaryBytes = bytes.subarray(offsetsEnd);
  const dictionary: string[] = [];
  let previousOffset = 0;
  for (let index = 0; index < dictionarySize + 1; index++) {
    const offset = readUnsigned(bytes, offsetsStart + index * offsetSize, offsetSize);
    if (offset < previousOffset || offset > dictionaryBytes.length) {
      throw new Error('parquet: invalid VARIANT metadata dictionary offset');
    }
    if (index < dictionarySize) {
      dictionary.push(
        decodeUtf8(
          dictionaryBytes.subarray(
            offset,
            readUnsigned(bytes, offsetsStart + (index + 1) * offsetSize, offsetSize)
          )
        )
      );
    }
    previousOffset = offset;
  }
  if (previousOffset !== dictionaryBytes.length) {
    throw new Error('parquet: VARIANT metadata does not consume its dictionary bytes');
  }
  return {dictionary};
}

/** Decodes one self-contained Variant value within the enclosing byte range. */
function decodeVariantValue(
  bytes: Uint8Array,
  offset: number,
  endOffset: number,
  metadata: VariantMetadata,
  depth: number
): DecodedVariantValue {
  if (depth > MAXIMUM_VARIANT_NESTING || offset >= endOffset) {
    throw new Error('parquet: invalid or excessively nested VARIANT value');
  }
  const valueMetadata = bytes[offset++];
  const basicType = valueMetadata & 0x3;
  const valueHeader = valueMetadata >> 2;
  switch (basicType) {
    case 0:
      return decodePrimitiveValue(bytes, offset, endOffset, valueHeader);
    case 1: {
      const stringEnd = checkedEnd(offset + valueHeader, endOffset);
      return {value: decodeUtf8(bytes.subarray(offset, stringEnd)), nextOffset: stringEnd};
    }
    case 2:
      return decodeObjectValue(bytes, offset, endOffset, valueHeader, metadata, depth + 1);
    case 3:
      return decodeArrayValue(bytes, offset, endOffset, valueHeader, metadata, depth + 1);
    default:
      throw new Error(`parquet: invalid VARIANT basic type ${basicType}`);
  }
}

/** Decodes a Variant primitive identified by its six-bit primitive header. */
function decodePrimitiveValue(
  bytes: Uint8Array,
  offset: number,
  endOffset: number,
  primitiveType: number
): DecodedVariantValue {
  switch (primitiveType) {
    case 0:
      return {value: null, nextOffset: offset};
    case 1:
      return {value: true, nextOffset: offset};
    case 2:
      return {value: false, nextOffset: offset};
    case 3:
      return {value: readSigned(bytes, offset, 1), nextOffset: checkedEnd(offset + 1, endOffset)};
    case 4:
      return {value: readSigned(bytes, offset, 2), nextOffset: checkedEnd(offset + 2, endOffset)};
    case 5:
      return {value: readSigned(bytes, offset, 4), nextOffset: checkedEnd(offset + 4, endOffset)};
    case 6:
      return {value: readBigInt(bytes, offset, 8), nextOffset: checkedEnd(offset + 8, endOffset)};
    case 7:
      return {value: readFloat64(bytes, offset), nextOffset: checkedEnd(offset + 8, endOffset)};
    case 8:
    case 9:
    case 10: {
      const scale = readSigned(bytes, offset, 1);
      const width = primitiveType === 8 ? 4 : primitiveType === 9 ? 8 : 16;
      const unscaled = readBigInt(bytes, offset + 1, width);
      return {
        value: formatVariantDecimal(unscaled, scale),
        nextOffset: checkedEnd(offset + 1 + width, endOffset)
      };
    }
    case 11:
      return {value: readSigned(bytes, offset, 4), nextOffset: checkedEnd(offset + 4, endOffset)};
    case 12:
    case 13:
    case 17:
    case 18:
    case 19:
      return {value: readBigInt(bytes, offset, 8), nextOffset: checkedEnd(offset + 8, endOffset)};
    case 14:
      return {value: readFloat32(bytes, offset), nextOffset: checkedEnd(offset + 4, endOffset)};
    case 15: {
      const length = readUnsigned(bytes, offset, 4);
      const start = checkedEnd(offset + 4, endOffset);
      const binaryEnd = checkedEnd(start + length, endOffset);
      return {value: bytes.slice(start, binaryEnd), nextOffset: binaryEnd};
    }
    case 16: {
      const length = readUnsigned(bytes, offset, 4);
      const start = checkedEnd(offset + 4, endOffset);
      const stringEnd = checkedEnd(start + length, endOffset);
      return {value: decodeUtf8(bytes.subarray(start, stringEnd)), nextOffset: stringEnd};
    }
    case 20: {
      const uuidEnd = checkedEnd(offset + 16, endOffset);
      return {value: bytes.slice(offset, uuidEnd), nextOffset: uuidEnd};
    }
    default:
      throw new Error(`parquet: unsupported VARIANT primitive type ${primitiveType}`);
  }
}

/** Decodes an object using metadata dictionary field IDs and relative value offsets. */
function decodeObjectValue(
  bytes: Uint8Array,
  offset: number,
  endOffset: number,
  valueHeader: number,
  metadata: VariantMetadata,
  depth: number
): DecodedVariantValue {
  const isLarge = (valueHeader & 0x10) !== 0;
  const fieldIdSize = ((valueHeader >> 2) & 0x3) + 1;
  const fieldOffsetSize = (valueHeader & 0x3) + 1;
  const countSize = isLarge ? 4 : 1;
  const count = readUnsigned(bytes, offset, countSize);
  offset = checkedEnd(offset + countSize, endOffset);
  const fieldIds: number[] = [];
  for (let index = 0; index < count; index++) {
    fieldIds.push(readUnsigned(bytes, offset, fieldIdSize));
    offset = checkedEnd(offset + fieldIdSize, endOffset);
  }
  const offsets: number[] = [];
  for (let index = 0; index <= count; index++) {
    offsets.push(readUnsigned(bytes, offset, fieldOffsetSize));
    offset = checkedEnd(offset + fieldOffsetSize, endOffset);
  }
  const valuesStart = offset;
  const valuesEnd = checkedEnd(valuesStart + offsets[offsets.length - 1], endOffset);
  const object: Record<string, unknown> = {};
  for (let index = 0; index < count; index++) {
    const fieldId = fieldIds[index];
    const fieldName = metadata.dictionary[fieldId];
    if (fieldName === undefined) {
      throw new Error(`parquet: invalid VARIANT object field id ${fieldId}`);
    }
    if (fieldName in object) {
      throw new Error(`parquet: duplicate VARIANT object field ${fieldName}`);
    }
    const valueOffset = checkedEnd(valuesStart + offsets[index], valuesEnd);
    const decoded = decodeVariantValue(bytes, valueOffset, valuesEnd, metadata, depth);
    object[fieldName] = decoded.value;
  }
  return {value: object, nextOffset: valuesEnd};
}

/** Decodes an array using relative offsets into its contiguous value region. */
function decodeArrayValue(
  bytes: Uint8Array,
  offset: number,
  endOffset: number,
  valueHeader: number,
  metadata: VariantMetadata,
  depth: number
): DecodedVariantValue {
  const isLarge = (valueHeader & 0x4) !== 0;
  const fieldOffsetSize = (valueHeader & 0x3) + 1;
  const countSize = isLarge ? 4 : 1;
  const count = readUnsigned(bytes, offset, countSize);
  offset = checkedEnd(offset + countSize, endOffset);
  const offsets: number[] = [];
  for (let index = 0; index <= count; index++) {
    offsets.push(readUnsigned(bytes, offset, fieldOffsetSize));
    offset = checkedEnd(offset + fieldOffsetSize, endOffset);
  }
  const valuesStart = offset;
  const valuesEnd = checkedEnd(valuesStart + offsets[offsets.length - 1], endOffset);
  const array = new Array<unknown>(count);
  for (let index = 0; index < count; index++) {
    const valueOffset = checkedEnd(valuesStart + offsets[index], valuesEnd);
    array[index] = decodeVariantValue(bytes, valueOffset, valuesEnd, metadata, depth).value;
  }
  return {value: array, nextOffset: valuesEnd};
}

/** Reads an unsigned little-endian integer of up to four bytes. */
function readUnsigned(bytes: Uint8Array, offset: number, byteLength: number): number {
  let value = 0;
  for (let index = 0; index < byteLength; index++) {
    value += bytes[offset + index] * 2 ** (index * 8);
  }
  if (!Number.isSafeInteger(value)) {
    throw new Error('parquet: VARIANT integer exceeds JavaScript safe range');
  }
  return value;
}

/** Reads a signed little-endian integer of up to four bytes. */
function readSigned(bytes: Uint8Array, offset: number, byteLength: number): number {
  const unsigned = readUnsigned(bytes, offset, byteLength);
  const signBit = 2 ** (byteLength * 8 - 1);
  return unsigned >= signBit ? unsigned - 2 ** (byteLength * 8) : unsigned;
}

/** Reads a signed little-endian integer while preserving 64- and 128-bit precision. */
function readBigInt(bytes: Uint8Array, offset: number, byteLength: number): bigint {
  let value = 0n;
  for (let index = 0; index < byteLength; index++) {
    value |= BigInt(bytes[offset + index]) << BigInt(index * 8);
  }
  const signBit = 1n << BigInt(byteLength * 8 - 1);
  return value >= signBit ? value - (1n << BigInt(byteLength * 8)) : value;
}

/** Reads a little-endian IEEE-754 single-precision value. */
function readFloat32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getFloat32(0, true);
}

/** Reads a little-endian IEEE-754 double-precision value. */
function readFloat64(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 8).getFloat64(0, true);
}

/** Formats a Variant decimal without losing precision when JavaScript numbers are unsafe. */
function formatVariantDecimal(unscaled: bigint, scale: number): number | string {
  if (
    scale === 0 &&
    unscaled >= BigInt(Number.MIN_SAFE_INTEGER) &&
    unscaled <= BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return Number(unscaled);
  }
  const sign = unscaled < 0n ? '-' : '';
  const digits = (unscaled < 0n ? -unscaled : unscaled).toString().padStart(scale + 1, '0');
  const split = digits.length - scale;
  return `${sign}${digits.slice(0, split)}.${digits.slice(split)}`;
}

/** Validates an offset against the enclosing value boundary. */
function checkedEnd(offset: number, endOffset: number): number {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > endOffset) {
    throw new Error('parquet: truncated VARIANT value');
  }
  return offset;
}
