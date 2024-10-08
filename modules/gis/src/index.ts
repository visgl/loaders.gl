// Types from `@loaders.gl/schema`

// Geo Metadata
// import {default as GEOPARQUET_METADATA_SCHEMA} from './lib/geo/geoparquet-metadata-schema.json';
// export {GEOPARQUET_METADATA_SCHEMA};
export {GEOPARQUET_METADATA_JSON_SCHEMA} from './lib/geo/geoparquet-metadata-schema';

export type {GeoMetadata} from './lib/geo/geoparquet-metadata';
export {getGeoMetadata, setGeoMetadata, unpackGeoMetadata} from './lib/geo/geoparquet-metadata';
export {unpackJSONStringMetadata} from './lib/geo/geoparquet-metadata';

// Table conversion
export {convertGeoArrowToTable} from './lib/tables/convert-geoarrow-table';
export {convertWKBTableToGeoJSON} from './lib/tables/convert-wkb-table-to-geojson';

// Binary Geometries
export {flatGeojsonToBinary} from './lib/binary-features/flat-geojson-to-binary';
export {geojsonToBinary} from './lib/binary-features/geojson-to-binary';
export {geojsonToFlatGeojson} from './lib/binary-features/geojson-to-flat-geojson';
export {binaryToGeojson, binaryToGeometry} from './lib/binary-features/binary-to-geojson';
export {transformBinaryCoords, transformGeoJsonCoords} from './lib/api/transform-coordinates';

// WKT

// GEOMETRY ENCODING DETECTION
export {isTWKB} from './lib/converters/geometry/wkt/convert-twkb-to-geojson';
export {isWKB} from './lib/converters/geometry/wkt/helpers/parse-wkb-header';
export {isWKT} from './lib/converters/geometry/wkt/convert-wkt-to-geojson';

export type {WKBHeader} from './lib/converters/geometry/wkt/helpers/parse-wkb-header';
export {WKT_MAGIC_STRINGS} from './lib/converters/geometry/wkt/convert-wkt-to-geojson';

// GEOMETRY CONVERSION
// export {convertBinaryGeometryToGeoJSON} from './lib/converters/geometry/convert-binary-geometry-to-geojson';

export {convertWKTToGeoJSON} from './lib/converters/geometry/wkt/convert-wkt-to-geojson';
export {convertWKBToGeoJSON} from './lib/converters/geometry/wkt/convert-wkb-to-geojson';
export {convertTWKBToGeoJSON} from './lib/converters/geometry/wkt/convert-twkb-to-geojson';
export {convertWKBToBinaryGeometry} from './lib/converters/geometry/wkt/convert-wkb-to-binary-geometry';

export {convertGeoJSONToWKT} from './lib/converters/geometry/wkt/convert-geojson-to-wkt';
export {convertGeoJSONToWKB} from './lib/converters/geometry/wkt/convert-geojson-to-wkb';
export {convertGeoJSONToTWKB} from './lib/converters/geometry/wkt/convert-geojson-to-twkb';

// CRS
export type {WKTCRS, ParseWKTCRSOptions} from './lib//wkt-crs/parse-wkt-crs';
export {parseWKTCRS} from './lib//wkt-crs/parse-wkt-crs';
export type {EncodeWKTCRSOptions} from './lib//wkt-crs/encode-wkt-crs';
export {encodeWKTCRS} from './lib//wkt-crs/encode-wkt-crs';

// Arrow Geometries
export type {
  BinaryDataFromGeoArrow,
  BinaryGeometriesFromArrowOptions
} from './lib/geoarrow/convert-geoarrow-to-binary-geometry';
export {
  getBinaryGeometryTemplate,
  getBinaryGeometriesFromArrow,
  getTriangleIndices,
  getMeanCentersFromBinaryGeometries
} from './lib/geoarrow/convert-geoarrow-to-binary-geometry';

export {parseGeometryFromArrow} from './lib/geoarrow/convert-geoarrow-to-geojson-geometry';
export {getGeometryColumnsFromSchema} from './lib/geoarrow/geoarrow-metadata';
export {updateBoundsFromGeoArrowSamples} from './lib/geoarrow/get-arrow-bounds';

// EXPERIMENTAL APIs

export {encodeHex, decodeHex} from './lib/utils/hex-transcoder';
