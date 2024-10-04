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
export {transformBinaryCoords, transformGeoJsonCoords} from './lib/binary-features/transform';

// WKT

export {parseWKT, isWKT, WKT_MAGIC_STRINGS} from './lib/wkt/parse-wkt';

export {encodeWKT} from './lib/wkt/encode-wkt';

export {isWKB} from './lib/wkt/parse-wkb-header';
export {parseWKB} from './lib/wkt/parse-wkb';
export {encodeWKB} from './lib/wkt/encode-wkb';

export {parseTWKB, isTWKB} from './lib/wkt/parse-twkb';
export {encodeTWKB} from './lib/wkt/encode-twkb';

export type {ParseWKTCRSOptions, WKTCRS} from './lib/wkt/parse-wkt-crs';
export {parseWKTCRS} from './lib/wkt/parse-wkt-crs';
export type {EncodeWKTCRSOptions} from './lib/wkt/encode-wkt-crs';
export {encodeWKTCRS} from './lib/wkt/encode-wkt-crs';

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

export type {WKBHeader} from './lib/wkt/parse-wkb-header';
export {encodeHex, decodeHex} from './lib/utils/hex-transcoder';
