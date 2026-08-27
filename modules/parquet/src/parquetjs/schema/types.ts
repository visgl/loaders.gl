// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

/* eslint-disable camelcase */
import {BSONWriter, parseBSONSync} from '@loaders.gl/bson';
import {OriginalType, ParquetField, ParquetType, PrimitiveType} from './declare';
import {
  decodeUtf8,
  encodeUtf8,
  readUInt32LE,
  toArrayBuffer,
  toUint8Array,
  writeUInt32LE
} from '../utils/binary-utils';

export interface ParquetTypeKit {
  primitiveType: PrimitiveType;
  originalType?: OriginalType;
  typeLength?: number;
  toPrimitive: Function;
  fromPrimitive?: Function;
}

export const PARQUET_LOGICAL_TYPES: Record<ParquetType, ParquetTypeKit> = {
  BOOLEAN: {
    primitiveType: 'BOOLEAN',
    toPrimitive: toPrimitive_BOOLEAN,
    fromPrimitive: fromPrimitive_BOOLEAN
  },
  INT32: {
    primitiveType: 'INT32',
    toPrimitive: toPrimitive_INT32
  },
  INT64: {
    primitiveType: 'INT64',
    toPrimitive: toPrimitive_INT64
  },
  INT96: {
    primitiveType: 'INT96',
    toPrimitive: toPrimitive_INT96
  },
  FLOAT: {
    primitiveType: 'FLOAT',
    toPrimitive: toPrimitive_FLOAT
  },
  DOUBLE: {
    primitiveType: 'DOUBLE',
    toPrimitive: toPrimitive_DOUBLE
  },
  BYTE_ARRAY: {
    primitiveType: 'BYTE_ARRAY',
    toPrimitive: toPrimitive_BYTE_ARRAY
  },
  FIXED_LEN_BYTE_ARRAY: {
    primitiveType: 'FIXED_LEN_BYTE_ARRAY',
    toPrimitive: toPrimitive_BYTE_ARRAY
  },
  UTF8: {
    primitiveType: 'BYTE_ARRAY',
    originalType: 'UTF8',
    toPrimitive: toPrimitive_UTF8,
    fromPrimitive: fromPrimitive_UTF8
  },
  ENUM: {
    primitiveType: 'BYTE_ARRAY',
    originalType: 'ENUM',
    toPrimitive: toPrimitive_UTF8,
    fromPrimitive: fromPrimitive_UTF8
  },
  TIME_MILLIS: {
    primitiveType: 'INT32',
    originalType: 'TIME_MILLIS',
    toPrimitive: toPrimitive_TIME_MILLIS
  },
  TIME_MICROS: {
    primitiveType: 'INT64',
    originalType: 'TIME_MICROS',
    toPrimitive: toPrimitive_TIME_MICROS
  },
  TIME_NANOS: {
    primitiveType: 'INT64',
    originalType: 'TIME_NANOS',
    toPrimitive: toPrimitive_TIME_NANOS
  },
  DATE: {
    primitiveType: 'INT32',
    originalType: 'DATE',
    toPrimitive: toPrimitive_DATE,
    fromPrimitive: fromPrimitive_DATE
  },
  TIMESTAMP_MILLIS: {
    primitiveType: 'INT64',
    originalType: 'TIMESTAMP_MILLIS',
    toPrimitive: toPrimitive_TIMESTAMP_MILLIS,
    fromPrimitive: fromPrimitive_TIMESTAMP_MILLIS
  },
  TIMESTAMP_MICROS: {
    primitiveType: 'INT64',
    originalType: 'TIMESTAMP_MICROS',
    toPrimitive: toPrimitive_TIMESTAMP_MICROS,
    fromPrimitive: fromPrimitive_TIMESTAMP_MICROS
  },
  TIMESTAMP_NANOS: {
    primitiveType: 'INT64',
    originalType: 'TIMESTAMP_NANOS',
    toPrimitive: toPrimitive_TIMESTAMP_NANOS
  },
  UINT_8: {
    primitiveType: 'INT32',
    originalType: 'UINT_8',
    toPrimitive: toPrimitive_UINT8
  },
  UINT_16: {
    primitiveType: 'INT32',
    originalType: 'UINT_16',
    toPrimitive: toPrimitive_UINT16
  },
  UINT_32: {
    primitiveType: 'INT32',
    originalType: 'UINT_32',
    toPrimitive: toPrimitive_UINT32
  },
  UINT_64: {
    primitiveType: 'INT64',
    originalType: 'UINT_64',
    toPrimitive: toPrimitive_UINT64
  },
  INT_8: {
    primitiveType: 'INT32',
    originalType: 'INT_8',
    toPrimitive: toPrimitive_INT8
  },
  INT_16: {
    primitiveType: 'INT32',
    originalType: 'INT_16',
    toPrimitive: toPrimitive_INT16
  },
  INT_32: {
    primitiveType: 'INT32',
    originalType: 'INT_32',
    toPrimitive: toPrimitive_INT32
  },
  INT_64: {
    primitiveType: 'INT64',
    originalType: 'INT_64',
    toPrimitive: toPrimitive_INT64
  },
  JSON: {
    primitiveType: 'BYTE_ARRAY',
    originalType: 'JSON',
    toPrimitive: toPrimitive_JSON,
    fromPrimitive: fromPrimitive_JSON
  },
  BSON: {
    primitiveType: 'BYTE_ARRAY',
    originalType: 'BSON',
    toPrimitive: toPrimitive_BSON,
    fromPrimitive: fromPrimitive_BSON
  },
  UUID: {
    primitiveType: 'FIXED_LEN_BYTE_ARRAY',
    originalType: 'UUID',
    typeLength: 16,
    toPrimitive: toPrimitive_BYTE_ARRAY
  },
  FLOAT16: {
    primitiveType: 'FIXED_LEN_BYTE_ARRAY',
    originalType: 'FLOAT16',
    typeLength: 2,
    toPrimitive: toPrimitive_FLOAT16,
    fromPrimitive: fromPrimitive_FLOAT16
  },
  UNKNOWN: {
    primitiveType: 'BYTE_ARRAY',
    originalType: 'UNKNOWN',
    toPrimitive: toPrimitive_BYTE_ARRAY
  },
  VARIANT: {
    primitiveType: 'BYTE_ARRAY',
    originalType: 'VARIANT',
    toPrimitive: toPrimitive_BYTE_ARRAY
  },
  GEOMETRY: {
    primitiveType: 'BYTE_ARRAY',
    originalType: 'GEOMETRY',
    toPrimitive: toPrimitive_BYTE_ARRAY
  },
  GEOGRAPHY: {
    primitiveType: 'BYTE_ARRAY',
    originalType: 'GEOGRAPHY',
    toPrimitive: toPrimitive_BYTE_ARRAY
  },
  INTERVAL: {
    primitiveType: 'FIXED_LEN_BYTE_ARRAY',
    originalType: 'INTERVAL',
    typeLength: 12,
    toPrimitive: toPrimitive_INTERVAL,
    fromPrimitive: fromPrimitive_INTERVAL
  },
  DECIMAL_INT32: {
    primitiveType: 'INT32',
    originalType: 'DECIMAL_INT32',
    toPrimitive: decimalToPrimitive_INT32,
    fromPrimitive: decimalFromPrimitive_INT
  },
  DECIMAL_INT64: {
    primitiveType: 'INT64',
    originalType: 'DECIMAL_INT64',
    toPrimitive: decimalToPrimitive_INT64,
    fromPrimitive: decimalFromPrimitive_INT
  },
  DECIMAL_BYTE_ARRAY: {
    primitiveType: 'BYTE_ARRAY',
    originalType: 'DECIMAL_BYTE_ARRAY',
    toPrimitive: decimalToPrimitive_BYTE_ARRAY,
    fromPrimitive: decimalFromPrimitive_BYTE_ARRAY
  },
  DECIMAL_FIXED_LEN_BYTE_ARRAY: {
    primitiveType: 'FIXED_LEN_BYTE_ARRAY',
    originalType: 'DECIMAL_FIXED_LEN_BYTE_ARRAY',
    toPrimitive: decimalToPrimitive_BYTE_ARRAY,
    fromPrimitive: decimalFromPrimitive_BYTE_ARRAY
  }
};

