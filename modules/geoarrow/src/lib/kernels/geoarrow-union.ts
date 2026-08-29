// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {GeoArrowDimension} from '@loaders.gl/schema';

/** Geometry families represented by a GeoArrow dense union child. */
export type GeoArrowUnionGeometryKind =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection';

/** Resolves a dense-union child family from its legal name or canonical type ID. */
export function getGeoArrowUnionGeometryKind(
  fieldName: string | undefined,
  typeId: number
): GeoArrowUnionGeometryKind | null {
  const normalizedName = (fieldName || '').toLowerCase().replace(/[^a-z]/g, '');
  if (normalizedName.includes('geometrycollection')) return 'GeometryCollection';
  if (normalizedName.includes('multipolygon')) return 'MultiPolygon';
  if (normalizedName.includes('multilinestring')) return 'MultiLineString';
  if (normalizedName.includes('multipoint')) return 'MultiPoint';
  if (normalizedName.includes('polygon')) return 'Polygon';
  if (normalizedName.includes('linestring')) return 'LineString';
  if (normalizedName.includes('point')) return 'Point';
  switch (typeId % 10) {
    case 1:
      return 'Point';
    case 2:
      return 'LineString';
    case 3:
      return 'Polygon';
    case 4:
      return 'MultiPoint';
    case 5:
      return 'MultiLineString';
    case 6:
      return 'MultiPolygon';
    case 7:
      return 'GeometryCollection';
    default:
      return null;
  }
}

/** Resolves a dense-union child dimension from its name, physical type, or canonical ID. */
export function getGeoArrowUnionDimension(
  fieldName: string | undefined,
  type: arrow.DataType | undefined,
  typeId: number
): GeoArrowDimension | null {
  if (fieldName && /\sZM$/i.test(fieldName)) return 'xyzm';
  if (fieldName && /\sM$/i.test(fieldName)) return 'xym';
  if (fieldName && /\sZ$/i.test(fieldName)) return 'xyz';
  const physicalDimension = getPhysicalCoordinateDimension(type);
  if (physicalDimension) return physicalDimension;
  const dimensionBand = Math.floor(typeId / 10);
  return dimensionBand === 3
    ? 'xyzm'
    : dimensionBand === 2
      ? 'xym'
      : dimensionBand === 1
        ? 'xyz'
        : dimensionBand === 0
          ? 'xy'
          : null;
}

/** Infers the coordinate dimension from a concrete native Arrow type. */
function getPhysicalCoordinateDimension(
  type: arrow.DataType | undefined
): GeoArrowDimension | null {
  if (!type) return null;
  let coordinateType = type;
  while (coordinateType instanceof arrow.List || coordinateType instanceof arrow.LargeList) {
    coordinateType = coordinateType.children[0]?.type;
    if (!coordinateType) return null;
  }
  if (coordinateType instanceof arrow.FixedSizeList) {
    return coordinateType.listSize === 4
      ? 'xyzm'
      : coordinateType.listSize === 3
        ? 'xyz'
        : coordinateType.listSize === 2
          ? 'xy'
          : null;
  }
  if (coordinateType instanceof arrow.Struct) {
    const names = new Set(coordinateType.children.map(field => field.name));
    if (names.has('z') && names.has('m')) return 'xyzm';
    if (names.has('m')) return 'xym';
    if (names.has('z')) return 'xyz';
    if (names.has('x') && names.has('y')) return 'xy';
  }
  return null;
}
