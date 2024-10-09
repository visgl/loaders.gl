// Types from `@loaders.gl/schema`

// Geo Metadata
// import {default as GEOPARQUET_METADATA_SCHEMA} from './lib/geo/geoparquet-metadata-schema.json';
// export {GEOPARQUET_METADATA_SCHEMA};
export {GEOPARQUET_METADATA_JSON_SCHEMA} from './lib/geoarrow/geoparquet-metadata-schema';

export type {GeoMetadata} from './lib/geoarrow/geoparquet-metadata';
export {
  getGeoMetadata,
  setGeoMetadata,
  unpackGeoMetadata
} from './lib/geoarrow/geoparquet-metadata';
export {unpackJSONStringMetadata} from './lib/geoarrow/geoparquet-metadata';

// Utilities
export {transformBinaryCoords, transformGeoJsonCoords} from './lib/api/transform-coordinates';

// Binary Geometries
// export {flatGeojsonToBinary} from './lib/binary-features/flat-geojson-to-binary';
// export {geojsonToBinary} from './lib/binary-features/geojson-to-binary';
// export {geojsonToFlatGeojson} from './lib/binary-features/geojson-to-flat-geojson';
// export {binaryToGeojson, binaryToGeometry} from './lib/binary-features/binary-to-geojson';

// TABLE CONVERSION
export {convertGeoArrowToTable} from './lib/table-converters/convert-geoarrow-table';
export {convertWKBTableToGeoJSON} from './lib/table-converters/convert-wkb-table-to-geojson';

// FEATURE COLLECTION CONVERSION
export {
  convertFlatGeojsonToBinaryFeatureCollection,
  // deprecated
  convertFlatGeojsonToBinaryFeatureCollection as flatGeojsonToBinary
} from './lib/feature-collection-converters/convert-flat-geojson-to-binary-features';
export {
  convertGeojsonToBinaryFeatureCollection,
  // deprecated
  convertGeojsonToBinaryFeatureCollection as geojsonToBinary
} from './lib/feature-collection-converters/convert-geojson-to-binary-features';
export {
  convertGeojsonToFlatGeojson,
  // deprecated
  convertGeojsonToFlatGeojson as geojsonToFlatGeojson
} from './lib/feature-collection-converters/convert-geojson-to-flat-geojson';
export {
  convertBinaryFeatureCollectionToGeojson,
  convertBinaryFeatureCollectionToGeojson as binaryToGeojson
} from './lib/feature-collection-converters/convert-binary-features-to-geojson';

// GEOMETRY ENCODING DETECTION
export {isTWKB} from './lib/geometry-converters/wkt/convert-twkb-to-geojson';
export {isWKB} from './lib/geometry-converters/wkt/helpers/parse-wkb-header';
export {isWKT} from './lib/geometry-converters/wkt/convert-wkt-to-geojson';

export type {WKBHeader} from './lib/geometry-converters/wkt/helpers/parse-wkb-header';
export {WKT_MAGIC_STRINGS} from './lib/geometry-converters/wkt/convert-wkt-to-geojson';

// GEOMETRY CONVERSION
export {convertBinaryGeometryToGeometry} from './lib/geometry-converters/convert-binary-geometry-to-geojson';

export {convertWKTToGeometry} from './lib/geometry-converters/wkt/convert-wkt-to-geojson';
export {convertWKBToGeometry} from './lib/geometry-converters/wkt/convert-wkb-to-geojson';
export {convertWKBToBinaryGeometry} from './lib/geometry-converters/wkt/convert-wkb-to-binary-geometry';
export {convertTWKBToGeometry} from './lib/geometry-converters/wkt/convert-twkb-to-geojson';

export {convertGeometryToWKT} from './lib/geometry-converters/wkt/convert-geojson-to-wkt';
export {convertGeometryToWKB} from './lib/geometry-converters/wkt/convert-geojson-to-wkb';
export {convertGeometryToTWKB} from './lib/geometry-converters/wkt/convert-geojson-to-twkb';

// CRS
export type {WKTCRS, ParseWKTCRSOptions} from './lib//wkt-crs/parse-wkt-crs';
export {parseWKTCRS} from './lib//wkt-crs/parse-wkt-crs';
export type {EncodeWKTCRSOptions} from './lib//wkt-crs/encode-wkt-crs';
export {encodeWKTCRS} from './lib//wkt-crs/encode-wkt-crs';

// GEOARROW
export type {
  BinaryDataFromGeoArrow,
  BinaryGeometriesFromArrowOptions
} from './lib/feature-collection-converters/convert-geoarrow-to-binary-features';
export {
  convertGeoArrowToBinaryFeatureCollection,
  // deprecated
  convertGeoArrowToBinaryFeatureCollection as getBinaryGeometriesFromArrow,
  getBinaryGeometryTemplate,
  getTriangleIndices,
  getMeanCentersFromBinaryGeometries
} from './lib/feature-collection-converters/convert-geoarrow-to-binary-features';

export {getGeoArrowGeometryTypeInfo} from './lib/geoarrow/get-geoarrow-geometry-type-info';
export {convertGeoArrowGeometryToGeoJSON} from './lib/geometry-converters/convert-geoarrow-to-geojson';
export {getGeometryColumnsFromSchema} from './lib/geoarrow/geoarrow-metadata';
export {updateBoundsFromGeoArrowSamples} from './lib/geoarrow/get-arrow-bounds';

// EXPERIMENTAL APIs

export {encodeHex, decodeHex} from './lib/utils/hex-transcoder';
export {extractGeometryInfo as _extractGeometryInfo} from './lib/feature-collection-converters/helpers/extract-geometry-info';
export {extractNumericPropTypes as _extractNumericPropTypes} from './lib/feature-collection-converters/convert-flat-geojson-to-binary-features';