/**
 * Convert a value from it's native representation to the internal/underlying
 * primitive type
 */
export function toPrimitive(type: ParquetType, value: unknown, field?: ParquetField): unknown {
  if (!(type in PARQUET_LOGICAL_TYPES)) {
    throw new Error(`invalid type: ${type}`);
  }

  return PARQUET_LOGICAL_TYPES[type].toPrimitive(value, field);
}

/**
 * Convert a value from it's internal/underlying primitive representation to
 * the native representation
 */
export function fromPrimitive(type: ParquetType, value: unknown, field?: ParquetField) {
  if (!(type in PARQUET_LOGICAL_TYPES)) {
    throw new Error(`invalid type: ${type}`);
  }

  if ('fromPrimitive' in PARQUET_LOGICAL_TYPES[type]) {
    return PARQUET_LOGICAL_TYPES[type].fromPrimitive?.(value, field);
    // tslint:disable-next-line:no-else-after-return
  }
  return value;
}

function toPrimitive_BOOLEAN(value: unknown): boolean {
  return Boolean(value);
}

function fromPrimitive_BOOLEAN(value: any): boolean {
  return Boolean(value);
}

function toPrimitive_FLOAT(value: any): number {
  const v = parseFloat(value);
  if (Number.isNaN(v)) {
    throw new Error(`invalid value for FLOAT: ${value}`);
  }
  return v;
}

