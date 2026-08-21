// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** The FlatGeobuf file signature has a stable prefix and a version byte. */
const MAGIC_PREFIX = [0x66, 0x67, 0x62];
const MAGIC_SIZE = 8;
const SIZE_PREFIX_SIZE = 4;

/** FlatGeobuf column types defined by the public file-format specification. */
export enum FlatGeobufColumnType {
  Byte,
  UByte,
  Bool,
  Short,
  UShort,
  Int,
  UInt,
  Long,
  ULong,
  Float,
  Double,
  String,
  Json,
  DateTime,
  Binary
}

/** Geometry types defined by the FlatGeobuf file-format specification. */
export enum FlatGeobufGeometryType {
  Unknown,
  Point,
  LineString,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon,
  GeometryCollection
}

/** Parsed FlatGeobuf property metadata. */
export type FlatGeobufColumn = {
  name: string;
  type: FlatGeobufColumnType;
  title?: string;
  description?: string;
  width: number;
  precision: number;
  scale: number;
  nullable: boolean;
  unique: boolean;
  primaryKey: boolean;
};

/** Parsed FlatGeobuf dataset metadata. */
export type FlatGeobufHeader = {
  envelope?: Float64Array;
  geometryType: FlatGeobufGeometryType;
  hasZ: boolean;
  columns: FlatGeobufColumn[];
  featuresCount: number;
  indexNodeSize: number;
  crs?: {code?: number; codeString?: string; wkt?: string};
  title?: string;
  description?: string;
  metadata?: string;
  headerLength: number;
  featureOffset: number;
};

/** One decoded feature represented by its scalar properties and geometry table offset. */
export type FlatGeobufFeature = {
  properties: Record<string, unknown>;
  geometryOffset?: number;
};

/** Reads FlatBuffers primitives with explicit bounds checks. */
class FlatBufferView {
  readonly data: DataView;
  readonly bytes: Uint8Array;

  constructor(arrayBuffer: ArrayBuffer) {
    this.data = new DataView(arrayBuffer);
    this.bytes = new Uint8Array(arrayBuffer);
  }

  assertRange(offset: number, length: number): void {
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(length) ||
      offset < 0 ||
      length < 0 ||
      offset + length > this.data.byteLength
    ) {
      throw new Error('Invalid or truncated FlatGeobuf buffer');
    }
  }

  uint8(offset: number): number {
    this.assertRange(offset, 1);
    return this.data.getUint8(offset);
  }
  int8(offset: number): number {
    this.assertRange(offset, 1);
    return this.data.getInt8(offset);
  }
  uint16(offset: number): number {
    this.assertRange(offset, 2);
    return this.data.getUint16(offset, true);
  }
  int16(offset: number): number {
    this.assertRange(offset, 2);
    return this.data.getInt16(offset, true);
  }
  uint32(offset: number): number {
    this.assertRange(offset, 4);
    return this.data.getUint32(offset, true);
  }
  int32(offset: number): number {
    this.assertRange(offset, 4);
    return this.data.getInt32(offset, true);
  }
  float32(offset: number): number {
    this.assertRange(offset, 4);
    return this.data.getFloat32(offset, true);
  }
  float64(offset: number): number {
    this.assertRange(offset, 8);
    return this.data.getFloat64(offset, true);
  }
  uint64(offset: number): bigint {
    this.assertRange(offset, 8);
    return this.data.getBigUint64(offset, true);
  }
  int64(offset: number): bigint {
    this.assertRange(offset, 8);
    return this.data.getBigInt64(offset, true);
  }

  tableField(tableOffset: number, fieldIndex: number): number | undefined {
    this.assertRange(tableOffset, 4);
    const vtableOffset = tableOffset - this.int32(tableOffset);
    this.assertRange(vtableOffset, 4);
    const vtableSize = this.uint16(vtableOffset);
    const fieldOffset = vtableOffset + 4 + fieldIndex * 2;
    if (fieldOffset + 2 > vtableOffset + vtableSize) return undefined;
    const relativeOffset = this.uint16(fieldOffset);
    return relativeOffset ? tableOffset + relativeOffset : undefined;
  }

  indirect(offset: number): number {
    const target = offset + this.uint32(offset);
    this.assertRange(target, 4);
    return target;
  }

  vector(fieldOffset: number): {offset: number; length: number} {
    const vectorOffset = this.indirect(fieldOffset);
    const length = this.uint32(vectorOffset);
    const offset = vectorOffset + 4;
    this.assertRange(offset, 0);
    return {offset, length};
  }

  string(fieldOffset: number | undefined): string | undefined {
    if (fieldOffset === undefined) return undefined;
    const {offset, length} = this.vector(fieldOffset);
    this.assertRange(offset, length);
    return new TextDecoder().decode(this.bytes.subarray(offset, offset + length));
  }

  sizePrefixedTable(offset: number): number {
    const length = this.uint32(offset);
    this.assertRange(offset + SIZE_PREFIX_SIZE, length);
    return offset + SIZE_PREFIX_SIZE + this.int32(offset + SIZE_PREFIX_SIZE);
  }
}

