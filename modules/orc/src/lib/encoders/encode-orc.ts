// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from '@loaders.gl/schema';
import type {WriterOptions} from '@loaders.gl/loader-utils';

/** ORC writer options. */
export type ORCWriterOptions = WriterOptions & {
  orc?: {
    /** ORC schema field definitions for empty tables without a loaders.gl schema. */
    schema?: {name: string; type: string}[];
    /** Maximum number of rows written to one stripe. Defaults to all rows. */
    stripeSize?: number;
  };
};

const ORC_MAGIC = new Uint8Array([0x4f, 0x52, 0x43]);
const ORC_TYPE = {
  BOOLEAN: 0,
  BYTE: 1,
  SHORT: 2,
  INT: 3,
  LONG: 4,
  FLOAT: 5,
  DOUBLE: 6,
  STRING: 7,
  BINARY: 8,
  DATE: 15,
  STRUCT: 12
} as const;

/** Encodes one uncompressed ORC stripe containing primitive, non-null columns. */
export function encodeORC(table: Table, options?: ORCWriterOptions): ArrayBuffer {
  const fields = getFields(table, options);
  const rows = getRows(table, fields);
  const normalizedFields = fields.map((field, index) =>
    field.type.startsWith('Struct<') && rows.some(row => row[index] instanceof Uint8Array)
      ? {...field, type: 'binary'}
      : field
  );
  if (rows.length === 0) return encodeEmptyORC(normalizedFields);
  const stripeSize = options?.orc?.stripeSize ?? rows.length;
  if (!Number.isInteger(stripeSize) || stripeSize <= 0)
    throw new Error('ORC stripeSize must be a positive integer');
  const stripePayloads: Uint8Array[] = [];
  const stripeInformations: Uint8Array[] = [];
  let stripeOffset = 3;
  for (let start = 0; start < rows.length; start += stripeSize) {
    const stripeRows = rows.slice(start, start + stripeSize);
    const encodedColumns = normalizedFields.map((field, index) =>
      encodeColumn(
        field.type,
        stripeRows.map(row => row[index])
      )
    );
    const streamBytes = concat(
      encodedColumns.flatMap(column => column.streams.map(stream => stream.bytes))
    );
    const stripeFooter = encodeStripeFooter(encodedColumns, fields.length);
    stripePayloads.push(concat([streamBytes, stripeFooter]));
    stripeInformations.push(
      encodeStripeInformation(
        stripeOffset,
        0,
        streamBytes.length,
        stripeFooter.length,
        stripeRows.length
      )
    );
    stripeOffset += streamBytes.length + stripeFooter.length;
  }
  const types = encodeTypes(normalizedFields);
  const footer = encodeFooter(stripeInformations, types, rows.length);
  return encodeFile(concat(stripePayloads), footer);
}

type ORCField = {name: string; type: string};
type EncodedStream = {kind: number; column: number; bytes: Uint8Array};
type EncodedColumn = {
  typeKind: number;
  streams: EncodedStream[];
  encodingKind?: number;
  dictionarySize?: number;
};

function getFields(table: Table, options?: ORCWriterOptions): ORCField[] {
  const tableFields =
    table.shape === 'arrow-table' ? table.data.schema.fields : table.schema?.fields;
  return (
    options?.orc?.schema ||
    tableFields?.map(field => ({name: field.name, type: String(field.type)})) ||
    []
  );
}

function getRows(table: Table, fields: ORCField[]): unknown[][] {
  if (table.shape === 'arrow-table') {
    return table.data
      .toArray()
      .map(row => fields.map(field => (row as Record<string, unknown>)[field.name]));
  }
  if (table.shape === 'columnar-table') {
    return Array.from(
      {length: fields.length ? table.data[fields[0].name]?.length || 0 : 0},
      (_, index) => fields.map(field => table.data[field.name]?.[index])
    );
  }
  if (table.shape === 'object-row-table')
    return table.data.map(row => fields.map(field => row[field.name]));
  throw new Error('ORCWriter supports Arrow, columnar, and object-row tables');
}

