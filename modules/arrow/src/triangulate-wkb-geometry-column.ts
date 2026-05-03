// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {convertWKBToGeometry, triangulateWKB} from '@loaders.gl/gis';
import type {Geometry, MultiPolygon, Polygon, Position} from '@loaders.gl/schema';

/** Tessellated columns derived from a GeoArrow WKB geometry column. */
export type TriangulatedWKBGeometryColumns = {
  /** Triangle vertex indices into the matching row of the `vertices` column. */
  vertexIndices: arrow.Vector<arrow.List<arrow.Int32>>;
  /** XY vertices from the source WKB geometry, preserving the WKB vertex order. */
  vertices: arrow.Vector<arrow.List<arrow.FixedSizeList<arrow.Float64>>>;
};

/**
 * Triangulates a GeoArrow WKB geometry column into triangle index and vertex columns.
 * @param geometryColumn GeoArrow WKB geometry column.
 * @returns Arrow columns with per-geometry triangle vertex indices and source vertices.
 */
export function triangulateWKBGeometryColumn(
  geometryColumn: arrow.Vector<arrow.Binary>
): TriangulatedWKBGeometryColumns {
  const vertexIndices: (number[] | null)[] = [];
  const vertices: (number[][] | null)[] = [];

  for (let geometryIndex = 0; geometryIndex < geometryColumn.length; geometryIndex++) {
    const wkb = geometryColumn.get(geometryIndex);
    if (!wkb) {
      vertexIndices.push(null);
      vertices.push(null);
      continue;
    }

    vertexIndices.push(triangulateWKB(wkb));
    vertices.push(getWKBGeometryVertices(wkb));
  }

  return {
    vertexIndices: arrow.vectorFromArray(
      vertexIndices,
      new arrow.List(new arrow.Field('vertex_index', new arrow.Int32(), true))
    ),
    vertices: arrow.vectorFromArray(
      vertices,
      new arrow.List(
        new arrow.Field(
          'vertex',
          new arrow.FixedSizeList(2, new arrow.Field('coordinate', new arrow.Float64(), false)),
          true
        )
      )
    )
  };
}

/**
 * Extracts XY vertices from a WKB Polygon or MultiPolygon, preserving source vertex order.
 * @param wkb Binary WKB input.
 * @returns XY vertex pairs.
 */
function getWKBGeometryVertices(wkb: ArrayBufferLike | ArrayBufferView): number[][] {
  return getGeometryVertices(convertWKBToGeometry(getWKBArrayBuffer(wkb)));
}

/**
 * Converts WKB input to an ArrayBuffer for helpers that do not accept typed array views.
 * @param wkb Binary WKB input.
 * @returns ArrayBuffer containing only the WKB bytes.
 */
function getWKBArrayBuffer(wkb: ArrayBufferLike | ArrayBufferView): ArrayBufferLike {
  if (!ArrayBuffer.isView(wkb)) {
    return wkb;
  }

  const byteOffset = wkb.byteOffset;
  const byteLength = wkb.byteLength;
  const sourceBuffer = wkb.buffer;
  return byteOffset === 0 && byteLength === sourceBuffer.byteLength
    ? sourceBuffer
    : sourceBuffer.slice(byteOffset, byteOffset + byteLength);
}

/**
 * Extracts XY vertices from a GeoJSON Polygon or MultiPolygon.
 * @param geometry GeoJSON geometry.
 * @returns XY vertex pairs.
 */
function getGeometryVertices(geometry: Geometry): number[][] {
  switch (geometry.type) {
    case 'Polygon':
      return getPolygonVertices(geometry);
    case 'MultiPolygon':
      return getMultiPolygonVertices(geometry);
    default:
      throw new Error(`WKB: Expected Polygon or MultiPolygon, found ${geometry.type}`);
  }
}

/**
 * Extracts XY vertices from a GeoJSON Polygon.
 * @param polygon GeoJSON polygon.
 * @returns XY vertex pairs.
 */
function getPolygonVertices(polygon: Polygon): number[][] {
  return polygon.coordinates.flatMap(ring => ring.map(getXYVertex));
}

/**
 * Extracts XY vertices from a GeoJSON MultiPolygon.
 * @param multiPolygon GeoJSON multipolygon.
 * @returns XY vertex pairs.
 */
function getMultiPolygonVertices(multiPolygon: MultiPolygon): number[][] {
  return multiPolygon.coordinates.flatMap(polygon =>
    polygon.flatMap(ring => ring.map(getXYVertex))
  );
}

/**
 * Converts one GeoJSON position to an XY vertex.
 * @param position GeoJSON position.
 * @returns XY vertex pair.
 */
function getXYVertex(position: Position): number[] {
  return [position[0], position[1]];
}
