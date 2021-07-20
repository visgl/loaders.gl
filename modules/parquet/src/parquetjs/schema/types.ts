// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
/* eslint-disable camelcase */
import BSON from 'bson';
import {OriginalType, ParquetType, PrimitiveType} from './declare';
import {
  DataType,
  Bool,
  Float64,
  Int32,
  Float32,
  Binary,
  Utf8,
  Int64,
  Uint16,
  Uint32,
  Uint64,
  Int8,
  Int16
} from '@loaders.gl/schema';

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
  INTERVAL: {
    primitiveType: 'FIXED_LEN_BYTE_ARRAY',
    originalType: 'INTERVAL',
    typeLength: 12,
    toPrimitive: toPrimitive_INTERVAL,
    fromPrimitive: fromPrimitive_INTERVAL
  }
};

/**
 * Convert a value from it's native representation to the internal/underlying
 * primitive type
 */
export function toPrimitive(type: ParquetType, value: any) {
  if (!(type in PARQUET_LOGICAL_TYPES)) {
    throw new Error(`invalid type: ${type}`);
  }

  return PARQUET_LOGICAL_TYPES[type].toPrimitive(value);
}

/**
 * Convert a value from it's internal/underlying primitive representation to
 * the native representation
 */
export function fromPrimitive(type: ParquetType, value: any) {
  if (!(type in PARQUET_LOGICAL_TYPES)) {
    throw new Error(`invalid type: ${type}`);
  }

  if ('fromPrimitive' in PARQUET_LOGICAL_TYPES[type]) {
    return PARQUET_LOGICAL_TYPES[type].fromPrimitive?.(value);
    // tslint:disable-next-line:no-else-after-return
  }
  return value;
}

function toPrimitive_BOOLEAN(value: any) {
  return Boolean(value);
}

function fromPrimitive_BOOLEAN(value: any) {
  return Boolean(value);
}

function toPrimitive_FLOAT(value: any) {
  const v = parseFloat(value);
  if (isNaN(v)) {
    throw new Error(`invalid value for FLOAT: ${value}`);
  }

  return v;
}

function toPrimitive_DOUBLE(value: any) {
  const v = parseFloat(value);
  if (isNaN(v)) {
    throw new Error(`invalid value for DOUBLE: ${value}`);
  }

  return v;
}

function toPrimitive_INT8(value: any) {
  const v = parseInt(value, 10);
  if (v < -0x80 || v > 0x7f || isNaN(v)) {
    throw new Error(`invalid value for INT8: ${value}`);
  }

  return v;
}

function toPrimitive_UINT8(value: any) {
  const v = parseInt(value, 10);
  if (v < 0 || v > 0xff || isNaN(v)) {
    throw new Error(`invalid value for UINT8: ${value}`);
  }

  return v;
}

function toPrimitive_INT16(value: any) {
  const v = parseInt(value, 10);
  if (v < -0x8000 || v > 0x7fff || isNaN(v)) {
    throw new Error(`invalid value for INT16: ${value}`);
  }

  return v;
}

function toPrimitive_UINT16(value: any) {
  const v = parseInt(value, 10);
  if (v < 0 || v > 0xffff || isNaN(v)) {
    throw new Error(`invalid value for UINT16: ${value}`);
  }

  return v;
}

function toPrimitive_INT32(value: any) {
  const v = parseInt(value, 10);
  if (v < -0x80000000 || v > 0x7fffffff || isNaN(v)) {
    throw new Error(`invalid value for INT32: ${value}`);
  }

  return v;
}

function toPrimitive_UINT32(value: any) {
  const v = parseInt(value, 10);
  if (v < 0 || v > 0xffffffffffff || isNaN(v)) {
    throw new Error(`invalid value for UINT32: ${value}`);
  }

  return v;
}

function toPrimitive_INT64(value: any) {
  const v = parseInt(value, 10);
  if (isNaN(v)) {
    throw new Error(`invalid value for INT64: ${value}`);
  }

  return v;
}

function toPrimitive_UINT64(value: any) {
  const v = parseInt(value, 10);
  if (v < 0 || isNaN(v)) {
    throw new Error(`invalid value for UINT64: ${value}`);
  }

  return v;
}

function toPrimitive_INT96(value: any) {
  const v = parseInt(value, 10);
  if (isNaN(v)) {
    throw new Error(`invalid value for INT96: ${value}`);
  }

  return v;
}

