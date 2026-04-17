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
