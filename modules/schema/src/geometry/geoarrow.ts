// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Canonical GeoArrow extension names. */
export type GeoArrowEncoding =
  | 'geoarrow.geometry'
  | 'geoarrow.geometrycollection'
  | 'geoarrow.multipolygon'
  | 'geoarrow.polygon'
  | 'geoarrow.multilinestring'
  | 'geoarrow.linestring'
  | 'geoarrow.multipoint'
  | 'geoarrow.point'
  | 'geoarrow.box'
  | 'geoarrow.wkb'
  | 'geoarrow.wkt';

/** Coordinate dimensions understood by GeoArrow and GeoParquet. */
export type GeoArrowDimension = 'xy' | 'xyz' | 'xym' | 'xyzm';

/** Coordinate memory layouts understood by GeoArrow. */
export type GeoArrowCoordinateLayout = 'interleaved' | 'separated';

/** Offset widths supported by variable-length GeoArrow arrays. */
export type GeoArrowOffsetType = 'int32' | 'int64';

/** One axis-aligned GeoArrow Box value in canonical child order. */
export type GeoArrowBox = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  zmin?: number;
  zmax?: number;
  mmin?: number;
  mmax?: number;
};

/** Non-planar edge interpretations used by geospatial metadata. */
export type GeoArrowEdgeType = 'spherical' | 'vincenty' | 'thomas' | 'andoyer' | 'karney';

/** Geometry type names used by GeoParquet metadata. */
export type GeoParquetGeometryType =
  | 'Point'
  | 'LineString'
  | 'Polygon'
  | 'MultiPoint'
  | 'MultiLineString'
  | 'MultiPolygon'
  | 'GeometryCollection'
  | 'Point Z'
  | 'LineString Z'
  | 'Polygon Z'
  | 'MultiPoint Z'
  | 'MultiLineString Z'
  | 'MultiPolygon Z'
  | 'GeometryCollection Z'
  | 'Point M'
  | 'LineString M'
  | 'Polygon M'
  | 'MultiPoint M'
  | 'MultiLineString M'
  | 'MultiPolygon M'
  | 'GeometryCollection M'
  | 'Point ZM'
  | 'LineString ZM'
  | 'Polygon ZM'
  | 'MultiPoint ZM'
  | 'MultiLineString ZM'
  | 'MultiPolygon ZM'
  | 'GeometryCollection ZM';

/** JSON-compatible CRS value accepted by GeoArrow extension metadata. */
export type GeoArrowCRSValue = Record<string, unknown> | string;

/** CRS representation tag used by GeoArrow extension metadata. */
export type GeoArrowCRSType = 'projjson' | 'wkt2:2019' | 'authority_code' | 'srid';

/** CRS metadata attached to a GeoArrow field. */
export type GeoArrowCRSMetadata =
  | {crs?: undefined; crs_type?: undefined}
  | {crs: Record<string, unknown>; crs_type?: 'projjson'}
  | {crs: string; crs_type: 'wkt2:2019' | 'authority_code' | 'srid'}
  | {crs: string; crs_type?: undefined};

/** Metadata attached to a GeoArrow extension field. */
export type GeoArrowMetadata = GeoArrowCRSMetadata & {
  encoding?: GeoArrowEncoding;
  edges?: GeoArrowEdgeType;
  geometry_types?: GeoParquetGeometryType[];
  [key: string]: unknown;
};

/** Metadata for one geometry column in a GeoParquet file. */
export type GeoColumnMetadata = {
  encoding: string;
  geometry_types: GeoParquetGeometryType[];
  crs?: Record<string, unknown> | null;
  orientation?: 'counterclockwise';
  bbox?: number[];
  edges?: 'planar' | GeoArrowEdgeType;
  epoch?: number;
  [key: string]: unknown;
};

/** File-level GeoParquet metadata stored under the `geo` key. */
export type GeoMetadata = {
  version?: string;
  primary_column?: string;
  columns: Record<string, GeoColumnMetadata>;
  [key: string]: unknown;
};
