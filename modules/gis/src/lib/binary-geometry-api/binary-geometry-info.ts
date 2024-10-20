// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BinaryGeometry} from '@loaders.gl/schema';

/**
 * Information about a binary geometry
 */
export type BinaryGeometryInfo = {
  /** The GeoJSON style geometry type corresponding to this particular binary geometry */
  multiGeometryType:
    | 'Point'
    | 'LineString'
    | 'Polygon'
    | 'MultiPoint'
    | 'MultiLineString'
    | 'MultiPolygon';
  /** Is this a "Multi" version of the binary geometry? */
  isMultiGeometry: boolean;
  /** How many dimensions are the coordinates? */
  dimension: number;
  /** How many points does this geometry have? */
  pointCount: number;
  /** How many coordinates does this geometry have? */
  coordinateCount: number;
};

/**
 * @returns information about a binary geometry
 */
export function getBinaryGeometryInfo(geometry: BinaryGeometry): BinaryGeometryInfo {
  return {
    isMultiGeometry: isMultiGeometryType(geometry),
    multiGeometryType: getMultiGeometryType(geometry),
    dimension: geometry.positions.size,
    pointCount: geometry.positions.value.length / geometry.positions.size,
    coordinateCount: geometry.positions.value.length
  };
}

/** @returns true if a binary geometry corresponds to a MultiPoint, MultiLineString or MultiPolygon */
function isMultiGeometryType(geometry: BinaryGeometry) {
  switch (geometry.type) {
    case 'Point':
      const {positions} = geometry;
      return positions.value.length / positions.size > 1;
    case 'LineString':
      const {pathIndices} = geometry;
      return pathIndices.value.length > 1;
    case 'Polygon':
      const {polygonIndices} = geometry;
      return polygonIndices.value.length > 1;
    default:
      return false;
  }
}

/**
 * @returns geometry type of binary geometry, including MultiPoint, MultiLineString or MultiPolygon
 */
function getMultiGeometryType(geometry: BinaryGeometry) {
  const isMulti = isMultiGeometryType(geometry);
  switch (geometry.type) {
    case 'Point':
      return isMulti ? 'MultiPoint' : 'Point';
    case 'LineString':
      return isMulti ? 'MultiLineString' : 'LineString';
    case 'Polygon':
      return isMulti ? 'MultiPolygon' : 'Polygon';
    default:
      // @ts-expect-error
      throw new Error(`Illegal geometry type: ${type}`);
  }
}
