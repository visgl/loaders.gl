// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// MESH CATEGORY

export {getBoundingBoxFromArrowPositions} from './mesharrow/get-bounding-box';
export {getDeckBinaryDataFromArrowMesh} from './mesharrow/get-deck-binary-data';

// GIS CATEGORY - GEOARROW
export type {GeoArrowMetadata, GeoArrowEncoding} from './metadata/geoarrow-metadata';
export type {
  GeoArrowConvertToOptions,
  GeoArrowConvertFromOptions
} from './geoarrow-converter/geoarrow-converter';
export {
  GEOARROW_CONVERTERS,
  GeoArrowConverter,
  GeoArrowTableConverter
} from './geoarrow-converter/geoarrow-converter';
export type {GeoArrowGeometryShape} from './geoarrow-converter/geoarrow-geometry-converter';
export {
  GEOARROW_GEOMETRY_CONVERTERS,
  GeoArrowGeometryConverter,
  convertGeoArrowGeometry
} from './geoarrow-converter/geoarrow-geometry-converter';
export type {GeoArrowGeometryConvertOptions} from './geoarrow-converter/convert-geoarrow-geometry';

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

export type {
  BinaryDataFromGeoArrow,
  BinaryGeometriesFromArrowOptions
} from './lib/feature-collection-converters/convert-geoarrow-to-binary-features';
export {
  getBinaryGeometryTemplate,
  getTriangleIndices,
  getMeanCentersFromBinaryGeometries
} from './lib/feature-collection-converters/convert-geoarrow-to-binary-features';
export {
  convertGeoArrowGeometryToGeoJSON,
  convertGeoArrowToBinaryFeatureCollection,
  convertGeoArrowToTable,
  convertWKBTableToGeoJSON,
  convertTableToGeoArrow,
  convertFeatureCollectionToGeoArrowTable,
  convertFeaturesToGeoArrowTable
} from './deprecated';
export type {GeoArrowConvertFromEncoding} from './convert-table-to-geoarrow';
