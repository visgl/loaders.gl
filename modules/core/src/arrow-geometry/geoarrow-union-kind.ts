// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
  if (normalizedName.includes('line')) return 'LineString';
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