function toPrimitive_BYTE_ARRAY(value: any) {
  return Buffer.from(value);
}

function toPrimitive_UTF8(value: any) {
  return Buffer.from(value, 'utf8');
}

function fromPrimitive_UTF8(value: any) {
  return value.toString();
}

function toPrimitive_JSON(value: any) {
  return Buffer.from(JSON.stringify(value));
}

function fromPrimitive_JSON(value: any) {
  return JSON.parse(value);
}

function toPrimitive_BSON(value: any) {
  return Buffer.from(BSON.serialize(value));
}

function fromPrimitive_BSON(value: any) {
  return BSON.deserialize(value);
}

function toPrimitive_TIME_MILLIS(value: any) {
  const v = parseInt(value, 10);
  if (v < 0 || v > 0xffffffffffffffff || isNaN(v)) {
    throw new Error(`invalid value for TIME_MILLIS: ${value}`);
  }

  return v;
}

function toPrimitive_TIME_MICROS(value: any) {
  const v = parseInt(value, 10);
  if (v < 0 || isNaN(v)) {
    throw new Error(`invalid value for TIME_MICROS: ${value}`);
  }

  return v;
}

const kMillisPerDay = 86400000;

function toPrimitive_DATE(value: any) {
  /* convert from date */
  if (value instanceof Date) {
    return value.getTime() / kMillisPerDay;
  }

  /* convert from integer */
  {
    const v = parseInt(value, 10);
    if (v < 0 || isNaN(v)) {
      throw new Error(`invalid value for DATE: ${value}`);
    }

    return v;
  }
}

function fromPrimitive_DATE(value: any) {
  return new Date(value * kMillisPerDay);
}

function toPrimitive_TIMESTAMP_MILLIS(value: any) {
  /* convert from date */
  if (value instanceof Date) {
    return value.getTime();
  }

  /* convert from integer */
  {
    const v = parseInt(value, 10);
    if (v < 0 || isNaN(v)) {
      throw new Error(`invalid value for TIMESTAMP_MILLIS: ${value}`);
    }

    return v;
  }
}

function fromPrimitive_TIMESTAMP_MILLIS(value: any) {
  return new Date(value);
}

function toPrimitive_TIMESTAMP_MICROS(value: any) {
  /* convert from date */
  if (value instanceof Date) {
    return value.getTime() * 1000;
  }

  /* convert from integer */
  {
    const v = parseInt(value, 10);
    if (v < 0 || isNaN(v)) {
      throw new Error(`invalid value for TIMESTAMP_MICROS: ${value}`);
    }

    return v;
  }
}

function fromPrimitive_TIMESTAMP_MICROS(value: any) {
  return new Date(value / 1000);
}

function toPrimitive_INTERVAL(value: any) {
  if (!value.months || !value.days || !value.milliseconds) {
    throw new Error(
      'value for INTERVAL must be object { months: ..., days: ..., milliseconds: ... }'
    );
  }

  const buf = Buffer.alloc(12);

  buf.writeUInt32LE(value.months, 0);
  buf.writeUInt32LE(value.days, 4);
  buf.writeUInt32LE(value.milliseconds, 8);
  return buf;
}

function fromPrimitive_INTERVAL(value: any) {
  const buf = Buffer.from(value);
  const months = buf.readUInt32LE(0);
  const days = buf.readUInt32LE(4);
  const millis = buf.readUInt32LE(8);

  return {months, days, milliseconds: millis};
}

export const PARQUET_TYPE_MAPPING: {[type in ParquetType]: typeof DataType} = {
  BOOLEAN: Bool,
  INT32: Int32,
  INT64: Float64,
  INT96: Float64,
  FLOAT: Float32,
  DOUBLE: Float64,
  BYTE_ARRAY: Binary,
  FIXED_LEN_BYTE_ARRAY: Binary,
  UTF8: Utf8,
  DATE: Int32,
  TIME_MILLIS: Int64,
  TIME_MICROS: Int64,
  TIMESTAMP_MILLIS: Int64,
  TIMESTAMP_MICROS: Int64,
  UINT_8: Int32,
  UINT_16: Uint16,
  UINT_32: Uint32,
  UINT_64: Uint64,
  INT_8: Int8,
  INT_16: Int16,
  INT_32: Int32,
  INT_64: Int64,
  JSON: Binary,
  BSON: Binary,
  // TODO check interal type
  INTERVAL: Binary
};