/** Converts a JavaScript number to the two-byte IEEE 754 binary16 representation. */
function toPrimitive_FLOAT16(value: unknown): Uint8Array {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue) && !Number.isNaN(value)) {
    throw new Error(`invalid value for FLOAT16: ${value}`);
  }

  const float32 = new Float32Array([numberValue]);
  const bits = new Uint32Array(float32.buffer)[0];
  const sign = (bits >>> 16) & 0x8000;
  const exponent = (bits >>> 23) & 0xff;
  const mantissa = bits & 0x7fffff;
  let half: number;
  if (exponent === 0xff) {
    half = sign | 0x7c00 | (mantissa ? 0x0200 : 0);
  } else {
    const halfExponent = exponent - 127 + 15;
    if (halfExponent >= 0x1f) {
      half = sign | 0x7c00;
    } else if (halfExponent <= 0) {
      if (halfExponent < -10) {
        half = sign;
      } else {
        const normalizedMantissa = mantissa | 0x800000;
        half = sign | roundRightShiftToNearestEven(normalizedMantissa, 14 - halfExponent);
      }
    } else {
      const halfMantissa = roundRightShiftToNearestEven(mantissa, 13);
      if (halfMantissa === 0x400) {
        const roundedExponent = halfExponent + 1;
        half = roundedExponent >= 0x1f ? sign | 0x7c00 : sign | (roundedExponent << 10);
      } else {
        half = sign | (halfExponent << 10) | halfMantissa;
      }
    }
  }
  return new Uint8Array([half & 0xff, half >>> 8]);
}

/** Rounds a non-negative integer right shift using IEEE round-to-nearest, ties-to-even. */
function roundRightShiftToNearestEven(value: number, shift: number): number {
  const divisor = 2 ** shift;
  const quotient = Math.floor(value / divisor);
  const remainder = value - quotient * divisor;
  const halfway = divisor / 2;
  return quotient + (remainder > halfway || (remainder === halfway && quotient % 2 === 1) ? 1 : 0);
}

/** Converts little-endian IEEE 754 binary16 bytes to a JavaScript number. */
function fromPrimitive_FLOAT16(value: unknown): number {
  const bytes = toUint8Array(value as ArrayBuffer | ArrayBufferView);
  if (bytes.byteLength !== 2) {
    throw new Error(`invalid FLOAT16 byte length: ${bytes.byteLength}`);
  }
  const half = bytes[0] | (bytes[1] << 8);
  const sign = half & 0x8000 ? -1 : 1;
  const exponent = (half >>> 10) & 0x1f;
  const mantissa = half & 0x03ff;
  if (exponent === 0x1f) {
    return mantissa ? Number.NaN : sign * Number.POSITIVE_INFINITY;
  }
  if (exponent === 0) {
    return sign * 2 ** -14 * (mantissa / 1024);
  }
  return sign * 2 ** (exponent - 15) * (1 + mantissa / 1024);
}