/** Parses and validates the FlatGeobuf header. */
export function readFlatGeobufHeader(arrayBuffer: ArrayBuffer): FlatGeobufHeader {
  const view = new FlatBufferView(arrayBuffer);
  view.assertRange(0, MAGIC_SIZE + SIZE_PREFIX_SIZE);
  for (let index = 0; index < MAGIC_PREFIX.length; index++) {
    if (view.uint8(index) !== MAGIC_PREFIX[index]) throw new Error('Not a FlatGeobuf file');
  }
  const majorVersion = view.uint8(3);
  if (majorVersion !== 3 && majorVersion !== 4)
    throw new Error(`Unsupported FlatGeobuf version ${majorVersion}`);
  const headerLength = view.uint32(MAGIC_SIZE);
  const headerTable = view.sizePrefixedTable(MAGIC_SIZE);
  const envelope = readFloat64Vector(view, view.tableField(headerTable, 1));
  const columns = readColumns(view, view.tableField(headerTable, 7));
  const featuresCountField = view.tableField(headerTable, 8);
  const featuresCount =
    featuresCountField === undefined ? 0 : toSafeNumber(view.uint64(featuresCountField));
  const indexNodeSizeField = view.tableField(headerTable, 9);
  const indexNodeSize = indexNodeSizeField === undefined ? 16 : view.uint16(indexNodeSizeField);
  const crsField = view.tableField(headerTable, 10);
  const crs = crsField === undefined ? undefined : readCrs(view, view.indirect(crsField));
  const featureOffset =
    MAGIC_SIZE + SIZE_PREFIX_SIZE + headerLength + getIndexSize(featuresCount, indexNodeSize);
  view.assertRange(featureOffset, 0);
  return {
    envelope,
    geometryType: (view.tableField(headerTable, 2) === undefined
      ? 0
      : view.uint8(view.tableField(headerTable, 2)!)) as FlatGeobufGeometryType,
    hasZ: Boolean(
      view.tableField(headerTable, 3) === undefined
        ? 0
        : view.int8(view.tableField(headerTable, 3)!)
    ),
    columns,
    featuresCount,
    indexNodeSize,
    crs,
    title: view.string(view.tableField(headerTable, 11)),
    description: view.string(view.tableField(headerTable, 12)),
    metadata: view.string(view.tableField(headerTable, 13)),
    headerLength,
    featureOffset
  };
}

