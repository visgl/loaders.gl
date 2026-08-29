// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {
  GeoArrowCoordinateLayout,
  GeoArrowDimension,
  GeoArrowOffsetType
} from '../../geoarrow-converter/convert-geoarrow-geometry';
import type {GeoParquetGeometryType} from '@loaders.gl/schema';

type NativeEncoding =
  | 'geoarrow.point'
  | 'geoarrow.linestring'
  | 'geoarrow.polygon'
  | 'geoarrow.multipoint'
  | 'geoarrow.multilinestring'
  | 'geoarrow.multipolygon';

type UnionGeometryKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

const UNION_GEOMETRY_KINDS: readonly UnionGeometryKind[] = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon'
];

type WKBHeader = {
  geometryType: number;
  coordinateSize: 2 | 3 | 4;
  dimension: GeoArrowDimension;
  littleEndian: boolean;
  byteOffset: number;
};

type OffsetArray = Int32Array | BigInt64Array;

type NativeBuffers = {
  rowCount: number;
  nullCount: number;
  nullBitmap: Uint8Array;
  coordinateSize: 2 | 3 | 4;
  coordinateCount: number;
  coordinates: Float64Array[];
  geometryOffsets?: OffsetArray | number[];
  partOffsets?: OffsetArray | number[];
  ringOffsets?: OffsetArray | number[];
};

type NativeBufferWriter = {
  rowIndex: number;
  coordinateIndex: number;
  geometryChildCount: number;
  partChildCount: number;
  ringChildCount: number;
  geometryOffsetIndex: number;
  partOffsetIndex: number;
  ringOffsetIndex: number;
  buffers: NativeBuffers;
  writeCoordinateFromView: (
    dataView: DataView,
    byteOffset: number,
    sourceDimension: number,
    littleEndian: boolean
  ) => void;
  addGeometryOffset: (childCount: number) => void;
  addPartOffset: (childCount: number) => void;
  addRingOffset: (childCount: number) => void;
};

/**
 * Decodes WKB directly into a native GeoArrow vector using two measurement passes.
 *
 * The parser reads nested headers and coordinate values directly from DataViews. It does not
 * allocate GeoJSON objects or per-feature coordinate arrays. A `null` result means the column is
 * valid WKB but cannot be represented by the requested concrete encoding, allowing the caller to
 * use its general conversion path for unions and collections.
 *
 * @param column WKB Arrow vector.
 * @param targetEncoding Concrete native target encoding.
 * @param dimensionName Optional exact output dimension.
 * @param offsetType Output offset width.
 * @param coordinates Output coordinate layout.
 * @returns Native vector or `null` when the target is not representable.
 */
export function decodeWKBNativeVector(
  column: arrow.Vector,
  targetEncoding: NativeEncoding,
  dimensionName?: GeoArrowDimension,
  offsetType: GeoArrowOffsetType = 'int32',
  coordinates: GeoArrowCoordinateLayout = 'interleaved'
): arrow.Vector | null {
  const rows: (Uint8Array | null)[] = [];
  let coordinateSize = dimensionName ? getDimensionSize(dimensionName) : 2;
  let inferredDimensionName: GeoArrowDimension | undefined;
  let nullCount = 0;

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      rows.push(null);
      nullCount++;
      continue;
    }
    const bytes = value as Uint8Array;
    try {
      const header = readHeader(getDataView(bytes), 0);
      coordinateSize = Math.max(coordinateSize, header.coordinateSize) as 2 | 3 | 4;
      if (!dimensionName) {
        if (inferredDimensionName && inferredDimensionName !== header.dimension) return null;
        inferredDimensionName = header.dimension;
      }
      rows.push(bytes);
    } catch {
      return null;
    }
  }

  if (dimensionName) {
    coordinateSize = getDimensionSize(dimensionName);
  }

  const measured = createNativeBuffers(
    rows.length,
    nullCount,
    coordinateSize,
    targetEncoding,
    offsetType,
    coordinates
  );
  const measureWriter = createBufferWriter(measured, false);

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    measureWriter.rowIndex = rowIndex;
    const bytes = rows[rowIndex];
    if (!bytes) {
      writeNullRow(measureWriter, targetEncoding);
      continue;
    }
    const success = writeWKBRow(getDataView(bytes), targetEncoding, coordinateSize, measureWriter);
    if (!success) return null;
  }

  const buffers = allocateNativeBuffers(measured, offsetType, coordinates);
  const writeWriter = createBufferWriter(buffers, true);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    writeWriter.rowIndex = rowIndex;
    const bytes = rows[rowIndex];
    if (!bytes) {
      writeNullRow(writeWriter, targetEncoding);
      continue;
    }
    if (!writeWKBRow(getDataView(bytes), targetEncoding, coordinateSize, writeWriter)) {
      return null;
    }
  }

  return makeNativeVector(
    buffers,
    targetEncoding,
    coordinates,
    dimensionName || inferredDimensionName || getDimensionName(coordinateSize)
  );
}