function toPrimitive_DOUBLE(value: any): number {
  const v = parseFloat(value);
  if (Number.isNaN(v)) {
    throw new Error(`invalid value for DOUBLE: ${value}`);
  }
  return v;
}

function toPrimitive_INT8(value: any) {
  const v = parseInt(value, 10);
  if (v < -0x80 || v > 0x7f || Number.isNaN(v)) {
    throw new Error(`invalid value for INT8: ${value}`);
  }

  return v;
}

function toPrimitive_UINT8(value: any) {
  const v = parseInt(value, 10);
  if (v < 0 || v > 0xff || Number.isNaN(v)) {
    throw new Error(`invalid value for UINT8: ${value}`);
  }

  return v;
}

function toPrimitive_INT16(value: any) {
  const v = parseInt(value, 10);
  if (v < -0x8000 || v > 0x7fff || Number.isNaN(v)) {
    throw new Error(`invalid value for INT16: ${value}`);
  }

  return v;
}

function toPrimitive_UINT16(value: any) {
  const v = parseInt(value, 10);
  if (v < 0 || v > 0xffff || Number.isNaN(v)) {
    throw new Error(`invalid value for UINT16: ${value}`);
  }

  return v;
}

function toPrimitive_INT32(value: any) {
  const v = parseInt(value, 10);
  if (v < -0x80000000 || v > 0x7fffffff || Number.isNaN(v)) {
    throw new Error(`invalid value for INT32: ${value}`);
  }

  return v;
}

function decimalToPrimitive_INT32(value: number, field: ParquetField): number {
  const primitiveValue = value * 10 ** (field.scale || 0);
  const v = Math.round(((primitiveValue * 10 ** -field.presision!) % 1) * 10 ** field.presision!);
  if (v < -0x80000000 || v > 0x7fffffff || Number.isNaN(v)) {
    throw new Error(`invalid value for INT32: ${value}`);
  }
  return v;
}

function toPrimitive_UINT32(value: any): number {
  const v = parseInt(value, 10);
  if (v < 0 || v > 0xffffffff || Number.isNaN(v)) {
    throw new Error(`invalid value for UINT32: ${value}`);
  }
  return v;
}

function toPrimitive_INT64(value: unknown): number | bigint {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new Error(`invalid value for INT64: ${value}`);
    }
    return value;
  }

  let primitiveValue: bigint;
  try {
    primitiveValue = BigInt(value as bigint | boolean | string);
  } catch {
    throw new Error(`invalid value for INT64: ${value}`);
  }
  if (primitiveValue < -(2n ** 63n) || primitiveValue > 2n ** 63n - 1n) {
    throw new Error(`invalid value for INT64: ${value}`);
  }
  return primitiveValue;
}

function decimalToPrimitive_INT64(value: number, field: ParquetField) {
  const primitiveValue = value * 10 ** (field.scale || 0);
  const v = Math.round(((primitiveValue * 10 ** -field.presision!) % 1) * 10 ** field.presision!);
  if (Number.isNaN(v)) {
    throw new Error(`invalid value for INT64: ${value}`);
  }

  return v;
}

function toPrimitive_UINT64(value: unknown): bigint {
  const primitiveValue = BigInt(value as bigint | boolean | number | string);
  if (primitiveValue < 0n || primitiveValue > 2n ** 64n - 1n) {
    throw new Error(`invalid value for UINT64: ${value}`);
  }
  return BigInt.asIntN(64, primitiveValue);
}

function toPrimitive_INT96(value: any) {
  const v = parseInt(value, 10);
  if (Number.isNaN(v)) {
    throw new Error(`invalid value for INT96: ${value}`);
  }

  return v;
}

function toPrimitive_BYTE_ARRAY(value: any): Uint8Array {
  return typeof value === 'string' ? encodeUtf8(value) : toUint8Array(value);
}

