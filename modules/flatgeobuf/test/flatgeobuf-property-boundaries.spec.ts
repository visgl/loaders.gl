// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Builder} from 'flatbuffers';
import {expect, test} from 'vitest';
import {
  FlatGeobufColumnType,
  FlatGeobufGeometryType,
  type FlatGeobufColumn,
  type FlatGeobufHeader,
  readFlatGeobufFeatures,
  readFlatGeobufHeader
} from '../src/lib/flatgeobuf-reader';

/** Builds a byte vector for a FlatGeobuf properties table. */
function createByteVector(builder: Builder, bytes: Uint8Array): number {
  builder.startVector(1, bytes.length, 1);
  for (let index = bytes.length - 1; index >= 0; index--) builder.addInt8(bytes[index]);
  return builder.endVector();
}

/** Builds a size-prefixed feature containing the supplied property bytes. */
function createFeature(properties?: Uint8Array): Uint8Array {
  const builder = new Builder(128);
  const vector = properties ? createByteVector(builder, properties) : 0;
  builder.startObject(2);
  if (vector) builder.addFieldOffset(1, vector, 0);
  const feature = builder.endObject();
  builder.finishSizePrefixed(feature);
  return builder.asUint8Array().slice();
}

/** Supplies metadata for decoding standalone feature tables. */
function createHeader(columns: FlatGeobufColumn[], featuresCount = 1): FlatGeobufHeader {
  return {
    geometryType: FlatGeobufGeometryType.Unknown,
    hasZ: false,
    columns,
    featuresCount,
    indexNodeSize: 0,
    headerLength: 0,
    featureOffset: 0
  };
}

/** Creates the default metadata for one property column. */
function createColumn(name: string, type: FlatGeobufColumnType): FlatGeobufColumn {
  return {
    name,
    type,
    width: -1,
    precision: -1,
    scale: -1,
    nullable: true,
    unique: false,
    primaryKey: false
  };
}

test('FlatGeobuf decodes every scalar property representation and advances between features', () => {
  const properties = new Uint8Array(256);
  const view = new DataView(properties.buffer);
  let offset = 0;
  const columns = [
    createColumn('signedByte', FlatGeobufColumnType.Byte),
    createColumn('unsignedByte', FlatGeobufColumnType.UByte),
    createColumn('flag', FlatGeobufColumnType.Bool),
    createColumn('signedShort', FlatGeobufColumnType.Short),
    createColumn('unsignedShort', FlatGeobufColumnType.UShort),
    createColumn('signedInteger', FlatGeobufColumnType.Int),
    createColumn('unsignedInteger', FlatGeobufColumnType.UInt),
    createColumn('signedLong', FlatGeobufColumnType.Long),
    createColumn('unsignedLong', FlatGeobufColumnType.ULong),
    createColumn('float', FlatGeobufColumnType.Float),
    createColumn('double', FlatGeobufColumnType.Double),
    createColumn('text', FlatGeobufColumnType.String),
    createColumn('json', FlatGeobufColumnType.Json),
    createColumn('date', FlatGeobufColumnType.DateTime),
    createColumn('binary', FlatGeobufColumnType.Binary)
  ];
  const widths = [1, 1, 1, 2, 2, 4, 4, 8, 8, 4, 8];
  const writeValues = [
    (position: number) => view.setInt8(position, -128),
    (position: number) => view.setUint8(position, 255),
    (position: number) => view.setUint8(position, 1),
    (position: number) => view.setInt16(position, -32768, true),
    (position: number) => view.setUint16(position, 65535, true),
    (position: number) => view.setInt32(position, -2147483648, true),
    (position: number) => view.setUint32(position, 4294967295, true),
    (position: number) => view.setBigInt64(position, -9007199254740993n, true),
    (position: number) => view.setBigUint64(position, 18446744073709551615n, true),
    (position: number) => view.setFloat32(position, -1.25, true),
    (position: number) => view.setFloat64(position, 3.125, true)
  ];
  for (let columnIndex = 0; columnIndex < writeValues.length; columnIndex++) {
    view.setUint16(offset, columnIndex, true);
    offset += 2;
    writeValues[columnIndex](offset);
    offset += widths[columnIndex];
  }
  const strings = ['caf\u00e9', '{"id":2}', '2020-01-02T03:04:05Z'];
  const variableValues = [
    ...strings.map(value => new TextEncoder().encode(value)),
    new Uint8Array([0, 255, 127])
  ];
  for (let columnIndex = 0; columnIndex < variableValues.length; columnIndex++) {
    const bytes = variableValues[columnIndex];
    view.setUint16(offset, 11 + columnIndex, true);
    view.setUint32(offset + 2, bytes.length, true);
    properties.set(bytes, offset + 6);
    offset += 6 + bytes.length;
  }
  const first = createFeature(properties.subarray(0, offset));
  const second = createFeature();
  const bytes = new Uint8Array(first.length + second.length);
  bytes.set(first);
  bytes.set(second, first.length);

  expect([...readFlatGeobufFeatures(bytes.buffer, createHeader(columns, 2))]).toEqual([
    {
      geometryOffset: undefined,
      properties: {
        signedByte: -128,
        unsignedByte: 255,
        flag: true,
        signedShort: -32768,
        unsignedShort: 65535,
        signedInteger: -2147483648,
        unsignedInteger: 4294967295,
        signedLong: -9007199254740993n,
        unsignedLong: 18446744073709551615n,
        float: -1.25,
        double: 3.125,
        text: 'caf\u00e9',
        json: '{"id":2}',
        date: '2020-01-02T03:04:05Z',
        binary: new Uint8Array([0, 255, 127])
      }
    },
    {geometryOffset: undefined, properties: {}}
  ]);
});

