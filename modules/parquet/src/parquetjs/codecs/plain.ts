// Forked from https://github.com/ironSource/parquetjs under MIT license

/* eslint-disable camelcase */
const INT53 = require('int53');
// import parquet_thrift from '../../../libs/parquet-types';

export function encodeValues(type, values, opts?) {
  switch (type) {
    case 'BOOLEAN':
      return encodeValuesBOOLEAN(values);

    case 'INT32':
      return encodeValuesINT32(values);

    case 'INT64':
      return encodeValuesINT64(values);

    case 'INT96':
      return encodeValuesINT96(values);

    case 'FLOAT':
      return encodeValuesFLOAT(values);

    case 'DOUBLE':
      return encodeValuesDOUBLE(values);

    case 'BYTE_ARRAY':
      return encodeValuesBYTE_ARRAY(values);

    case 'FIXED_LEN_BYTE_ARRAY':
      return encodeValuesFIXED_LEN_BYTE_ARRAY(values, opts);

    default:
      throw new Error(`unsupported type: ${type}`);
  }
}

export function decodeValues(type, cursor, count, opts) {
  switch (type) {
    case 'BOOLEAN':
      return decodeValuesBOOLEAN(cursor, count);

    case 'INT32':
      return decodeValuesINT32(cursor, count);

    case 'INT64':
      return decodeValuesINT64(cursor, count);

    case 'INT96':
      return decodeValuesINT96(cursor, count);

    case 'FLOAT':
      return decodeValuesFLOAT(cursor, count);

    case 'DOUBLE':
      return decodeValuesDOUBLE(cursor, count);

    case 'BYTE_ARRAY':
      return decodeValuesBYTE_ARRAY(cursor, count);

    case 'FIXED_LEN_BYTE_ARRAY':
      return decodeValuesFIXED_LEN_BYTE_ARRAY(cursor, count, opts);

    default:
      throw new Error(`unsupported type: ${type}`);
  }
}

function encodeValuesBOOLEAN(values) {
  const buf = new Buffer(Math.ceil(values.length / 8));
  buf.fill(0);

  for (let i = 0; i < values.length; ++i) {
    if (values[i]) {
      buf[Math.floor(i / 8)] |= 1 << i % 8;
    }
  }

  return buf;
}

function decodeValuesBOOLEAN(cursor, count: number): any[] {
  const values: any[] = [];

  for (let i = 0; i < count; ++i) {
    const b = cursor.buffer[cursor.offset + Math.floor(i / 8)];
    values.push((b & (1 << i % 8)) > 0);
  }

  cursor.offset += Math.ceil(count / 8);
  return values;
}

function encodeValuesINT32(values) {
  const buf = new Buffer(4 * values.length);
  for (let i = 0; i < values.length; i++) {
    buf.writeInt32LE(values[i], i * 4);
  }

  return buf;
}

function decodeValuesINT32(cursor, count: number): number[] {
  const values: number[] = [];

  for (let i = 0; i < count; ++i) {
    values.push(cursor.buffer.readInt32LE(cursor.offset));
    cursor.offset += 4;
  }

  return values;
}

function encodeValuesINT64(values) {
  const buf = new Buffer(8 * values.length);
  for (let i = 0; i < values.length; i++) {
    INT53.writeInt64LE(values[i], buf, i * 8);
  }

  return buf;
}

function decodeValuesINT64(cursor, count: number): number[] {
  const values: number[] = [];

  for (let i = 0; i < count; ++i) {
    values.push(INT53.readInt64LE(cursor.buffer, cursor.offset));
    cursor.offset += 8;
  }

  return values;
}