function decimalToPrimitive_BYTE_ARRAY(value: unknown, field: ParquetField): Uint8Array {
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    const bytes = toUint8Array(value);
    if (field.typeLength !== undefined && bytes.byteLength !== field.typeLength) {
      throw new Error(
        `invalid DECIMAL byte width: expected ${field.typeLength}, received ${bytes.byteLength}`
      );
    }
    return bytes;
  }

  const unscaledValue = getUnscaledDecimalInteger(value, field.scale || 0);
  const precision = field.precision ?? field.presision;
  if (precision !== undefined && getDecimalDigitCount(unscaledValue) > precision) {
    throw new Error(`DECIMAL value ${value} exceeds precision ${precision}`);
  }
  const byteWidth = field.typeLength ?? getSignedBigIntByteWidth(unscaledValue);
  const bitWidth = BigInt(byteWidth * 8);
  const minimum = -(1n << (bitWidth - 1n));
  const maximum = (1n << (bitWidth - 1n)) - 1n;
  if (unscaledValue < minimum || unscaledValue > maximum) {
    throw new Error(`DECIMAL value ${value} does not fit in ${byteWidth} bytes`);
  }

  const bytes = new Uint8Array(byteWidth);
  let unsignedValue = BigInt.asUintN(byteWidth * 8, unscaledValue);
  for (let byteIndex = byteWidth - 1; byteIndex >= 0; byteIndex--) {
    bytes[byteIndex] = Number(unsignedValue & 0xffn);
    unsignedValue >>= 8n;
  }
  return bytes;
}

/** Converts a logical decimal value to its exact scaled integer. */
function getUnscaledDecimalInteger(value: unknown, scale: number): bigint {
  if (!Number.isInteger(scale) || scale < 0) {
    throw new Error(`invalid DECIMAL scale: ${scale}`);
  }
  if (typeof value === 'bigint') {
    return value * 10n ** BigInt(scale);
  }
  if (typeof value === 'number') {
    const scaledValue = Math.round(value * 10 ** scale);
    if (!Number.isFinite(value) || !Number.isSafeInteger(scaledValue)) {
      throw new Error(`DECIMAL number ${value} cannot be represented exactly; use a string`);
    }
    return BigInt(scaledValue);
  }
  if (typeof value !== 'string') {
    throw new Error(`invalid value for DECIMAL: ${value}`);
  }

  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(value.trim());
  if (!match) {
    throw new Error(`invalid value for DECIMAL: ${value}`);
  }
  const sign = match[1] === '-' ? -1n : 1n;
  const fraction = match[3] || '';
  let unscaledValue = BigInt(`${match[2]}${fraction}` || '0');
  const decimalShift = scale + Number(match[4] || 0) - fraction.length;
  if (decimalShift >= 0) {
    unscaledValue *= 10n ** BigInt(decimalShift);
  } else {
    const divisor = 10n ** BigInt(-decimalShift);
    if (unscaledValue % divisor !== 0n) {
      throw new Error(`DECIMAL value ${value} has more fractional digits than scale ${scale}`);
    }
    unscaledValue /= divisor;
  }
  return sign * unscaledValue;
}

/** Returns the number of base-10 digits in a signed integer, treating zero as one digit. */
function getDecimalDigitCount(value: bigint): number {
  return (value < 0n ? -value : value).toString().length;
}

/** Returns the smallest two's-complement byte width that can contain a signed integer. */
function getSignedBigIntByteWidth(value: bigint): number {
  let byteWidth = 1;
  while (value < -(1n << BigInt(byteWidth * 8 - 1)) || value >= 1n << BigInt(byteWidth * 8 - 1)) {
    byteWidth++;
  }
  return byteWidth;
}

function toPrimitive_UTF8(value: any): Uint8Array {
  return encodeUtf8(String(value));
}

function fromPrimitive_UTF8(value: any): string {
  return decodeUtf8(toUint8Array(value));
}

function toPrimitive_JSON(value: any): Uint8Array {
  return encodeUtf8(JSON.stringify(value));
}

function fromPrimitive_JSON(value: any): unknown {
  return JSON.parse(decodeUtf8(toUint8Array(value)));
}

function toPrimitive_BSON(value: any): Uint8Array {
  // @ts-ignore
  const arrayBuffer: ArrayBuffer = BSONWriter.encodeSync?.(value);
  return toUint8Array(arrayBuffer);
}

function fromPrimitive_BSON(value: any) {
  return parseBSONSync(toArrayBuffer(value));
}

function toPrimitive_TIME_MILLIS(value: any) {
  const v = parseInt(value, 10);
  if (v < 0 || v >= kMillisPerDay || Number.isNaN(v)) {
    throw new Error(`invalid value for TIME_MILLIS: ${value}`);
  }

  return v;
}

