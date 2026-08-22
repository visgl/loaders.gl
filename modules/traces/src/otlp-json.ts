// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const OTLP_ID_KEYS = new Set(['traceId', 'spanId', 'parentSpanId']);
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Converts OTLP hexadecimal IDs to standard protobuf-JSON base64 values. */
export function convertOtlpJsonIdsToProtobuf(value: unknown): unknown {
  return transformJsonIds(value, hexToBase64);
}

/** Converts standard protobuf-JSON base64 IDs to OTLP hexadecimal values. */
export function convertProtobufJsonIdsToOtlp(value: unknown): unknown {
  return transformJsonIds(value, base64ToHex);
}

/** Recursively transforms known OTLP identifier fields. */
function transformJsonIds(value: unknown, transform: (value: string) => string): unknown {
  if (Array.isArray(value)) {
    return value.map(item => transformJsonIds(item, transform));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      OTLP_ID_KEYS.has(key) && typeof item === 'string'
        ? transform(item)
        : transformJsonIds(item, transform)
    ])
  );
}

/** Encodes one hexadecimal string as base64. */
function hexToBase64(hex: string): string {
  if (hex.length % 2 !== 0 || !/^[\da-f]*$/i.test(hex)) {
    throw new Error('OTLP trace and span IDs must be hexadecimal strings.');
  }
  const bytes = Uint8Array.from({length: hex.length / 2}, (_, index) =>
    Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  );
  let result = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const combined = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);
    result += BASE64_ALPHABET[(combined >> 18) & 63];
    result += BASE64_ALPHABET[(combined >> 12) & 63];
    result += second === undefined ? '=' : BASE64_ALPHABET[(combined >> 6) & 63];
    result += third === undefined ? '=' : BASE64_ALPHABET[combined & 63];
  }
  return result;
}

/** Decodes one base64 string as lowercase hexadecimal. */
function base64ToHex(base64: string): string {
  const normalized = base64.replace(/=+$/, '');
  let bits = 0;
  let bitCount = 0;
  const bytes: number[] = [];
  for (const character of normalized) {
    const value = BASE64_ALPHABET.indexOf(character);
    if (value < 0) {
      throw new Error('Invalid protobuf-JSON base64 identifier.');
    }
    bits = (bits << 6) | value;
    bitCount += 6;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((bits >> bitCount) & 255);
    }
  }
  return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
}