/** Iterates the contiguous feature section without allocating FlatBuffers wrapper objects. */
export function* readFlatGeobufFeatures(
  arrayBuffer: ArrayBuffer,
  header: FlatGeobufHeader
): Generator<FlatGeobufFeature> {
  const view = new FlatBufferView(arrayBuffer);
  let offset = header.featureOffset;
  for (let featureIndex = 0; featureIndex < header.featuresCount; featureIndex++) {
    const length = view.uint32(offset);
    const featureOffset = view.sizePrefixedTable(offset);
    const geometryField = view.tableField(featureOffset, 0);
    const propertiesField = view.tableField(featureOffset, 1);
    yield {
      properties:
        propertiesField === undefined
          ? {}
          : readProperties(view, view.vector(propertiesField), header.columns),
      geometryOffset: geometryField === undefined ? undefined : view.indirect(geometryField)
    };
    offset += SIZE_PREFIX_SIZE + length;
  }
}

/** Writes one FlatGeobuf geometry into a GeoArrow builder without an intermediate GeoJSON object. */
export function writeFlatGeobufGeometry(
  builder: import('@loaders.gl/gis').GeoArrowBuilder,
  arrayBuffer: ArrayBuffer,
  geometryOffset: number | undefined,
  header: FlatGeobufHeader
): void {
  if (geometryOffset === undefined) {
    builder.writeNullGeometry();
    return;
  }
  const view = new FlatBufferView(arrayBuffer);
  const xy = readFloat64Vector(view, view.tableField(geometryOffset, 1)) || new Float64Array();
  const z = readFloat64Vector(view, view.tableField(geometryOffset, 2));
  const ends = readUint32Vector(view, view.tableField(geometryOffset, 0));
  const typeField = view.tableField(geometryOffset, 6);
  const type = ((typeField === undefined ? 0 : view.uint8(typeField)) ||
    header.geometryType) as FlatGeobufGeometryType;
  const writeCoordinates = (start: number, end: number) => {
    for (let index = start; index < end; index++)
      builder.writeCoordinate(xy[index * 2], xy[index * 2 + 1], z?.[index]);
  };
  const pointCount = xy.length / 2;
  switch (type) {
    case FlatGeobufGeometryType.Point:
      builder.beginPoint();
      writeCoordinates(0, pointCount);
      return;
    case FlatGeobufGeometryType.MultiPoint:
      builder.beginMultiPoint(pointCount);
      writeCoordinates(0, pointCount);
      return;
    case FlatGeobufGeometryType.LineString:
      builder.beginLineString(pointCount);
      writeCoordinates(0, pointCount);
      return;
    case FlatGeobufGeometryType.MultiLineString: {
      const lineEnds = ends || new Uint32Array([pointCount]);
      builder.beginMultiLineString(lineEnds.length);
      let start = 0;
      for (const end of lineEnds) {
        builder.beginLineString(end - start);
        writeCoordinates(start, end);
        start = end;
      }
      return;
    }
    case FlatGeobufGeometryType.Polygon: {
      const ringEnds = ends || new Uint32Array([pointCount]);
      builder.beginPolygon(ringEnds.length);
      let start = 0;
      for (const end of ringEnds) {
        builder.beginLinearRing(end - start);
        writeCoordinates(start, end);
        start = end;
      }
      return;
    }
    case FlatGeobufGeometryType.MultiPolygon: {
      const partsField = view.tableField(geometryOffset, 7);
      if (partsField === undefined) throw new Error('FlatGeobuf multipolygon has no polygon parts');
      const parts = view.vector(partsField);
      builder.beginMultiPolygon(parts.length);
      for (let index = 0; index < parts.length; index++) {
        writeFlatGeobufGeometry(builder, arrayBuffer, view.indirect(parts.offset + index * 4), {
          ...header,
          geometryType: FlatGeobufGeometryType.Polygon
        });
      }
      return;
    }
    default:
      throw new Error(`Unsupported FlatGeobuf geometry type ${type}`);
  }
}