/**
 * Decodes a mixed WKB vector directly into a dense GeoArrow geometry union.
 *
 * Rows are partitioned by their WKB root header and each union child is decoded with the same
 * typed native kernel used by homogeneous columns. Child offsets therefore point directly into
 * compact native child arrays, while null rows are represented by null child values.
 *
 * @param column WKB Arrow vector.
 * @param dimensionName Optional exact output dimension.
 * @param offsetType Output offset width for variable-length children.
 * @param coordinates Output coordinate layout for children.
 * @param geometryTypes Optional metadata used to seed absent union children.
 * @param maxGeometryCollectionDepth Maximum nested collection depth.
 * @returns Dense union vector or `null` when a row contains malformed WKB.
 */
export function decodeWKBUnionVector(
  column: arrow.Vector,
  dimensionName?: GeoArrowDimension,
  offsetType: GeoArrowOffsetType = 'int32',
  coordinates: GeoArrowCoordinateLayout = 'interleaved',
  geometryTypes?: readonly GeoParquetGeometryType[],
  maxGeometryCollectionDepth = 64
): arrow.Vector | null {
  const rows: (Uint8Array | null)[] = [];

  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      rows.push(null);
      continue;
    }
    const bytes = value as Uint8Array;
    try {
      const header = readHeader(getDataView(bytes), 0);
      rows.push(bytes);
      getUnionGeometryKind(header.geometryType);
    } catch {
      return null;
    }
  }

  return makeWKBUnionVector(
    rows,
    dimensionName,
    offsetType,
    coordinates,
    geometryTypes,
    maxGeometryCollectionDepth
  );
}

/** Builds a dense WKB union from byte slices, recursively materializing collection children. */
function makeWKBUnionVector(
  rows: readonly (Uint8Array | null)[],
  dimensionName: GeoArrowDimension | undefined,
  offsetType: GeoArrowOffsetType,
  coordinates: GeoArrowCoordinateLayout,
  geometryTypes?: readonly GeoParquetGeometryType[],
  maxGeometryCollectionDepth = 64,
  collectionDepth = 0
): arrow.Vector | null {
  const rowKinds: (UnionGeometryKind | null)[] = [];
  const rowDimensions: (GeoArrowDimension | null)[] = [];

  for (const bytes of rows) {
    if (!bytes) {
      rowKinds.push(null);
      rowDimensions.push(null);
      continue;
    }
    try {
      const header = readHeader(getDataView(bytes), 0);
      rowKinds.push(getUnionGeometryKind(header.geometryType));
      rowDimensions.push(dimensionName || header.dimension);
    } catch {
      return null;
    }
  }

  const nullCarrierKind =
    rowKinds.find((kind): kind is UnionGeometryKind => kind !== null) || 'Point';
  const nullCarrierDimension =
    rowDimensions.find((dimension): dimension is GeoArrowDimension => dimension !== null) || 'xy';
  const nullCarrierKey = getUnionChildKey(nullCarrierKind, nullCarrierDimension);
  const usedChildren = new Map<string, {kind: UnionGeometryKind; dimension: GeoArrowDimension}>();
  usedChildren.set(nullCarrierKey, {
    kind: nullCarrierKind,
    dimension: nullCarrierDimension
  });
  for (const geometryType of geometryTypes || []) {
    const child = getUnionChildDescriptor(geometryType, dimensionName);
    if (child) {
      usedChildren.set(getUnionChildKey(child.kind, child.dimension), child);
    }
  }
  for (let rowIndex = 0; rowIndex < rowKinds.length; rowIndex++) {
    const kind = rowKinds[rowIndex];
    if (kind) {
      const dimension = rowDimensions[rowIndex]!;
      usedChildren.set(getUnionChildKey(kind, dimension), {kind, dimension});
    }
  }
  const orderedChildren = [...usedChildren.values()].sort(
    (leftChild, rightChild) =>
      getUnionTypeId(leftChild.kind, leftChild.dimension) -
      getUnionTypeId(rightChild.kind, rightChild.dimension)
  );
  const childRows = new Map<string, (Uint8Array | null)[]>();
  const typeIds = new Int8Array(rows.length);
  const valueOffsets = new Int32Array(rows.length);

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const childKind = rowKinds[rowIndex] || nullCarrierKind;
    const childDimension = rowDimensions[rowIndex] || nullCarrierDimension;
    const childKey = getUnionChildKey(childKind, childDimension);
    const values = childRows.get(childKey) || [];
    valueOffsets[rowIndex] = values.length;
    values.push(rows[rowIndex]);
    childRows.set(childKey, values);
    typeIds[rowIndex] = getUnionTypeId(childKind, childDimension);
  }

  const fields: arrow.Field[] = [];
  const children: arrow.Data[] = [];
  for (const child of orderedChildren) {
    const childValues = childRows.get(getUnionChildKey(child.kind, child.dimension)) || [];
    const childColumn = arrow.vectorFromArray(childValues, new arrow.Binary());
    const childVector =
      child.kind === 'GeometryCollection'
        ? makeWKBCollectionVector(
            childValues,
            undefined,
            offsetType,
            coordinates,
            geometryTypes?.filter(geometryType => !geometryType.startsWith('GeometryCollection')),
            maxGeometryCollectionDepth,
            collectionDepth
          )
        : decodeWKBNativeVector(
            childColumn,
            getUnionChildEncoding(child.kind),
            child.dimension,
            offsetType,
            coordinates
          );
    if (!childVector) return null;
    fields.push(
      new arrow.Field(getUnionFieldName(child.kind, child.dimension), childVector.type, true)
    );
    children.push(childVector.data[0]);
  }

  const unionType = new arrow.DenseUnion(
    orderedChildren.map(child => getUnionTypeId(child.kind, child.dimension)),
    fields
  );
  return arrow.makeVector(
    arrow.makeData({
      type: unionType,
      length: rows.length,
      nullCount: 0,
      typeIds,
      valueOffsets,
      children
    } as any)
  );
}

