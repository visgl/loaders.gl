// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

import {
  isGeoArrowLineString,
  isGeoArrowMultiLineString,
  isGeoArrowMultiPoint,
  isGeoArrowMultiPolygon,
  isGeoArrowPoint,
  isGeoArrowPolygon
} from './geoarrow-functions';
import {getGeoArrowGeometryInfo} from './get-geoarrow-geometry-info';

const EWKB_FLAG_Z = 0x80000000;
const EWKB_FLAG_M = 0x40000000;
const EWKB_FLAG_SRID = 0x20000000;

type WKBCountHeader = {
  geometryType: number;
  dimensions: 2 | 3 | 4;
  littleEndian: boolean;
  byteOffset: number;
};

/**
 * Counts coordinate vertices in GeoArrow data.
 * @param input Apache Arrow Table, Vector, or Data containing GeoArrow geometry values.
 * @returns Number of geometry vertices. WKB values are parsed and native GeoArrow layouts are
 * counted from child coordinate buffers.
 */
export function getGeoarrowVertexCount(input: arrow.Table | arrow.Vector | arrow.Data): number {
  if (input instanceof arrow.Table) {
    return getGeoarrowTableVertexCount(input);
  }
  if (input instanceof arrow.Vector) {
    return getGeoarrowVectorVertexCount(input);
  }
  if (input instanceof arrow.Data) {
    return getGeoarrowDataVertexCount(input);
  }
  throw new Error('Expected an Apache Arrow Table, Vector, or Data instance.');
}

/**
 * Counts coordinate vertices across GeoArrow-compatible table columns.
 * @param table Apache Arrow table.
 * @returns Number of vertices in compatible geometry columns.
 */
function getGeoarrowTableVertexCount(table: arrow.Table): number {
  let vertexCount = 0;

  for (const field of table.schema.fields) {
    if (!getGeoArrowGeometryInfo(field)) {
      continue;
    }

    const vector = table.getChild(field.name);
    if (vector) {
      vertexCount += getGeoarrowVectorVertexCount(vector);
    }
  }

  return vertexCount;
}

/**
 * Counts coordinate vertices across all chunks in a GeoArrow vector.
 * @param vector Apache Arrow vector.
 * @returns Number of vertices in the vector.
 */
function getGeoarrowVectorVertexCount(vector: arrow.Vector): number {
  let vertexCount = 0;

  for (const data of vector.data) {
    vertexCount += getGeoarrowDataVertexCount(data);
  }

  return vertexCount;
}

/**
 * Counts coordinate vertices in one GeoArrow data chunk.
 * @param data Apache Arrow data chunk.
 * @returns Number of vertices in the data chunk.
 */
function getGeoarrowDataVertexCount(data: arrow.Data): number {
  if (data.type instanceof arrow.Binary || data.type instanceof arrow.LargeBinary) {
    return getWKBDataVertexCount(data);
  }
  if (data.type instanceof arrow.Utf8 || data.type instanceof arrow.LargeUtf8) {
    throw new Error('GeoArrow WKT vertex counting is not supported.');
  }

  if (isGeoArrowPoint(data.type)) {
    return data.length - data.nullCount;
  }
  if (isGeoArrowLineString(data.type) || isGeoArrowMultiPoint(data.type)) {
    return data.children[0]?.length || 0;
  }
  if (isGeoArrowPolygon(data.type) || isGeoArrowMultiLineString(data.type)) {
    return data.children[0]?.children[0]?.length || 0;
  }
  if (isGeoArrowMultiPolygon(data.type)) {
    return data.children[0]?.children[0]?.children[0]?.length || 0;
  }

  throw new Error(`Unsupported GeoArrow data type: ${data.type}`);
}

/**
 * Counts vertices in one Arrow Binary WKB data chunk.
 * @param data Arrow Binary or LargeBinary data chunk.
 * @returns Number of WKB vertices in non-null rows.
 */
function getWKBDataVertexCount(data: arrow.Data): number {
  const vector = new arrow.Vector([data]);
  let vertexCount = 0;

  for (let rowIndex = 0; rowIndex < vector.length; rowIndex++) {
    const value = vector.get(rowIndex);
    if (value) {
      vertexCount += getWKBVertexCount(value as ArrayBufferView);
    }
  }

  return vertexCount;
}

/**
 * Counts vertices in one WKB geometry value.
 * @param wkb WKB geometry bytes.
 * @returns Number of source vertices encoded by the WKB geometry.
 */
function getWKBVertexCount(wkb: ArrayBufferLike | ArrayBufferView): number {
  const dataView = getWKBDataView(wkb);
  return parseWKBGeometryVertexCount(dataView, 0).vertexCount;
}

/**
 * Creates a DataView over WKB bytes without copying typed array inputs.
 * @param wkb Binary WKB input.
 * @returns DataView over the WKB bytes.
 */