/** Decodes one geometry for compatibility adapters that require GeoJSON values. */
export function decodeFlatGeobufGeometry(
  arrayBuffer: ArrayBuffer,
  geometryOffset: number | undefined,
  header: FlatGeobufHeader
): any {
  if (geometryOffset === undefined) return null;
  const view = new FlatBufferView(arrayBuffer);
  const xy = readFloat64Vector(view, view.tableField(geometryOffset, 1)) || new Float64Array();
  const z = readFloat64Vector(view, view.tableField(geometryOffset, 2));
  const ends = readUint32Vector(view, view.tableField(geometryOffset, 0));
  const typeField = view.tableField(geometryOffset, 6);
  const type = ((typeField === undefined ? 0 : view.uint8(typeField)) ||
    header.geometryType) as FlatGeobufGeometryType;
  const coordinates = (start: number, end: number) =>
    Array.from({length: end - start}, (_, index) =>
      z
        ? [xy[(start + index) * 2], xy[(start + index) * 2 + 1], z[start + index]]
        : [xy[(start + index) * 2], xy[(start + index) * 2 + 1]]
    );
  const pointCount = xy.length / 2;
  const split = (partEnds: Uint32Array | undefined) => {
    const result: number[][][] = [];
    let start = 0;
    for (const end of partEnds || new Uint32Array([pointCount])) {
      result.push(coordinates(start, end));
      start = end;
    }
    return result;
  };
  switch (type) {
    case FlatGeobufGeometryType.Point:
      return {type: 'Point', coordinates: coordinates(0, 1)[0]};
    case FlatGeobufGeometryType.MultiPoint:
      return {type: 'MultiPoint', coordinates: coordinates(0, pointCount)};
    case FlatGeobufGeometryType.LineString:
      return {type: 'LineString', coordinates: coordinates(0, pointCount)};
    case FlatGeobufGeometryType.MultiLineString:
      return {type: 'MultiLineString', coordinates: split(ends)};
    case FlatGeobufGeometryType.Polygon:
      return {type: 'Polygon', coordinates: split(ends)};
    case FlatGeobufGeometryType.MultiPolygon: {
      const partsField = view.tableField(geometryOffset, 7);
      if (partsField === undefined) return {type: 'MultiPolygon', coordinates: [split(ends)]};
      const parts = view.vector(partsField);
      const polygons: unknown[] = [];
      for (let index = 0; index < parts.length; index++)
        polygons.push(
          decodeFlatGeobufGeometry(arrayBuffer, view.indirect(parts.offset + index * 4), {
            ...header,
            geometryType: FlatGeobufGeometryType.Polygon
          }).coordinates
        );
      return {type: 'MultiPolygon', coordinates: polygons};
    }
    default:
      throw new Error(`Unsupported FlatGeobuf geometry type ${type}`);
  }
}

function readColumns(view: FlatBufferView, fieldOffset: number | undefined): FlatGeobufColumn[] {
  if (fieldOffset === undefined) return [];
  const vector = view.vector(fieldOffset);
  const columns: FlatGeobufColumn[] = [];
  for (let index = 0; index < vector.length; index++) {
    const table = view.indirect(vector.offset + index * 4);
    const field = (index: number) => view.tableField(table, index);
    const value = (index: number, fallback: number, read: (offset: number) => number) => {
      const offset = field(index);
      return offset === undefined ? fallback : read(offset);
    };
    columns.push({
      name: view.string(field(0)) || '',
      type: value(1, FlatGeobufColumnType.Byte, offset =>
        view.uint8(offset)
      ) as FlatGeobufColumnType,
      title: view.string(field(2)),
      description: view.string(field(3)),
      width: value(4, -1, offset => view.int32(offset)),
      precision: value(5, -1, offset => view.int32(offset)),
      scale: value(6, -1, offset => view.int32(offset)),
      nullable: Boolean(value(7, 1, offset => view.int8(offset))),
      unique: Boolean(value(8, 0, offset => view.int8(offset))),
      primaryKey: Boolean(value(9, 0, offset => view.int8(offset)))
    });
  }
  return columns;
}