/**
 * Decodes WKB GeometryCollection rows into a list of dense-union children.
 *
 * Collection children share one dense union and are addressed by the outer list offsets. This
 * avoids allocating a GeoJSON object for each collection member. Nested collections recursively
 * use the same list-of-union representation.
 *
 * @param column WKB Arrow vector.
 * @param dimensionName Optional exact output dimension.
 * @param offsetType Output offset width for collection offsets and union children.
 * @param coordinates Output coordinate layout for union children.
 * @param geometryTypes Optional metadata used to seed absent union children.
 * @param maxGeometryCollectionDepth Maximum nested collection depth.
 * @returns List of dense-union children or `null` when the input is not representable directly.
 */
export function decodeWKBGeometryCollectionVector(
  column: arrow.Vector,
  dimensionName?: GeoArrowDimension,
  offsetType: GeoArrowOffsetType = 'int32',
  coordinates: GeoArrowCoordinateLayout = 'interleaved',
  geometryTypes?: readonly GeoParquetGeometryType[],
  maxGeometryCollectionDepth = 64
): arrow.Vector | null {
  const rows: (Uint8Array | null)[] = [];
  for (let rowIndex = 0; rowIndex < column.length; rowIndex++) {
    const value = column.get(rowIndex);
    if (value == null) {
      rows.push(null);
      continue;
    }
    rows.push(value as Uint8Array);
  }
  return makeWKBCollectionVector(
    rows,
    dimensionName,
    offsetType,
    coordinates,
    geometryTypes,
    maxGeometryCollectionDepth
  );
}

/** Builds a recursive GeometryCollection list from WKB rows without creating geometry objects. */
function makeWKBCollectionVector(
  rows: readonly (Uint8Array | null)[],
  dimensionName: GeoArrowDimension | undefined,
  offsetType: GeoArrowOffsetType,
  coordinates: GeoArrowCoordinateLayout,
  geometryTypes?: readonly GeoParquetGeometryType[],
  maxGeometryCollectionDepth = 64,
  collectionDepth = 0
): arrow.Vector | null {
  if (collectionDepth >= maxGeometryCollectionDepth) return null;
  const childRows: (Uint8Array | null)[] = [];
  const collectionOffsets = [0];
  const nullBitmap = new Uint8Array(Math.ceil(rows.length / 8));
  let nullCount = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const bytes = rows[rowIndex];
    if (!bytes) {
      nullCount++;
      collectionOffsets.push(childRows.length);
      continue;
    }

    const dataView = getDataView(bytes);
    try {
      const header = readHeader(dataView, 0);
      if (header.geometryType !== 7) return null;
      let byteOffset = header.byteOffset;
      const childCount = readCount(dataView, byteOffset, header.littleEndian);
      byteOffset += 4;
      for (let childIndex = 0; childIndex < childCount; childIndex++) {
        const childHeader = readHeader(dataView, byteOffset);
        const childEnd = skipGeometry(
          dataView,
          childHeader,
          maxGeometryCollectionDepth,
          collectionDepth + 1
        );
        if (childEnd > dataView.byteLength) return null;
        childRows.push(bytes.subarray(byteOffset, childEnd));
        byteOffset = childEnd;
      }
      if (byteOffset !== dataView.byteLength) return null;
      nullBitmap[rowIndex >> 3] |= 1 << (rowIndex & 7);
      collectionOffsets.push(childRows.length);
    } catch {
      return null;
    }
  }

  const unionVector = makeWKBUnionVector(
    childRows,
    dimensionName,
    offsetType,
    coordinates,
    geometryTypes,
    maxGeometryCollectionDepth,
    collectionDepth + 1
  );
  if (!unionVector) return null;

  const valueOffsets = createOffsets(collectionOffsets.length, offsetType);
  for (let offsetIndex = 0; offsetIndex < collectionOffsets.length; offsetIndex++) {
    setOffset(valueOffsets, offsetIndex, collectionOffsets[offsetIndex]);
  }
  const listField = new arrow.Field('geometries', unionVector.type, true);
  const listType =
    offsetType === 'int64' ? new arrow.LargeList(listField) : new arrow.List(listField);
  const listData = arrow.makeData({
    type: listType,
    length: rows.length,
    nullCount,
    valueOffsets,
    nullBitmap: nullCount > 0 ? nullBitmap : undefined,
    child: unionVector.data[0]
  } as any);
  return arrow.makeVector(listData);
}

