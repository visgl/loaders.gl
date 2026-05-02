// Types from `@loaders.gl/schema`
export type {Geometry as GeoJSONGeometry} from '@loaders.gl/schema';
export {GIS_CONVERTERS} from './converters';

// Geo Metadata
// import {default as GEOPARQUET_METADATA_SCHEMA} from './lib/geo/geoparquet-metadata-schema.json';
// export {GEOPARQUET_METADATA_SCHEMA};
// export {GEOPARQUET_METADATA_JSON_SCHEMA} from './lib/geoarrow/geoparquet-metadata-schema';

// export type {GeoMetadata} from './lib/geoarrow/geoparquet-metadata';
// export {
//   getGeoMetadata,
//   setGeoMetadata,
//   unpackGeoMetadata
// } from './lib/geoarrow/geoparquet-metadata';
// export {unpackJSONStringMetadata} from './lib/geoarrow/geoparquet-metadata';
export type {Metadata, SchemaWithMetadata} from './lib/geoarrow/metadata-utils';
export {getMetadataValue, setMetadataValue} from './lib/geoarrow/metadata-utils';
export type {
  GeoMetadata,
  GeoColumnMetadata,
  GeoParquetGeometryType
} from './lib/geoarrow/geoparquet-metadata';
export {
  getGeoMetadata,
  setGeoMetadata,
  unpackGeoMetadata,
  unpackJSONStringMetadata,
  parseJSONStringMetadata
} from './lib/geoarrow/geoparquet-metadata';
export type {
  WKBGeometryColumnOptions,
  GeoArrowGeometryColumnOptions
} from './lib/geoarrow/wkb-geoarrow-utils';
export {
  makeGeoArrowGeometryField,
  makeWKBGeometryField,
  setGeoArrowGeometryColumnMetadata,
  setWKBGeometryColumnMetadata,
  setWKBGeometrySchemaMetadata,
  encodeWKBGeometryValue,
  getGeometryWKBOptions,
  inferGeoParquetGeometryTypes,
  getCoordinateDimensions,
  getGeometrySampleCoordinates
} from './lib/geoarrow/wkb-geoarrow-utils';
export type {
  WKBArrowGeometryValueOptions,
  WKBArrowGeometryWriterOptions,
  WKBGeometryValue
} from './lib/geoarrow/wkb-arrow-utils';
export {
  makeWKBGeometryArrowTable,
  makeWKBGeometryArrowTableFromData,
  makeWKBGeometryArrowTableFromWriters,
  makeWKBGeometryData,
  makeWKBGeometryDataFromArray,
  makeWKBGeometryDataFromWriters
} from './lib/geoarrow/wkb-arrow-utils';
export type {
  GeoArrowBuilderEncoding,
  GeoArrowCoordinateTransform,
  GeoArrowBuilderTarget,
  GeoArrowGeometryArray,
  GeoArrowBuilderBaseOptions,
  GeoArrowBuilderMeasureOptions,
  GeoArrowBuilderWriteOptions,
  GeoArrowBuilderOptions,
  GeoArrowGeometryWriter
} from './lib/geoarrow/geoarrow-builder';
export {GeoArrowBuilder} from './lib/geoarrow/geoarrow-builder';

//
export type {GeojsonGeometryInfo} from './lib/geometry-api/geometry-info';
export {getGeometryInfo} from './lib/geometry-api/geometry-info';

// Binary Geometry Utilities
export type {BinaryGeometryInfo} from './lib/binary-geometry-api/binary-geometry-info';
export {getBinaryGeometryInfo} from './lib/binary-geometry-api/binary-geometry-info';
export {
  transformBinaryCoords,
  transformGeoJsonCoords
} from './lib/binary-geometry-api/transform-coordinates';