function readCrs(view: FlatBufferView, table: number) {
  const code = view.tableField(table, 1);
  return {
    code: code === undefined ? 0 : view.int32(code),
    codeString: view.string(view.tableField(table, 5)),
    wkt: view.string(view.tableField(table, 4))
  };
}
function readFloat64Vector(
  view: FlatBufferView,
  fieldOffset: number | undefined
): Float64Array | undefined {
  if (fieldOffset === undefined) return undefined;
  const {offset, length} = view.vector(fieldOffset);
  view.assertRange(offset, length * 8);
  return new Float64Array(view.bytes.buffer, view.bytes.byteOffset + offset, length);
}
function readUint32Vector(
  view: FlatBufferView,
  fieldOffset: number | undefined
): Uint32Array | undefined {
  if (fieldOffset === undefined) return undefined;
  const {offset, length} = view.vector(fieldOffset);
  view.assertRange(offset, length * 4);
  return new Uint32Array(view.bytes.buffer, view.bytes.byteOffset + offset, length);
}
function toSafeNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('FlatGeobuf feature count exceeds JavaScript limits');
  return Number(value);
}
function getIndexSize(featureCount: number, nodeSize: number): number {
  if (!nodeSize) return 0;
  let count = featureCount;
  let nodes = count;
  do {
    count = Math.ceil(count / Math.max(2, nodeSize));
    nodes += count;
  } while (count > 1);
  return nodes * 40;
}
function readProperties(
  view: FlatBufferView,
  vector: {offset: number; length: number},
  columns: FlatGeobufColumn[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let offset = vector.offset;
  const end = offset + vector.length;
  while (offset < end) {
    const column = columns[view.uint16(offset)];
    offset += 2;
    if (!column) throw new Error('FlatGeobuf property references an unknown column');
    const value = readPropertyValue(view, offset, column.type);
    result[column.name] = value.value;
    offset = value.offset;
  }
  return result;
}
function readPropertyValue(
  view: FlatBufferView,
  offset: number,
  type: FlatGeobufColumnType
): {value: unknown; offset: number} {
  switch (type) {
    case FlatGeobufColumnType.Byte:
      return {value: view.int8(offset), offset: offset + 1};
    case FlatGeobufColumnType.UByte:
      return {value: view.uint8(offset), offset: offset + 1};
    case FlatGeobufColumnType.Bool:
      return {value: Boolean(view.uint8(offset)), offset: offset + 1};
    case FlatGeobufColumnType.Short:
      return {value: view.int16(offset), offset: offset + 2};
    case FlatGeobufColumnType.UShort:
      return {value: view.uint16(offset), offset: offset + 2};
    case FlatGeobufColumnType.Int:
      return {value: view.int32(offset), offset: offset + 4};
    case FlatGeobufColumnType.UInt:
      return {value: view.uint32(offset), offset: offset + 4};
    case FlatGeobufColumnType.Long:
      return {value: view.int64(offset), offset: offset + 8};
    case FlatGeobufColumnType.ULong:
      return {value: view.uint64(offset), offset: offset + 8};
    case FlatGeobufColumnType.Float:
      return {value: view.float32(offset), offset: offset + 4};
    case FlatGeobufColumnType.Double:
      return {value: view.float64(offset), offset: offset + 8};
    case FlatGeobufColumnType.String:
    case FlatGeobufColumnType.Json:
    case FlatGeobufColumnType.DateTime:
    case FlatGeobufColumnType.Binary: {
      const length = view.uint32(offset);
      const start = offset + 4;
      view.assertRange(start, length);
      const bytes = view.bytes.slice(start, start + length);
      const value = type === FlatGeobufColumnType.Binary ? bytes : new TextDecoder().decode(bytes);
      return {value, offset: start + length};
    }
    default:
      throw new Error(`Unsupported FlatGeobuf column type ${type}`);
  }
}