test.each([
  [new Uint8Array([1, 0, 7]), FlatGeobufColumnType.Byte, 'unknown column'],
  [new Uint8Array([0, 0, 7]), 99, 'Unsupported FlatGeobuf column type 99'],
  [new Uint8Array([0]), FlatGeobufColumnType.Byte, 'truncated'],
  [new Uint8Array([0, 0]), FlatGeobufColumnType.Byte, 'truncated'],
  [new Uint8Array([0, 0]), FlatGeobufColumnType.Double, 'truncated'],
  [new Uint8Array([0, 0, 1, 0, 0, 0]), FlatGeobufColumnType.String, 'truncated'],
  [new Uint8Array([0, 0, 255, 255, 255, 255]), FlatGeobufColumnType.String, 'truncated']
])('FlatGeobuf rejects invalid property payload %j', (properties, type, error) => {
  const bytes = createFeature(properties);
  expect(() => [
    ...readFlatGeobufFeatures(
      bytes.buffer as ArrayBuffer,
      createHeader([createColumn('value', type)])
    )
  ]).toThrow(error);
});

test('FlatGeobuf reads column constraints, CRS strings and explicit header flags', () => {
  const builder = new Builder(256);
  const name = builder.createString('count');
  const title = builder.createString('Count');
  const description = builder.createString('Number of items');
  builder.startObject(10);
  builder.addFieldOffset(0, name, 0);
  builder.addFieldInt8(1, FlatGeobufColumnType.Int, 0);
  builder.addFieldOffset(2, title, 0);
  builder.addFieldOffset(3, description, 0);
  builder.addFieldInt32(4, 8, -1);
  builder.addFieldInt32(5, 3, -1);
  builder.addFieldInt32(6, 2, -1);
  builder.addFieldInt8(7, 0, 1);
  builder.addFieldInt8(8, 1, 0);
  builder.addFieldInt8(9, 1, 0);
  const column = builder.endObject();
  builder.startVector(4, 1, 4);
  builder.addOffset(column);
  const columns = builder.endVector();
  const authority = builder.createString('EPSG');
  const codeString = builder.createString('EPSG:4326');
  const wkt = builder.createString('GEOGCRS["fixture"]');
  builder.startObject(6);
  builder.addFieldOffset(0, authority, 0);
  builder.addFieldInt32(1, 4326, 0);
  builder.addFieldOffset(4, wkt, 0);
  builder.addFieldOffset(5, codeString, 0);
  const crs = builder.endObject();
  builder.startObject(14);
  builder.addFieldInt8(2, FlatGeobufGeometryType.Point, 0);
  builder.addFieldInt8(3, 1, 0);
  builder.addFieldOffset(7, columns, 0);
  builder.addFieldInt64(8, 0n, 0n);
  builder.addFieldInt16(9, 0, 16);
  builder.addFieldOffset(10, crs, 0);
  const headerTable = builder.endObject();
  builder.finishSizePrefixed(headerTable);
  const headerBytes = builder.asUint8Array();
  const bytes = new Uint8Array(8 + headerBytes.length);
  bytes.set([0x66, 0x67, 0x62, 4, 0x66, 0x67, 0x62, 0]);
  bytes.set(headerBytes, 8);
  const header = readFlatGeobufHeader(bytes.buffer);
  expect(header.geometryType).toBe(FlatGeobufGeometryType.Point);
  expect(header.hasZ).toBe(true);
  expect(header.indexNodeSize).toBe(0);
  expect(header.featureOffset).toBe(bytes.length);
  expect(header.columns).toEqual([
    {
      name: 'count',
      type: FlatGeobufColumnType.Int,
      title: 'Count',
      description: 'Number of items',
      width: 8,
      precision: 3,
      scale: 2,
      nullable: false,
      unique: true,
      primaryKey: true
    }
  ]);
  expect(header.crs).toEqual({
    org: 'EPSG',
    code: 4326,
    codeString: 'EPSG:4326',
    wkt: 'GEOGCRS["fixture"]'
  });
});