function writeWKBRow(
  dataView: DataView,
  targetEncoding: NativeEncoding,
  coordinateSize: 2 | 3 | 4,
  writer: NativeBufferWriter
): boolean {
  const header = readHeader(dataView, 0);
  switch (targetEncoding) {
    case 'geoarrow.point':
      if (header.geometryType !== 1) return false;
      writer.writeCoordinateFromView(
        dataView,
        header.byteOffset,
        header.coordinateSize,
        header.littleEndian
      );
      setValid(writer);
      return true;
    case 'geoarrow.linestring':
      if (header.geometryType !== 2) return false;
      return writeLineString(dataView, header, coordinateSize, writer, false);
    case 'geoarrow.multipoint':
      if (header.geometryType === 1) {
        writer.addGeometryOffset(1);
        writer.writeCoordinateFromView(
          dataView,
          header.byteOffset,
          header.coordinateSize,
          header.littleEndian
        );
        setValid(writer);
        return true;
      }
      return header.geometryType === 4
        ? writeMultiPoint(dataView, header, coordinateSize, writer)
        : false;
    case 'geoarrow.polygon':
      if (header.geometryType !== 3) return false;
      return writePolygon(dataView, header, coordinateSize, writer, false);
    case 'geoarrow.multilinestring':
      if (header.geometryType === 2) {
        writer.addGeometryOffset(1);
        const lineWritten = writeLineString(dataView, header, coordinateSize, writer, true);
        if (lineWritten) setValid(writer);
        return lineWritten;
      }
      return header.geometryType === 5
        ? writeMultiLineString(dataView, header, coordinateSize, writer)
        : false;
    case 'geoarrow.multipolygon':
      if (header.geometryType === 3) {
        writer.addGeometryOffset(1);
        const polygonWritten = writePolygon(dataView, header, coordinateSize, writer, true);
        if (polygonWritten) setValid(writer);
        return polygonWritten;
      }
      return header.geometryType === 6
        ? writeMultiPolygon(dataView, header, coordinateSize, writer)
        : false;
    default:
      return false;
  }
}

function getUnionGeometryKind(geometryType: number): UnionGeometryKind {
  if (geometryType === 7) return 'GeometryCollection';
  const kind = UNION_GEOMETRY_KINDS[geometryType - 1];
  if (!kind) throw new Error(`Unsupported WKB union geometry type ${geometryType}.`);
  return kind;
}

function getUnionChildEncoding(
  geometryKind: Exclude<UnionGeometryKind, 'GeometryCollection'>
): NativeEncoding {
  return `geoarrow.${geometryKind.toLowerCase()}` as NativeEncoding;
}

function getUnionChildKey(geometryKind: UnionGeometryKind, dimension: GeoArrowDimension): string {
  return `${geometryKind}:${dimension}`;
}

/** Converts a GeoParquet geometry type label into a canonical union child descriptor. */
function getUnionChildDescriptor(
  geometryType: GeoParquetGeometryType,
  requestedDimension?: GeoArrowDimension
): {kind: UnionGeometryKind; dimension: GeoArrowDimension} | null {
  const dimension = requestedDimension || getDimensionFromGeometryType(geometryType);
  const geometryKind = geometryType.replace(/ (?:ZM|Z|M)$/, '') as UnionGeometryKind;
  if (
    geometryKind !== 'Point' &&
    geometryKind !== 'LineString' &&
    geometryKind !== 'Polygon' &&
    geometryKind !== 'MultiPoint' &&
    geometryKind !== 'MultiLineString' &&
    geometryKind !== 'MultiPolygon' &&
    geometryKind !== 'GeometryCollection'
  ) {
    return null;
  }
  return {kind: geometryKind, dimension};
}

