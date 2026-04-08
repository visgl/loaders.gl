// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Result of a lexicographic byte-range comparison. */
export type UTF8Comparison = -1 | 0 | 1;

/**
 * Compares two UTF-8 encoded byte ranges without materializing JavaScript strings.
 *
 * @param bytes1 - First UTF-8 byte buffer.
 * @param firstByte1 - Inclusive start byte offset in the first buffer.
 * @param endByte1 - Exclusive end byte offset in the first buffer.
 * @param bytes2 - Second UTF-8 byte buffer.
 * @param firstByte2 - Inclusive start byte offset in the second buffer.
 * @param endByte2 - Exclusive end byte offset in the second buffer.
 * @returns Lexicographic unsigned-byte comparison result.
 * @throws RangeError if either byte range is invalid for its buffer.
 */
// The byte-range comparator intentionally mirrors Arrow `values` + offset-buffer usage.
// eslint-disable-next-line max-params
export function compareUTF8(
  bytes1: Uint8Array,
  firstByte1: number,
  endByte1: number,
  bytes2: Uint8Array,
  firstByte2: number,
  endByte2: number
): UTF8Comparison {
  checkByteRange(bytes1, firstByte1, endByte1);
  checkByteRange(bytes2, firstByte2, endByte2);

  const byteLength1 = endByte1 - firstByte1;
  const byteLength2 = endByte2 - firstByte2;
  const sharedByteLength = Math.min(byteLength1, byteLength2);

  for (let byteIndex = 0; byteIndex < sharedByteLength; byteIndex++) {
    const byte1 = bytes1[firstByte1 + byteIndex];
    const byte2 = bytes2[firstByte2 + byteIndex];
    if (byte1 < byte2) {
      return -1;
    }
    if (byte1 > byte2) {
      return 1;
    }
  }

  if (byteLength1 < byteLength2) {
    return -1;
  }
  if (byteLength1 > byteLength2) {
    return 1;
  }
  return 0;
}

/**
 * Parses a UTF-8 encoded ASCII number without materializing a JavaScript string.
 *
 * Supports decimal numbers with optional sign, fractional component, exponent, and surrounding
 * ASCII whitespace. Returns `undefined` when the range is not a strict decimal number.
 *
 * @param bytes - UTF-8 byte buffer.
 * @param firstByte - Inclusive start byte offset.
 * @param endByte - Exclusive end byte offset.
 * @returns Parsed number, or `undefined` when parsing fails.
 * @throws RangeError if the byte range is invalid for the buffer.
 */
// The parser is intentionally implemented inline to avoid string materialization while validating grammar.
// eslint-disable-next-line max-statements, complexity
export function parseUTF8Number(
  bytes: Uint8Array,
  firstByte: number,
  endByte: number
): number | undefined {
  checkByteRange(bytes, firstByte, endByte);

  const trimmedRange = trimASCIIWhitespace(bytes, firstByte, endByte);
  let start = trimmedRange.start;
  const end = trimmedRange.end;
  if (start >= end) {
    return undefined;
  }

  let sign = 1;
  const signByte = bytes[start];
  if (signByte === 0x2d || signByte === 0x2b) {
    sign = signByte === 0x2d ? -1 : 1;
    start++;
  }

  let value = 0;
  let digitCount = 0;
  let fractionDigitCount = 0;
  while (start < end && isDigit(bytes[start])) {
    value = value * 10 + bytes[start] - 0x30;
    start++;
    digitCount++;
  }

  if (start < end && bytes[start] === 0x2e) {
    start++;
    while (start < end && isDigit(bytes[start])) {
      value = value * 10 + bytes[start] - 0x30;
      start++;
      digitCount++;
      fractionDigitCount++;
    }
  }

  if (digitCount === 0) {
    return undefined;
  }

  let exponent = 0;
  let exponentSign = 1;
  if (start < end && (bytes[start] === 0x65 || bytes[start] === 0x45)) {
    start++;
    if (start < end && (bytes[start] === 0x2d || bytes[start] === 0x2b)) {
      exponentSign = bytes[start] === 0x2d ? -1 : 1;
      start++;
    }

    let exponentDigitCount = 0;
    while (start < end && isDigit(bytes[start])) {
      exponent = exponent * 10 + bytes[start] - 0x30;
      start++;
      exponentDigitCount++;
    }

    if (exponentDigitCount === 0) {
      return undefined;
    }
  }

  if (start !== end) {
    return undefined;
  }

  return sign * applyDecimalScale(value, exponentSign * exponent - fractionDigitCount);
}

/**
 * Parses a UTF-8 encoded ASCII integer into a bigint without materializing a JavaScript string.
 *
 * Supports optional sign and surrounding ASCII whitespace. Returns `undefined` when the range is
 * not a strict base-10 integer.
 *
 * @param bytes - UTF-8 byte buffer.
 * @param firstByte - Inclusive start byte offset.
 * @param endByte - Exclusive end byte offset.
 * @returns Parsed bigint, or `undefined` when parsing fails.
 * @throws RangeError if the byte range is invalid for the buffer.
 */