function getWKBDataView(wkb: ArrayBufferLike | ArrayBufferView): DataView {
  if (ArrayBuffer.isView(wkb)) {
    return new DataView(wkb.buffer, wkb.byteOffset, wkb.byteLength);
  }
  return new DataView(wkb);
}

/**
 * Counts vertices in a WKB geometry starting at a byte offset.
 * @param dataView Binary WKB input view.
 * @param byteOffset Offset to the geometry header.
 * @returns Vertex count and next unread byte offset.
 */
function parseWKBGeometryVertexCount(
  dataView: DataView,
  byteOffset: number
): {vertexCount: number; byteOffset: number} {
  const header = parseWKBCountHeader(dataView, byteOffset);

  switch (header.geometryType) {
    case 1:
      return {
        vertexCount: 1,
        byteOffset: header.byteOffset + header.dimensions * 8
      };
    case 2:
      return parseWKBPointSequenceVertexCount(dataView, header.byteOffset, header);
    case 3:
      return parseWKBPolygonVertexCount(dataView, header.byteOffset, header);
    case 4:
    case 5:
    case 6:
    case 7:
      return parseWKBGeometryCollectionVertexCount(dataView, header.byteOffset, header);
    default:
      throw new Error(`WKB: Unsupported geometry type: ${header.geometryType}`);
  }
}

/**
 * Parses a WKB header for vertex counting.
 * @param dataView Binary WKB input view.
 * @param byteOffset Offset to the geometry header.
 * @returns Parsed header.
 */
function parseWKBCountHeader(dataView: DataView, byteOffset: number): WKBCountHeader {
  const littleEndian = dataView.getUint8(byteOffset) === 1;
  byteOffset++;

  const geometryCode = dataView.getUint32(byteOffset, littleEndian);
  byteOffset += 4;

  const geometryType = geometryCode & 0x7;
  let dimensions: 2 | 3 | 4 = 2;
  const isoType = (geometryCode - geometryType) / 1000;

  if (isoType === 1 || isoType === 2) {
    dimensions = 3;
  } else if (isoType === 3) {
    dimensions = 4;
  } else {
    const ewkbZ = geometryCode & EWKB_FLAG_Z;
    const ewkbM = geometryCode & EWKB_FLAG_M;
    const ewkbSRID = geometryCode & EWKB_FLAG_SRID;

    if (ewkbZ && ewkbM) {
      dimensions = 4;
    } else if (ewkbZ || ewkbM) {
      dimensions = 3;
    }

    if (ewkbSRID) {
      byteOffset += 4;
    }
  }

  return {geometryType, dimensions, littleEndian, byteOffset};
}

/**
 * Counts vertices in a WKB point sequence.
 * @param dataView Binary WKB input view.
 * @param byteOffset Offset to the point count.
 * @param header Parsed WKB header.
 * @returns Vertex count and next unread byte offset.
 */
function parseWKBPointSequenceVertexCount(
  dataView: DataView,
  byteOffset: number,
  header: WKBCountHeader
): {vertexCount: number; byteOffset: number} {
  const vertexCount = dataView.getUint32(byteOffset, header.littleEndian);
  byteOffset += 4 + vertexCount * header.dimensions * 8;
  return {vertexCount, byteOffset};
}

/**
 * Counts vertices in a WKB polygon.
 * @param dataView Binary WKB input view.
 * @param byteOffset Offset to the polygon ring count.
 * @param header Parsed WKB header.
 * @returns Vertex count and next unread byte offset.
 */
function parseWKBPolygonVertexCount(
  dataView: DataView,
  byteOffset: number,
  header: WKBCountHeader
): {vertexCount: number; byteOffset: number} {
  const ringCount = dataView.getUint32(byteOffset, header.littleEndian);
  byteOffset += 4;

  let vertexCount = 0;
  for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
    const pointCount = dataView.getUint32(byteOffset, header.littleEndian);
    vertexCount += pointCount;
    byteOffset += 4 + pointCount * header.dimensions * 8;
  }

  return {vertexCount, byteOffset};
}

/**
 * Counts vertices in a WKB multi-geometry or geometry collection.
 * @param dataView Binary WKB input view.
 * @param byteOffset Offset to the collection count.
 * @param header Parsed WKB header.
 * @returns Vertex count and next unread byte offset.
 */
function parseWKBGeometryCollectionVertexCount(
  dataView: DataView,
  byteOffset: number,
  header: WKBCountHeader
): {vertexCount: number; byteOffset: number} {
  const geometryCount = dataView.getUint32(byteOffset, header.littleEndian);
  byteOffset += 4;

  let vertexCount = 0;
  for (let geometryIndex = 0; geometryIndex < geometryCount; geometryIndex++) {
    const parsedGeometry = parseWKBGeometryVertexCount(dataView, byteOffset);
    vertexCount += parsedGeometry.vertexCount;
    byteOffset = parsedGeometry.byteOffset;
  }

  return {vertexCount, byteOffset};
}