/** Reads the semantic coordinate dimension suffix from a GeoParquet type label. */
function getDimensionFromGeometryType(geometryType: GeoParquetGeometryType): GeoArrowDimension {
  if (geometryType.endsWith(' ZM')) return 'xyzm';
  if (geometryType.endsWith(' Z')) return 'xyz';
  if (geometryType.endsWith(' M')) return 'xym';
  return 'xy';
}

function getUnionFieldName(geometryKind: UnionGeometryKind, dimension: GeoArrowDimension): string {
  switch (dimension) {
    case 'xy':
      return geometryKind;
    case 'xyz':
      return `${geometryKind} Z`;
    case 'xym':
      return `${geometryKind} M`;
    case 'xyzm':
      return `${geometryKind} ZM`;
  }
}

function getUnionTypeId(geometryKind: UnionGeometryKind, dimension: GeoArrowDimension): number {
  const baseTypeId =
    geometryKind === 'GeometryCollection' ? 7 : UNION_GEOMETRY_KINDS.indexOf(geometryKind) + 1;
  switch (dimension) {
    case 'xy':
      return baseTypeId;
    case 'xyz':
      return baseTypeId + 10;
    case 'xym':
      return baseTypeId + 20;
    case 'xyzm':
      return baseTypeId + 30;
  }
}

function writeLineString(
  dataView: DataView,
  header: WKBHeader,
  coordinateSize: 2 | 3 | 4,
  writer: NativeBufferWriter,
  nested: boolean
): boolean {
  let byteOffset = header.byteOffset;
  const pointCount = readCount(dataView, byteOffset, header.littleEndian);
  byteOffset += 4;
  if (!nested) writer.addGeometryOffset(pointCount);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    writer.writeCoordinateFromView(
      dataView,
      byteOffset,
      header.coordinateSize,
      header.littleEndian
    );
    byteOffset += header.coordinateSize * 8;
  }
  if (nested) writer.addPartOffset(pointCount);
  else setValid(writer);
  return byteOffset <= dataView.byteLength;
}

function writePolygon(
  dataView: DataView,
  header: WKBHeader,
  coordinateSize: 2 | 3 | 4,
  writer: NativeBufferWriter,
  nested: boolean
): boolean {
  let byteOffset = header.byteOffset;
  const ringCount = readCount(dataView, byteOffset, header.littleEndian);
  byteOffset += 4;
  if (!nested) writer.addGeometryOffset(ringCount);
  if (nested) writer.addPartOffset(ringCount);
  for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
    const pointCount = readCount(dataView, byteOffset, header.littleEndian);
    byteOffset += 4;
    if (nested) writer.addRingOffset(pointCount);
    else writer.addPartOffset(pointCount);
    for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
      writer.writeCoordinateFromView(
        dataView,
        byteOffset,
        header.coordinateSize,
        header.littleEndian
      );
      byteOffset += header.coordinateSize * 8;
    }
  }
  if (!nested) setValid(writer);
  return byteOffset <= dataView.byteLength;
}

function writeMultiPoint(
  dataView: DataView,
  header: WKBHeader,
  coordinateSize: 2 | 3 | 4,
  writer: NativeBufferWriter
): boolean {
  let byteOffset = header.byteOffset;
  const pointCount = readCount(dataView, byteOffset, header.littleEndian);
  byteOffset += 4;
  writer.addGeometryOffset(pointCount);
  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const pointHeader = readHeader(dataView, byteOffset);
    if (pointHeader.geometryType !== 1) return false;
    writer.writeCoordinateFromView(
      dataView,
      pointHeader.byteOffset,
      pointHeader.coordinateSize,
      pointHeader.littleEndian
    );
    byteOffset = pointHeader.byteOffset + pointHeader.coordinateSize * 8;
  }
  setValid(writer);
  return byteOffset <= dataView.byteLength;
}

function writeMultiLineString(
  dataView: DataView,
  header: WKBHeader,
  coordinateSize: 2 | 3 | 4,
  writer: NativeBufferWriter
): boolean {
  let byteOffset = header.byteOffset;
  const lineCount = readCount(dataView, byteOffset, header.littleEndian);
  byteOffset += 4;
  writer.addGeometryOffset(lineCount);
  for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
    const lineHeader = readHeader(dataView, byteOffset);
    if (lineHeader.geometryType !== 2) return false;
    if (!writeLineString(dataView, lineHeader, coordinateSize, writer, true)) return false;
    byteOffset = skipGeometry(dataView, lineHeader);
  }
  setValid(writer);
  return byteOffset <= dataView.byteLength;
}

