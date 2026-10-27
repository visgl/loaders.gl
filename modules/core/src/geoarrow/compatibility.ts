// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Retained geometry and rendering APIs for applications migrating from the removed GIS package.
export {GeometryConverter} from './lib/geometry-converters/geometry-converter/geometry-converter';
export type {GeometryShape} from './lib/geometry-converters/geometry-converter/geometry-converter';
export {convertBinaryGeometryToGeometry} from './lib/geometry-converters/convert-binary-geometry-to-geojson';
export {convertWKBToBinaryGeometry} from './lib/geometry-converters/wkb/convert-wkb-to-binary-geometry';
export {
  isWKT,
  getWKTGeometryType,
  isWKB,
  parseWKBHeader
} from './lib/geometry-converters/wkb/helpers/parse-wkb-header';
export {
  WKBGeometryType,
  EWKB_FLAG_Z,
  EWKB_FLAG_M,
  EWKB_FLAG_SRID,
  MAX_SRID,
  WKT_MAGIC_STRINGS,
  WKT_MAGIC_BYTES
} from './lib/geometry-converters/wkb/helpers/wkb-types';
export type {
  WKBHeader,
  WKBOptions
} from './lib/geometry-converters/wkb/helpers/wkb-types';
export {
  FeatureCollectionConverter,
  FEATURE_COLLECTION_CONVERTERS,
  convertFeatureCollection
} from './lib/feature-collection-converters/feature-collection-converter/feature-collection-converter';
export type {
  FeatureCollectionShape,
  BinaryToGeojsonOptions,
  BinaryToGeojsonFeatureOptions
} from './lib/feature-collection-converters/feature-collection-converter/feature-collection-converter';
export {
  isBinaryFeatureCollection,
  isFlatFeatureCollection,
  isGeojsonFeatureCollection
} from './lib/feature-collection-converters/feature-collection-converter/convert-feature-collection';
export {convertBinaryFeatureCollectionToGeojson} from './lib/feature-collection-converters/convert-binary-features-to-geojson';
export {
  convertBinaryFeatureCollectionToArrowBinaryFeatureCollection,
  convertArrowBinaryFeatureCollectionToBinaryFeatureCollection
} from './lib/feature-collection-converters/convert-arrow-binary-feature-collection';
export {
  convertGeometryValuesToBinaryFeatureCollection,
  convertGeometryColumnToBinaryFeatureCollection
} from './lib/feature-collection-converters/convert-geometry-column-to-binary-feature-collection';
export type {
  GeometryColumnBinaryEncoding,
  BinaryPointFeatureScratch,
  BinaryLineFeatureScratch,
  BinaryPolygonFeatureScratch,
  GeometryColumnBinaryFeatureCollectionScratch,
  GeometryColumnToBinaryFeatureCollectionOptions,
  TableGeometryColumnToBinaryFeatureCollectionOptions
} from './lib/feature-collection-converters/convert-geometry-column-to-binary-feature-collection';
export {getBinaryGeometryInfo} from './lib/binary-geometry-api/binary-geometry-info';
export type {BinaryGeometryInfo} from './lib/binary-geometry-api/binary-geometry-info';
export {getGeoArrowUnionGeometryKind} from './lib/geoarrow/geoarrow-union-kind';
export type {GeoArrowUnionGeometryKind} from './lib/geoarrow/geoarrow-union-kind';