function encodeColumn(type: string, values: unknown[]): EncodedColumn {
  const typeKind = getORCKind(type);
  const nonNullValues = values.filter(value => value !== null && value !== undefined);
  const addPresentStream = (streams: EncodedStream[]): EncodedStream[] =>
    nonNullValues.length === values.length
      ? streams
      : [
          {
            kind: 0,
            column: 0,
            bytes: encodePresence(values)
          },
          ...streams
        ];
  if (nonNullValues.length === 0) return {typeKind, streams: addPresentStream([])};
  if (typeKind === ORC_TYPE.STRING || typeKind === ORC_TYPE.BINARY) {
    const data: Uint8Array[] = [];
    const lengths: number[] = [];
    for (const value of nonNullValues) {
      const bytes =
        value instanceof Uint8Array ? value : new TextEncoder().encode(String(value ?? ''));
      data.push(bytes);
      lengths.push(bytes.length);
    }
    if (typeKind === ORC_TYPE.STRING || typeKind === ORC_TYPE.BINARY) {
      const dictionaryValues = new Map<string, Uint8Array>();
      for (const value of nonNullValues) {
        const encodedValue =
          value instanceof Uint8Array ? value : new TextEncoder().encode(String(value ?? ''));
        dictionaryValues.set(getBinaryKey(encodedValue), encodedValue);
      }
      const dictionary = [...dictionaryValues.values()];
      if (dictionary.length < nonNullValues.length) {
        const dictionaryIndexes = new Map(
          dictionary.map((value, index) => [getBinaryKey(value), index])
        );
        return {
          typeKind,
          encodingKind: 3,
          dictionarySize: dictionary.length,
          streams: addPresentStream([
            {
              kind: 1,
              column: 0,
              bytes: encodeRLEv2(
                nonNullValues.map(value => {
                  const encodedValue =
                    value instanceof Uint8Array
                      ? value
                      : new TextEncoder().encode(String(value ?? ''));
                  return dictionaryIndexes.get(getBinaryKey(encodedValue)) || 0;
                }),
                false
              )
            },
            {
              kind: 2,
              column: 0,
              bytes: encodeRLEv2(
                dictionary.map(value => value.length),
                false
              )
            },
            {kind: 3, column: 0, bytes: concat(dictionary)}
          ])
        };
      }
    }
    return {
      typeKind,
      streams: addPresentStream([
        {kind: 1, column: 0, bytes: concat(data)},
        {kind: 2, column: 0, bytes: encodeRLEv2(lengths, false)}
      ])
    };
  }
  if (typeKind === ORC_TYPE.FLOAT || typeKind === ORC_TYPE.DOUBLE) {
    const width = typeKind === ORC_TYPE.FLOAT ? 4 : 8;
    const bytes = new Uint8Array(nonNullValues.length * width);
    const view = new DataView(bytes.buffer);
    nonNullValues.forEach((value, index) =>
      width === 4
        ? view.setFloat32(index * width, Number(value), true)
        : view.setFloat64(index * width, Number(value), true)
    );
    return {
      typeKind,
      streams: addPresentStream([{kind: 1, column: 0, bytes: encodeByteRLE(bytes)}])
    };
  }
  if (typeKind === ORC_TYPE.BOOLEAN) {
    const bytes = new Uint8Array(Math.ceil(nonNullValues.length / 8));
    nonNullValues.forEach((value, index) => {
      if (value) bytes[index >> 3] |= 0x80 >> (index & 7);
    });
    return {typeKind, streams: addPresentStream([{kind: 1, column: 0, bytes}])};
  }
  return {
    typeKind,
    streams: addPresentStream([
      {kind: 1, column: 0, bytes: encodeRLEv2(nonNullValues.map(value => Number(value) || 0))}
    ])
  };
}

/** Returns a stable key for a binary dictionary entry. */
function getBinaryKey(bytes: Uint8Array): string {
  let key = '';
  for (const byte of bytes) key += byte.toString(16).padStart(2, '0');
  return key;
}

/** Encodes the ORC PRESENT bitset, where one marks a non-null value. */
function encodePresence(values: unknown[]): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(values.length / 8));
  values.forEach((value, index) => {
    if (value !== null && value !== undefined) bytes[index >> 3] |= 0x80 >> (index & 7);
  });
  return encodeByteRLE(bytes);
}

function encodeRLEv2(values: number[], signed = true): Uint8Array {
  const runs: Uint8Array[] = [];
  for (let offset = 0; offset < values.length; offset += 512)
    runs.push(encodeRLEv2Run(values.slice(offset, offset + 512), signed));
  return concat(runs);
}

function encodeRLEv2Run(values: number[], signed: boolean): Uint8Array {
  if (values.length === 0) return new Uint8Array(0);
  const bitWidth = Math.max(1, ...values.map(value => bitLength(signed ? zigzag(value) : value)));
  const widthCode = [
    1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, 26, 28, 30, 32, 40, 48, 56, 64
  ].findIndex(width => width >= bitWidth);
  const width = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, 26, 28, 30, 32, 40, 48, 56, 64][
    widthCode
  ];
  const valueCount = values.length - 1;
  const output = [0x40 | (widthCode << 1) | ((valueCount >> 8) & 1), valueCount & 0xff];
  let accumulator = 0;
  let bits = 0;
  for (const value of values) {
    accumulator = accumulator * 2 ** width + (signed ? zigzag(value) : value);
    bits += width;
    while (bits >= 8) {
      bits -= 8;
      output.push(Math.floor(accumulator / 2 ** bits) & 0xff);
      accumulator %= 2 ** bits;
    }
  }
  if (bits > 0) output.push((accumulator * 2 ** (8 - bits)) & 0xff);
  return Uint8Array.from(output);
}

function encodeByteRLE(bytes: Uint8Array): Uint8Array {
  const output: number[] = [];
  for (let offset = 0; offset < bytes.length; offset += 128) {
    const length = Math.min(128, bytes.length - offset);
    output.push(256 - length);
    output.push(...bytes.subarray(offset, offset + length));
  }
  return Uint8Array.from(output);
}

function zigzag(value: number): number {
  return value < 0 ? -value * 2 - 1 : value * 2;
}