// FEATURE COLLECTION CONVERSION
export {
  FEATURE_COLLECTION_CONVERTERS,
  FeatureCollectionConverter
} from './lib/feature-collection-converters/feature-collection-converter/feature-collection-converter';
export type {
  GeometryColumnBinaryEncoding,
  BinaryPointFeatureScratch,
  BinaryLineFeatureScratch,
  BinaryPolygonFeatureScratch,
  GeometryColumnBinaryFeatureCollectionScratch,
  GeometryColumnToBinaryFeatureCollectionOptions,
  TableGeometryColumnToBinaryFeatureCollectionOptions
} from './lib/feature-collection-converters/convert-geometry-column-to-binary-feature-collection';
export {
  convertGeometryColumnToBinaryFeatureCollection,
  convertGeometryValuesToBinaryFeatureCollection
} from './lib/feature-collection-converters/convert-geometry-column-to-binary-feature-collection';
export {
  convertArrowBinaryFeatureCollectionToBinaryFeatureCollection,
  convertBinaryFeatureCollectionToArrowBinaryFeatureCollection
} from './lib/feature-collection-converters/convert-arrow-binary-feature-collection';
export {
  convertFlatGeojsonToBinaryFeatureCollection,
  flatGeojsonToBinary,
  convertGeojsonToBinaryFeatureCollection,
  geojsonToBinary,
  convertGeojsonToFlatGeojson,
  geojsonToFlatGeojson,
  convertBinaryFeatureCollectionToGeojson,
  binaryToGeojson
} from './deprecated';

// GEOMETRY ENCODING DETECTION
export {isWKB, isTWKB, isWKT} from './lib/geometry-converters/wkb/helpers/parse-wkb-header';

export type {WKBHeader} from './lib/geometry-converters/wkb/helpers/wkb-types';
export {WKT_MAGIC_STRINGS} from './lib/geometry-converters/wkb/helpers/wkb-types';

// GEOMETRY CONVERSION
export type {GeometryShape} from './lib/geometry-converters/geometry-converter/geometry-converter';
export {GeometryConverter} from './lib/geometry-converters/geometry-converter/geometry-converter';
export {GeometryColumnConverter} from './lib/geometry-converters/geometry-column-converter';
export type {
  BinaryGeometryWKBOptions,
  CoordinateTransform
} from './lib/geometry-converters/wkb/convert-binary-geometry-to-wkb';
export {
  convertBinaryGeometryToWKB,
  getBinaryGeometryWKBSize,
  inferBinaryGeometryTypes,
  reprojectWKBInPlace,
  writeBinaryGeometryToWKB
} from './lib/geometry-converters/wkb/convert-binary-geometry-to-wkb';
export type {
  WKBBuilderBaseOptions,
  WKBBuilderMeasureOptions,
  WKBBuilderOptions,
  WKBBuilderWriteOptions,
  WKBGeometryArray,
  WKBGeometryTypeName,
  WKBGeometryWriter,
  WKBCoordinateTransform
} from './lib/geometry-converters/wkb/wkb-builder';
export {WKBBuilder} from './lib/geometry-converters/wkb/wkb-builder';
export {triangulateWKB} from './lib/geometry-converters/wkb/triangulate-wkb';
export {
  convertBinaryGeometryToGeometry,
  convertWKBTableToGeoJSON,
  convertWKTToGeometry,
  convertWKBToGeometry,
  convertWKBToBinaryGeometry,
  convertTWKBToGeometry,
  convertGeometryToWKT,
  convertGeometryToWKB,
  convertGeometryToTWKB
} from './deprecated';

// CRS
export type {WKTCRS, ParseWKTCRSOptions} from './lib//wkt-crs/parse-wkt-crs';
export {parseWKTCRS} from './lib//wkt-crs/parse-wkt-crs';
export type {EncodeWKTCRSOptions} from './lib//wkt-crs/encode-wkt-crs';
export {encodeWKTCRS} from './lib//wkt-crs/encode-wkt-crs';

// EXPERIMENTAL APIs

export {encodeHex, decodeHex} from './lib/utils/hex-transcoder';
export {extractNumericPropTypes as _extractNumericPropTypes} from './lib/feature-collection-converters/convert-flat-geojson-to-binary-features';