function writeMultiPolygon(
  dataView: DataView,
  header: WKBHeader,
  coordinateSize: 2 | 3 | 4,
  writer: NativeBufferWriter
): boolean {
  let byteOffset = header.byteOffset;
  const polygonCount = readCount(dataView, byteOffset, header.littleEndian);
  byteOffset += 4;
  writer.addGeometryOffset(polygonCount);
  for (let polygonIndex = 0; polygonIndex < polygonCount; polygonIndex++) {
    const polygonHeader = readHeader(dataView, byteOffset);
    if (polygonHeader.geometryType !== 3) {
      return false;
    }
    if (!writePolygon(dataView, polygonHeader, coordinateSize, writer, true)) return false;
    byteOffset = skipGeometry(dataView, polygonHeader);
  }
  setValid(writer);
  return byteOffset <= dataView.byteLength;
}

function createNativeBuffers(
  rowCount: number,
  nullCount: number,
  coordinateSize: 2 | 3 | 4,
  targetEncoding: NativeEncoding,
  offsetType: GeoArrowOffsetType,
  coordinates: GeoArrowCoordinateLayout
): NativeBuffers {
  const buffers: NativeBuffers = {
    rowCount,
    nullCount,
    nullBitmap: new Uint8Array(Math.ceil(rowCount / 8)),
    coordinateSize,
    coordinateCount: 0,
    coordinates: coordinates === 'interleaved' ? [new Float64Array(0)] : []
  };
  if (targetEncoding !== 'geoarrow.point') {
    buffers.geometryOffsets = [0];
  }
  if (
    targetEncoding === 'geoarrow.polygon' ||
    targetEncoding === 'geoarrow.multilinestring' ||
    targetEncoding === 'geoarrow.multipolygon'
  ) {
    buffers.partOffsets = [0];
  }
  if (targetEncoding === 'geoarrow.multipolygon') {
    buffers.ringOffsets = [0];
  }
  return buffers;
}

function allocateNativeBuffers(
  measured: NativeBuffers,
  offsetType: GeoArrowOffsetType,
  coordinates: GeoArrowCoordinateLayout
): NativeBuffers {
  const coordinateCount = measured.coordinateCount;
  const allocated: NativeBuffers = {
    rowCount: measured.rowCount,
    nullCount: measured.nullCount,
    nullBitmap: measured.nullBitmap,
    coordinateSize: measured.coordinateSize,
    coordinateCount: measured.coordinateCount,
    coordinates:
      coordinates === 'interleaved'
        ? [new Float64Array(coordinateCount * measured.coordinateSize)]
        : Array.from({length: measured.coordinateSize}, () => new Float64Array(coordinateCount))
  };
  allocated.geometryOffsets = measured.geometryOffsets
    ? createOffsets(measured.geometryOffsets.length, offsetType)
    : undefined;
  allocated.partOffsets = measured.partOffsets
    ? createOffsets(measured.partOffsets.length, offsetType)
    : undefined;
  allocated.ringOffsets = measured.ringOffsets
    ? createOffsets(measured.ringOffsets.length, offsetType)
    : undefined;
  return allocated;
}

function createBufferWriter(buffers: NativeBuffers, writing: boolean): NativeBufferWriter {
  let coordinateIndex = 0;
  let geometryChildCount = 0;
  let partChildCount = 0;
  let ringChildCount = 0;
  let geometryOffsetIndex = 1;
  let partOffsetIndex = 1;
  let ringOffsetIndex = 1;
  const writer: NativeBufferWriter = {
    rowIndex: 0,
    get coordinateIndex() {
      return coordinateIndex;
    },
    set coordinateIndex(value: number) {
      coordinateIndex = value;
    },
    get geometryChildCount() {
      return geometryChildCount;
    },
    set geometryChildCount(value: number) {
      geometryChildCount = value;
    },
    get partChildCount() {
      return partChildCount;
    },
    set partChildCount(value: number) {
      partChildCount = value;
    },
    get ringChildCount() {
      return ringChildCount;
    },
    set ringChildCount(value: number) {
      ringChildCount = value;
    },
    get geometryOffsetIndex() {
      return geometryOffsetIndex;
    },
    set geometryOffsetIndex(value: number) {
      geometryOffsetIndex = value;
    },
    get partOffsetIndex() {
      return partOffsetIndex;
    },
    set partOffsetIndex(value: number) {
      partOffsetIndex = value;
    },
    get ringOffsetIndex() {
      return ringOffsetIndex;
    },
    set ringOffsetIndex(value: number) {
      ringOffsetIndex = value;
    },
    buffers,
    writeCoordinateFromView(dataView, byteOffset, sourceDimension, littleEndian) {
      if (byteOffset + sourceDimension * 8 > dataView.byteLength) {
        throw new Error('Truncated WKB coordinate');
      }
      if (writing) {
        if (buffers.coordinates.length === 1) {
          const values = buffers.coordinates[0];
          const targetOffset = coordinateIndex * buffers.coordinateSize;
          for (let dimensionIndex = 0; dimensionIndex < buffers.coordinateSize; dimensionIndex++) {
            values[targetOffset + dimensionIndex] =
              dimensionIndex < sourceDimension
                ? dataView.getFloat64(byteOffset + dimensionIndex * 8, littleEndian)
                : 0;
          }
        } else {
          for (let dimensionIndex = 0; dimensionIndex < buffers.coordinateSize; dimensionIndex++) {
            buffers.coordinates[dimensionIndex][coordinateIndex] =
              dimensionIndex < sourceDimension
                ? dataView.getFloat64(byteOffset + dimensionIndex * 8, littleEndian)
                : 0;
          }
        }
      }
      coordinateIndex++;
      buffers.coordinateCount = coordinateIndex;
    },
    addGeometryOffset(childCount) {
      geometryChildCount += childCount;
      if (buffers.geometryOffsets) {
        if (writing) {
          setOffset(
            buffers.geometryOffsets as OffsetArray,
            geometryOffsetIndex,
            geometryChildCount
          );
        } else {
          (buffers.geometryOffsets as number[]).push(geometryChildCount);
        }
      }
      geometryOffsetIndex++;
    },
    addPartOffset(childCount) {
      partChildCount += childCount;
      if (buffers.partOffsets) {
        if (writing) {
          setOffset(buffers.partOffsets as OffsetArray, partOffsetIndex, partChildCount);
        } else {
          (buffers.partOffsets as number[]).push(partChildCount);
        }
      }
      partOffsetIndex++;
    },
    addRingOffset(childCount) {
      ringChildCount += childCount;
      if (buffers.ringOffsets) {
        if (writing) {
          setOffset(buffers.ringOffsets as OffsetArray, ringOffsetIndex, ringChildCount);
        } else {
          (buffers.ringOffsets as number[]).push(ringChildCount);
        }
      }
      ringOffsetIndex++;
    }
  };
  return writer;
}

