export type GeoArrowEncoding =
  | 'geoarrow.multipolygon'
  | 'geoarrow.polygon'
  | 'geoarrow.multilinestring'
  | 'geoarrow.linestring'
  | 'geoarrow.multipoint'
  | 'geoarrow.point'
  | 'geoarrow.wkb'
  | 'geoarrow.wkt';

/**
 * Geospatial metadata for one column, extracted from Apache Arrow metadata
 * @see https://github.com/geoarrow/geoarrow/blob/main/extension-types.md
 */
export type GeoArrowMetadata = {
  /** Encoding of geometry in this column */
  encoding?: GeoArrowEncoding;
  /** CRS in [PROJJSON](https://proj.org/specifications/projjson.html). Omitted if producer has no information about CRS */
  crs?: Record<string, unknown>;
  /** Edges are either spherical or omitted */
  edges?: 'spherical';
  [key: string]: unknown;
};
