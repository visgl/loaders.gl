// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {scanWKB} from '@math.gl/wkb';

import {
  isGeoArrowBox,
  isGeoArrowLineString,
  isGeoArrowMultiLineString,
  isGeoArrowMultiPoint,
  isGeoArrowMultiPolygon,
  isGeoArrowPoint,
  isGeoArrowPolygon
} from './geoarrow-functions';
import {getGeoArrowGeometryInfo} from './get-geoarrow-geometry-info';

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
  if (
    data.type instanceof arrow.Binary ||
    data.type instanceof arrow.LargeBinary ||
    data.type instanceof arrow.BinaryView
  ) {
    return getWKBDataVertexCount(data);
  }
  if (
    data.type instanceof arrow.Utf8 ||
    data.type instanceof arrow.LargeUtf8 ||
    data.type instanceof arrow.Utf8View
  ) {
    return getWKTDataVertexCount(data);
  }
  if (data.type instanceof arrow.DenseUnion) {
    return data.children.reduce(
      (vertexCount, child) => vertexCount + getGeoarrowDataVertexCount(child),
      0
    );
  }
  if (
    (data.type instanceof arrow.List || data.type instanceof arrow.LargeList) &&
    data.children[0]?.type instanceof arrow.DenseUnion
  ) {
    return getGeoarrowDataVertexCount(data.children[0]);
  }

  // A Box stores extents rather than geometry vertices. It is still a recognized
  // GeoArrow column, but contributes no coordinate vertices to this measurement.
  if (isGeoArrowBox(data.type)) {
    return 0;
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

/** Counts vertices in one Arrow UTF-8 WKT data chunk. */
function getWKTDataVertexCount(data: arrow.Data): number {
  void data;
  throw new Error('WKT vertex counting is not supported.');
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
  try {
    return scanWKB(wkb).coordinateCount;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Unsupported WKB geometry type')) {
      throw new Error('Unsupported geometry type');
    }
    throw error;
  }
}