function writeNullRow(writer: NativeBufferWriter, targetEncoding: NativeEncoding): void {
  if (targetEncoding === 'geoarrow.point') {
    writer.coordinateIndex++;
  } else {
    writer.addGeometryOffset(0);
  }
}

function setValid(writer: NativeBufferWriter): void {
  writer.buffers.nullBitmap[writer.rowIndex >> 3] |= 1 << (writer.rowIndex & 7);
}

function makeNativeVector(
  buffers: NativeBuffers,
  targetEncoding: NativeEncoding,
  coordinates: GeoArrowCoordinateLayout,
  dimensionName: GeoArrowDimension
): arrow.Vector {
  let data = makeCoordinateData(
    buffers.coordinates,
    buffers.coordinateSize,
    coordinates,
    dimensionName
  );
  switch (targetEncoding) {
    case 'geoarrow.point':
      break;
    case 'geoarrow.linestring':
    case 'geoarrow.multipoint':
      data = makeListData(data, buffers.geometryOffsets!);
      break;
    case 'geoarrow.polygon':
    case 'geoarrow.multilinestring':
      data = makeListData(data, buffers.partOffsets!);
      data = makeListData(data, buffers.geometryOffsets!);
      break;
    case 'geoarrow.multipolygon':
      data = makeListData(data, buffers.ringOffsets!);
      data = makeListData(data, buffers.partOffsets!);
      data = makeListData(data, buffers.geometryOffsets!);
      break;
  }
  const topLevelData = new arrow.Data(
    data.type,
    0,
    buffers.rowCount,
    buffers.nullCount,
    [data.valueOffsets, data.values, buffers.nullCount > 0 ? buffers.nullBitmap : undefined],
    data.children
  );
  return arrow.makeVector(topLevelData);
}

function makeCoordinateData(
  coordinates: Float64Array[],
  coordinateSize: 2 | 3 | 4,
  layout: GeoArrowCoordinateLayout,
  dimensionName: GeoArrowDimension
): arrow.Data {
  if (layout === 'interleaved') {
    const coordinateType = new arrow.FixedSizeList(
      coordinateSize,
      new arrow.Field('value', new arrow.Float64(), false)
    );
    return arrow.makeData({
      type: coordinateType,
      child: arrow.makeData({type: new arrow.Float64(), data: coordinates[0]} as any)
    } as any);
  }
  const names = getCoordinateNames(dimensionName);
  const coordinateType = new arrow.Struct(
    names.map(name => new arrow.Field(name, new arrow.Float64(), false))
  );
  return arrow.makeData({
    type: coordinateType,
    length: coordinates[0]?.length || 0,
    children: coordinates.map(values =>
      arrow.makeData({type: new arrow.Float64(), data: values} as any)
    )
  } as any);
}