export function parseUTF8BigInt(
  bytes: Uint8Array,
  firstByte: number,
  endByte: number
): bigint | undefined {
  checkByteRange(bytes, firstByte, endByte);

  const trimmedRange = trimASCIIWhitespace(bytes, firstByte, endByte);
  let start = trimmedRange.start;
  const end = trimmedRange.end;
  if (start >= end) {
    return undefined;
  }

  let sign = 1n;
  const signByte = bytes[start];
  if (signByte === 0x2d || signByte === 0x2b) {
    sign = signByte === 0x2d ? -1n : 1n;
    start++;
  }

  if (start >= end) {
    return undefined;
  }

  let value = 0n;
  while (start < end) {
    const byte = bytes[start];
    if (!isDigit(byte)) {
      return undefined;
    }
    value = value * 10n + BigInt(byte - 0x30);
    start++;
  }

  return sign * value;
}

/**
 * Parses a UTF-8 encoded ASCII boolean without materializing a JavaScript string.
 *
 * Supports `true` and `false`, matched case-insensitively, with surrounding ASCII whitespace.
 *
 * @param bytes - UTF-8 byte buffer.
 * @param firstByte - Inclusive start byte offset.
 * @param endByte - Exclusive end byte offset.
 * @returns Parsed boolean, or `undefined` when parsing fails.
 * @throws RangeError if the byte range is invalid for the buffer.
 */
// eslint-disable-next-line complexity
export function parseUTF8Boolean(
  bytes: Uint8Array,
  firstByte: number,
  endByte: number
): boolean | undefined {
  checkByteRange(bytes, firstByte, endByte);

  const {start, end} = trimASCIIWhitespace(bytes, firstByte, endByte);
  const byteLength = end - start;

  if (
    byteLength === 4 &&
    equalsLowercaseASCII(bytes[start], 0x74) &&
    equalsLowercaseASCII(bytes[start + 1], 0x72) &&
    equalsLowercaseASCII(bytes[start + 2], 0x75) &&
    equalsLowercaseASCII(bytes[start + 3], 0x65)
  ) {
    return true;
  }

  if (
    byteLength === 5 &&
    equalsLowercaseASCII(bytes[start], 0x66) &&
    equalsLowercaseASCII(bytes[start + 1], 0x61) &&
    equalsLowercaseASCII(bytes[start + 2], 0x6c) &&
    equalsLowercaseASCII(bytes[start + 3], 0x73) &&
    equalsLowercaseASCII(bytes[start + 4], 0x65)
  ) {
    return false;
  }

  return undefined;
}

/**
 * Validates that a byte range is inside one UTF-8 byte buffer.
 *
 * @param bytes - Byte buffer that owns the range.
 * @param firstByte - Inclusive start byte offset.
 * @param endByte - Exclusive end byte offset.
 * @throws RangeError if the byte range is invalid for the buffer.
 */
function checkByteRange(bytes: Uint8Array, firstByte: number, endByte: number): void {
  if (
    !Number.isInteger(firstByte) ||
    !Number.isInteger(endByte) ||
    firstByte < 0 ||
    endByte < firstByte ||
    endByte > bytes.length
  ) {
    throw new RangeError(
      `Invalid UTF-8 byte range [${firstByte}, ${endByte}) for byte length ${bytes.length}.`
    );
  }
}

/**
 * Removes ASCII whitespace from the front and back of a byte range.
 *
 * @param bytes - Byte buffer that owns the range.
 * @param firstByte - Inclusive start byte offset.
 * @param endByte - Exclusive end byte offset.
 * @returns Trimmed inclusive start and exclusive end byte offsets.
 */
function trimASCIIWhitespace(
  bytes: Uint8Array,
  firstByte: number,
  endByte: number
): {start: number; end: number} {
  let start = firstByte;
  let end = endByte;

  while (start < end && isASCIIWhitespace(bytes[start])) {
    start++;
  }
  while (end > start && isASCIIWhitespace(bytes[end - 1])) {
    end--;
  }

  return {start, end};
}

/**
 * Checks whether a byte is an ASCII decimal digit.
 *
 * @param byte - Byte to check.
 * @returns `true` when the byte is in the range `0` through `9`.
 */
function isDigit(byte: number): boolean {
  return byte >= 0x30 && byte <= 0x39;
}

/**
 * Applies a base-10 decimal scale to a parsed numeric mantissa.
 *
 * @param value - Parsed numeric mantissa.
 * @param decimalScale - Signed base-10 exponent to apply.
 * @returns Scaled numeric value.
 */
function applyDecimalScale(value: number, decimalScale: number): number {
  return decimalScale >= 0
    ? value * Math.pow(10, decimalScale)
    : value / Math.pow(10, -decimalScale);
}

/**
 * Checks whether a byte is ASCII whitespace.
 *
 * @param byte - Byte to check.
 * @returns `true` for space, tab, line feed, vertical tab, form feed, or carriage return.
 */
function isASCIIWhitespace(byte: number): boolean {
  return byte === 0x20 || (byte >= 0x09 && byte <= 0x0d);
}

/**
 * Case-insensitively compares one ASCII byte with an expected lowercase byte.
 *
 * @param byte - Byte to compare.
 * @param lowercaseByte - Expected lowercase ASCII byte.
 * @returns `true` when `byte` matches the lowercase byte or its uppercase pair.
 */
function equalsLowercaseASCII(byte: number, lowercaseByte: number): boolean {
  return byte === lowercaseByte || byte + 0x20 === lowercaseByte;
}