function toPrimitive_TIME_MICROS(value: unknown): bigint {
  const primitiveValue = BigInt(value as bigint | boolean | number | string);
  if (primitiveValue < 0n || primitiveValue >= 86_400_000_000n) {
    throw new Error(`invalid value for TIME_MICROS: ${value}`);
  }
  return primitiveValue;
}

function toPrimitive_TIME_NANOS(value: unknown): bigint {
  const primitiveValue = BigInt(value as bigint | boolean | number | string);
  if (primitiveValue < 0n || primitiveValue >= 86_400_000_000_000n) {
    throw new Error(`invalid value for TIME_NANOS: ${value}`);
  }
  return primitiveValue;
}

const kMillisPerDay = 86400000;

function toPrimitive_DATE(value: any): number {
  /* convert from date */
  if (value instanceof Date) {
    return value.getTime() / kMillisPerDay;
  }

  /* convert from integer */
  {
    const v = parseInt(value, 10);
    if (v < -0x80000000 || v > 0x7fffffff || Number.isNaN(v)) {
      throw new Error(`invalid value for DATE: ${value}`);
    }

    return v;
  }
}

function fromPrimitive_DATE(value: any): Date {
  return new Date(value * kMillisPerDay);
}

function toPrimitive_TIMESTAMP_MILLIS(value: any): number {
  /* convert from date */
  if (value instanceof Date) {
    return value.getTime();
  }

  /* convert from integer */
  {
    const v = parseInt(value, 10);
    if (!Number.isSafeInteger(v)) {
      throw new Error(`invalid value for TIMESTAMP_MILLIS: ${value}`);
    }

    return v;
  }
}

function fromPrimitive_TIMESTAMP_MILLIS(value: any): Date {
  return new Date(Number(value));
}

function toPrimitive_TIMESTAMP_MICROS(value: unknown): bigint {
  /* convert from date */
  if (value instanceof Date) {
    return BigInt(value.getTime()) * 1000n;
  }

  /* convert from integer */
  {
    let primitiveValue: bigint;
    try {
      primitiveValue = BigInt(value as bigint | boolean | number | string);
    } catch {
      throw new Error(`invalid value for TIMESTAMP_MICROS: ${value}`);
    }
    return primitiveValue;
  }
}

function fromPrimitive_TIMESTAMP_MICROS(value: any) {
  return new Date(Number(value) / 1000);
}

function toPrimitive_TIMESTAMP_NANOS(value: unknown): bigint {
  if (value instanceof Date) {
    return BigInt(value.getTime()) * 1_000_000n;
  }
  return BigInt(value as bigint | boolean | number | string);
}

function toPrimitive_INTERVAL(value: any) {
  if (!value.months || !value.days || !value.milliseconds) {
    throw new Error(
      'value for INTERVAL must be object { months: ..., days: ..., milliseconds: ... }'
    );
  }

  const buf = new Uint8Array(12);

  writeUInt32LE(buf, value.months, 0);
  writeUInt32LE(buf, value.days, 4);
  writeUInt32LE(buf, value.milliseconds, 8);
  return buf;
}

function fromPrimitive_INTERVAL(value: any) {
  const bytes = toUint8Array(value);
  const months = readUInt32LE(bytes, 0);
  const days = readUInt32LE(bytes, 4);
  const millis = readUInt32LE(bytes, 8);

  return {months, days, milliseconds: millis};
}

function decimalFromPrimitive_INT(value: any, field: ParquetField) {
  const numberValue = Number(value);
  const precision = field.precision ?? field.presision!;
  const precisionInt = Math.round(((numberValue * 10 ** -precision) % 1) * 10 ** precision);
  return precisionInt * 10 ** -(field.scale || 0);
}

function decimalFromPrimitive_BYTE_ARRAY(value: any, field: ParquetField) {
  const bytes = toUint8Array(value);
  let unscaledValue = 0n;
  for (const byte of bytes) unscaledValue = (unscaledValue << 8n) | BigInt(byte);
  if (bytes.length > 0 && (bytes[0] & 0x80) !== 0) unscaledValue -= 1n << BigInt(bytes.length * 8);
  return Number(unscaledValue) / 10 ** (field.scale || 0);
}