function makeListData(data: arrow.Data, offsets: OffsetArray | number[]): arrow.Data {
  const typedOffsets = Array.isArray(offsets) ? Int32Array.from(offsets) : offsets;
  const field = new arrow.Field('value', data.type, false);
  const listType =
    typedOffsets instanceof BigInt64Array ? new arrow.LargeList(field) : new arrow.List(field);
  return arrow.makeData({type: listType, valueOffsets: typedOffsets, child: data} as any);
}

function readHeader(dataView: DataView, byteOffset: number): WKBHeader {
  if (byteOffset + 5 > dataView.byteLength) throw new Error('Truncated WKB header');
  const littleEndian = dataView.getUint8(byteOffset) === 1;
  if (dataView.getUint8(byteOffset) > 1) throw new Error('Invalid WKB byte order');
  const geometryCode = dataView.getUint32(byteOffset + 1, littleEndian);
  const geometryType = geometryCode & 0x7;
  if (geometryType < 1 || geometryType > 7) throw new Error('Unsupported WKB geometry type');
  const hasZ = Boolean(geometryCode & 0x80000000);
  const hasM = Boolean(geometryCode & 0x40000000);
  const hasSrid = Boolean(geometryCode & 0x20000000);
  let dimension: GeoArrowDimension = hasZ && hasM ? 'xyzm' : hasZ ? 'xyz' : hasM ? 'xym' : 'xy';
  if (!hasZ && !hasM) {
    const isoDimension = Math.floor((geometryCode - geometryType) / 1000);
    dimension =
      isoDimension === 1 ? 'xyz' : isoDimension === 2 ? 'xym' : isoDimension === 3 ? 'xyzm' : 'xy';
  }
  const coordinateSize = getDimensionSize(dimension);
  const nextOffset = byteOffset + 5 + (hasSrid ? 4 : 0);
  if (nextOffset > dataView.byteLength) throw new Error('Truncated WKB SRID');
  return {geometryType, coordinateSize, dimension, littleEndian, byteOffset: nextOffset};
}

function readCount(dataView: DataView, byteOffset: number, littleEndian: boolean): number {
  if (byteOffset + 4 > dataView.byteLength) throw new Error('Truncated WKB count');
  return dataView.getUint32(byteOffset, littleEndian);
}

function skipGeometry(
  dataView: DataView,
  header: WKBHeader,
  maxGeometryCollectionDepth = Number.POSITIVE_INFINITY,
  collectionDepth = 0
): number {
  const nextCollectionDepth = header.geometryType === 7 ? collectionDepth + 1 : collectionDepth;
  if (nextCollectionDepth > maxGeometryCollectionDepth) {
    throw new Error('GeometryCollection nesting exceeds the configured limit');
  }
  let byteOffset = header.byteOffset;
  switch (header.geometryType) {
    case 1:
      return byteOffset + header.coordinateSize * 8;
    case 2: {
      const count = readCount(dataView, byteOffset, header.littleEndian);
      return byteOffset + 4 + count * header.coordinateSize * 8;
    }
    case 3: {
      const ringCount = readCount(dataView, byteOffset, header.littleEndian);
      byteOffset += 4;
      for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
        const count = readCount(dataView, byteOffset, header.littleEndian);
        byteOffset += 4 + count * header.coordinateSize * 8;
      }
      return byteOffset;
    }
    case 4:
    case 5:
    case 6:
    case 7: {
      const count = readCount(dataView, byteOffset, header.littleEndian);
      byteOffset += 4;
      for (let childIndex = 0; childIndex < count; childIndex++) {
        const childHeader = readHeader(dataView, byteOffset);
        byteOffset = skipGeometry(
          dataView,
          childHeader,
          maxGeometryCollectionDepth,
          nextCollectionDepth
        );
      }
      return byteOffset;
    }
    default:
      throw new Error('Unsupported WKB geometry type');
  }
}

function getDataView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function getDimensionSize(dimension: GeoArrowDimension): 2 | 3 | 4 {
  return dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
}

function getDimensionName(dimension: 2 | 3 | 4): GeoArrowDimension {
  return dimension === 2 ? 'xy' : dimension === 4 ? 'xyzm' : 'xyz';
}

function getCoordinateNames(dimension: GeoArrowDimension): readonly string[] {
  switch (dimension) {
    case 'xy':
      return ['x', 'y'];
    case 'xyz':
      return ['x', 'y', 'z'];
    case 'xym':
      return ['x', 'y', 'm'];
    case 'xyzm':
      return ['x', 'y', 'z', 'm'];
  }
}

function createOffsets(length: number, offsetType: GeoArrowOffsetType): OffsetArray {
  return offsetType === 'int64' ? new BigInt64Array(length) : new Int32Array(length);
}

function setOffset(offsets: OffsetArray, index: number, value: number): void {
  if (offsets instanceof BigInt64Array) offsets[index] = BigInt(value);
  else offsets[index] = value;
}
