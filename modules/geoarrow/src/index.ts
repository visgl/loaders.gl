// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GIS CATEGORY - GEOARROW
export type {GeoArrowMetadata, GeoArrowEncoding} from './metadata/geoarrow-metadata';

export type {
  GeoArrowWKB,
  GeoArrowWKT,
  GeoArrowCoordInterleaved,
  GeoArrowCoordSeparated,
  GeoArrowCoord,
  GeoArrowPoint,
  GeoArrowLineString,
  GeoArrowPolygon,
  GeoArrowMultiPoint,
  GeoArrowMultiLineString,
  GeoArrowMultiPolygon,
  GeoArrowGeometry,
  GeoArrowPointSeparated,
  GeoArrowLineStringSeparated,
  GeoArrowPolygonSeparated,
  GeoArrowMultiPointSeparated,
  GeoArrowMultiLineStringSeparated,
  GeoArrowMultiPolygonSeparated,
  GeoArrowGeometrySeparated
} from './geoarrow-types';

export {
  isGeoArrowPoint,
  isGeoArrowLineString,
  isGeoArrowPolygon,
  isGeoArrowMultiPoint,
  isGeoArrowMultiLineString,
  isGeoArrowMultiPolygon,
  isGeoArrowGeometry
} from './geoarrow-functions';

// GEOARROW / GEOPARQUET METADATA
export {getGeometryColumnsFromSchema} from './metadata/geoarrow-metadata';

export type {GeoColumnMetadata} from './metadata/geoparquet-metadata';
export {
  getGeoMetadata,
  unpackGeoMetadata,
  unpackJSONStringMetadata
} from './metadata/geoparquet-metadata';

export {getGeoArrowGeometryInfo} from './get-geoarrow-geometry-info';

export {updateBoundsFromGeoArrowSamples} from './get-arrow-bounds';