function bitLength(value: number): number {
  return value === 0 ? 1 : 32 - Math.clz32(value);
}

function encodeStripeFooter(columns: EncodedColumn[], fieldCount: number): Uint8Array {
  const fields: Array<[number, Uint8Array]> = [];
  for (const [index, column] of columns.entries()) {
    for (const stream of column.streams)
      fields.push([1, encodeStream(stream.kind, index + 1, stream.bytes.length)]);
  }
  for (let index = 0; index <= fieldCount; index++)
    fields.push([2, encodeColumnEncoding(index === 0 ? undefined : columns[index - 1])]);
  return encodeMessages(fields);
}

function encodeStream(kind: number, column: number, length: number): Uint8Array {
  return encodeMessages([
    [1, kind],
    [2, column],
    [3, length]
  ]);
}

function encodeColumnEncoding(column?: EncodedColumn): Uint8Array {
  const fields: Array<[number, number]> = [[1, column?.encodingKind ?? 2]];
  if (column?.dictionarySize) fields.push([2, column.dictionarySize]);
  return encodeMessages(fields);
}

function encodeStripeInformation(
  offset: number,
  indexLength: number,
  dataLength: number,
  footerLength: number,
  rows: number
): Uint8Array {
  return encodeMessages([
    [1, offset],
    [2, indexLength],
    [3, dataLength],
    [4, footerLength],
    [5, rows]
  ]);
}

function encodeTypes(fields: ORCField[]): Uint8Array[] {
  const rootFields: Array<[number, number | Uint8Array]> = [
    [1, ORC_TYPE.STRUCT],
    ...fields.map((_field, index) => [2, index + 1] as [number, number]),
    ...fields.map(field => [3, new TextEncoder().encode(field.name)] as [number, Uint8Array])
  ];
  return [
    encodeMessages(rootFields),
    ...fields.map(field => encodeMessages([[1, getORCKind(field.type)]]))
  ];
}

function encodeFooter(stripes: Uint8Array[], types: Uint8Array[], rows: number): Uint8Array {
  return encodeMessages([
    ...stripes.map(stripe => [3, stripe] as [number, Uint8Array]),
    ...types.map(type => [4, type] as [number, Uint8Array]),
    [6, rows]
  ]);
}

function encodeEmptyORC(fields: ORCField[]): ArrayBuffer {
  return encodeFile(new Uint8Array(0), encodeFooter([], encodeTypes(fields), 0));
}

function encodeFile(data: Uint8Array, footer: Uint8Array): ArrayBuffer {
  const postscript = encodeMessages([
    [1, footer.length],
    [2, 0],
    [3, 262_144],
    [4, 0],
    [4, 12],
    [8000, new TextEncoder().encode('ORC')]
  ]);
  const output = new Uint8Array(3 + data.length + footer.length + postscript.length + 1);
  output.set(ORC_MAGIC);
  output.set(data, 3);
  output.set(footer, 3 + data.length);
  output.set(postscript, 3 + data.length + footer.length);
  output[output.length - 1] = postscript.length;
  return output.buffer;
}

function getORCKind(type: string): number {
  const normalizedType = type.toLowerCase();
  if (normalizedType.includes('utf8') || normalizedType.includes('string')) return ORC_TYPE.STRING;
  if (normalizedType.includes('binary')) return ORC_TYPE.BINARY;
  switch (normalizedType) {
    case 'bool':
    case 'boolean':
      return ORC_TYPE.BOOLEAN;
    case 'int8':
    case 'uint8':
    case 'byte':
      return ORC_TYPE.BYTE;
    case 'int16':
    case 'uint16':
    case 'short':
      return ORC_TYPE.SHORT;
    case 'int32':
    case 'uint32':
    case 'int':
      return ORC_TYPE.INT;
    case 'int64':
    case 'uint64':
    case 'long':
      return ORC_TYPE.LONG;
    case 'float32':
    case 'float':
      return ORC_TYPE.FLOAT;
    case 'float64':
    case 'double':
      return ORC_TYPE.DOUBLE;
    case 'binary':
      return ORC_TYPE.BINARY;
    case 'string':
    case 'utf8':
      return ORC_TYPE.STRING;
    case 'date':
    case 'date-day':
      return ORC_TYPE.DATE;
    default:
      throw new Error(`Unsupported ORC writer type ${type}`);
  }
}

function encodeMessages(fields: Array<[number, number | Uint8Array]>): Uint8Array {
  const output: number[] = [];
  for (const [fieldNumber, value] of fields) {
    if (typeof value === 'number')
      output.push(...encodeVarint(fieldNumber * 8), ...encodeVarint(value));
    else output.push(...encodeVarint(fieldNumber * 8 + 2), ...encodeVarint(value.length), ...value);
  }
  return Uint8Array.from(output);
}

function encodeVarint(value: number): Uint8Array {
  const output: number[] = [];
  while (value > 0x7f) {
    output.push((value & 0x7f) | 0x80);
    value = Math.floor(value / 128);
  }
  output.push(value);
  return Uint8Array.from(output);
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}