function encodeValuesINT96(values: number[]): Buffer {
  const buf = new Buffer(12 * values.length);

  for (let i = 0; i < values.length; i++) {
    if (values[i] >= 0) {
      INT53.writeInt64LE(values[i], buf, i * 12);
      buf.writeUInt32LE(0, i * 12 + 8); // truncate to 64 actual precision
    } else {
      INT53.writeInt64LE(~-values[i] + 1, buf, i * 12);
      buf.writeUInt32LE(0xffffffff, i * 12 + 8); // truncate to 64 actual precision
    }
  }

  return buf;
}

function decodeValuesINT96(cursor, count: number): number[] {
  const values: number[] = [];

  for (let i = 0; i < count; ++i) {
    const low = INT53.readInt64LE(cursor.buffer, cursor.offset);
    const high = cursor.buffer.readUInt32LE(cursor.offset + 8);

    if (high === 0xffffffff) {
      values.push(~-low + 1); // truncate to 64 actual precision
    } else {
      values.push(low); // truncate to 64 actual precision
    }

    cursor.offset += 12;
  }

  return values;
}

function encodeValuesFLOAT(values) {
  const buf = new Buffer(4 * values.length);
  for (let i = 0; i < values.length; i++) {
    buf.writeFloatLE(values[i], i * 4);
  }

  return buf;
}

function decodeValuesFLOAT(cursor, count) {
  const values: number[] = [];

  for (let i = 0; i < count; ++i) {
    values.push(cursor.buffer.readFloatLE(cursor.offset));
    cursor.offset += 4;
  }

  return values;
}

function encodeValuesDOUBLE(values) {
  const buf = new Buffer(8 * values.length);
  for (let i = 0; i < values.length; i++) {
    buf.writeDoubleLE(values[i], i * 8);
  }

  return buf;
}

function decodeValuesDOUBLE(cursor, count: number): number[] {
  const values: number[] = [];

  for (let i = 0; i < count; ++i) {
    values.push(cursor.buffer.readDoubleLE(cursor.offset));
    cursor.offset += 8;
  }

  return values;
}

function encodeValuesBYTE_ARRAY(values) {
  let bufferLength = 0;
  for (let i = 0; i < values.length; i++) {
    values[i] = Buffer.from(values[i]);
    bufferLength += 4 + values[i].length;
  }

  const buf = Buffer.alloc(bufferLength);
  let bufferPosition = 0;
  for (let i = 0; i < values.length; i++) {
    buf.writeUInt32LE(values[i].length, bufferPosition);
    values[i].copy(buf, bufferPosition + 4);
    bufferPosition += 4 + values[i].length;
  }

  return buf;
}

function decodeValuesBYTE_ARRAY(cursor, count): number[] {
  const values: number[] = [];

  for (let i = 0; i < count; ++i) {
    const len = cursor.buffer.readUInt32LE(cursor.offset);
    cursor.offset += 4;
    values.push(cursor.buffer.slice(cursor.offset, cursor.offset + len));
    cursor.offset += len;
  }

  return values;
}

function encodeValuesFIXED_LEN_BYTE_ARRAY(values, opts: {typeLength: number}): Buffer {
  if (!opts.typeLength) {
    throw new Error('missing option: typeLength (required for FIXED_LEN_BYTE_ARRAY)');
  }

  for (let i = 0; i < values.length; i++) {
    values[i] = Buffer.from(values[i]);

    if (values[i].length !== opts.typeLength) {
      throw new Error(`invalid value for FIXED_LEN_BYTE_ARRAY: ${values[i]}`);
    }
  }

  return Buffer.concat(values);
}

function decodeValuesFIXED_LEN_BYTE_ARRAY(
  cursor,
  count: number,
  opts: {typeLength: number}
): number[] {
  const values: number[] = [];

  if (!opts.typeLength) {
    throw new Error('missing option: typeLength (required for FIXED_LEN_BYTE_ARRAY)');
  }

  for (let i = 0; i < count; ++i) {
    values.push(cursor.buffer.slice(cursor.offset, cursor.offset + opts.typeLength));
    cursor.offset += opts.typeLength;
  }

  return values;
}
