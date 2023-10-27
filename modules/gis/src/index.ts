// Types from `@loaders.gl/schema`

// Geo Metadata
// import {default as GEOPARQUET_METADATA_SCHEMA} from './lib/geo/geoparquet-metadata-schema.json';
// export {GEOPARQUET_METADATA_SCHEMA};
export {GEOPARQUET_METADATA_JSON_SCHEMA} from './lib/geo/geoparquet-metadata-schema';

export type {GeoMetadata} from './lib/geo/geoparquet-metadata';
export {getGeoMetadata, setGeoMetadata, unpackGeoMetadata} from './lib/geo/geoparquet-metadata';
export {unpackJSONStringMetadata} from './lib/geo/geoparquet-metadata';

export type {GeoArrowEncoding, GeoArrowMetadata} from './lib/geo/geoarrow-metadata';
export {getGeometryColumnsFromSchema} from './lib/geo/geoarrow-metadata';

// Table conversion
export {convertWKBTableToGeoJSON} from './lib/tables/convert-table-to-geojson';

// Binary Geometries
export {flatGeojsonToBinary} from './lib/binary-features/flat-geojson-to-binary';
export {geojsonToBinary} from './lib/binary-features/geojson-to-binary';
export {geojsonToFlatGeojson} from './lib/binary-features/geojson-to-flat-geojson';
export {binaryToGeojson, binaryToGeometry} from './lib/binary-features/binary-to-geojson';
export {transformBinaryCoords, transformGeoJsonCoords} from './lib/binary-features/transform';
