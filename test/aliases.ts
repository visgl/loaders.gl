/* eslint-disable @typescript-eslint/no-var-requires */

import {path} from '@loaders.gl/loader-utils';
const {resolve} = path;

/**
 * Converts a local filesystem path into a Vite-served browser URL when needed.
 */
function resolveTestPath(testPath: string): string {
  if (typeof window !== 'undefined') {
    return `/@fs/${testPath.replace(/^\.\//, '')}`;
  }
  return resolve(testPath);
}

// NOTE - Replace with a transform of ocular-dev-tools aliases?
function makeAliases() {
  return {
    test: resolveTestPath('./test'),
    '@loaders.gl/3d-tiles/test': resolveTestPath('./modules/3d-tiles/test'),
    '@loaders.gl/arrow/test': resolveTestPath('./modules/arrow/test'),
    '@loaders.gl/bson/test': resolveTestPath('./modules/bson/test'),
    '@loaders.gl/compression/test': resolveTestPath('./modules/compression/test'),
    '@loaders.gl/crypto/test': resolveTestPath('./modules/crypto/test'),
    '@loaders.gl/core/test': resolveTestPath('./modules/core/test'),
    '@loaders.gl/csv/test': resolveTestPath('./modules/csv/test'),
    '@loaders.gl/draco/test': resolveTestPath('./modules/draco/test'),
    '@loaders.gl/excel/test': resolveTestPath('./modules/excel/test'),
    '@loaders.gl/flatgeobuf/test': resolveTestPath('./modules/flatgeobuf/test'),
    '@loaders.gl/geopackage/test': resolveTestPath('./modules/geopackage/test'),
    '@loaders.gl/geotiff/test': resolveTestPath('./modules/geotiff/test'),
    '@loaders.gl/gis/test': resolveTestPath('./modules/gis/test'),
    '@loaders.gl/gltf/test': resolveTestPath('./modules/gltf/test'),
    '@loaders.gl/i3s/test': resolveTestPath('./modules/i3s/test'),
    '@loaders.gl/images/test': resolveTestPath('./modules/images/test'),
    '@loaders.gl/json/test': resolveTestPath('./modules/json/test'),
    '@loaders.gl/kml/test': resolveTestPath('./modules/kml/test'),
    '@loaders.gl/las/test': resolveTestPath('./modules/las/test'),
    '@loaders.gl/lerc/test': resolveTestPath('./modules/lerc/test'),
    '@loaders.gl/mlt/test': resolveTestPath('./modules/mlt/test'),
    '@loaders.gl/mvt/test': resolveTestPath('./modules/mvt/test'),
    '@loaders.gl/netcdf/test': resolveTestPath('./modules/netcdf/test'),
    '@loaders.gl/obj/test': resolveTestPath('./modules/obj/test'),
    '@loaders.gl/parquet/test': resolveTestPath('./modules/parquet/test'),
    '@loaders.gl/pcd/test': resolveTestPath('./modules/pcd/test'),
    '@loaders.gl/ply/test': resolveTestPath('./modules/ply/test'),
    '@loaders.gl/splats/test': resolveTestPath('./modules/splats/test'),
    '@loaders.gl/pmtiles/test': resolveTestPath('./modules/pmtiles/test'),
    '@loaders.gl/polyfills/test': resolveTestPath('./modules/polyfills/test'),
    '@loaders.gl/potree/test': resolveTestPath('./modules/potree/test'),
    '@loaders.gl/shapefile/test': resolveTestPath('./modules/shapefile/test'),
    '@loaders.gl/schema/test': resolveTestPath('./modules/schema/test'),
    '@loaders.gl/terrain/test': resolveTestPath('./modules/terrain/test'),
    '@loaders.gl/textures/test': resolveTestPath('./modules/textures/test'),
    '@loaders.gl/tile-converter/test': resolveTestPath('./apps/tile-converter/test'),
    '@loaders.gl/tiles/test': resolveTestPath('./modules/tiles/test'),
    '@loaders.gl/video/test': resolveTestPath('./modules/video/test'),
    '@loaders.gl/wkt/test': resolveTestPath('./modules/wkt/test'),
    '@loaders.gl/wms/test': resolveTestPath('./modules/wms/test'),
    '@loaders.gl/worker-utils/test': resolveTestPath('./modules/worker-utils/test'),
    '@loaders.gl/xml/test': resolveTestPath('./modules/xml/test'),
    '@loaders.gl/zarr/test': resolveTestPath('./modules/zarr/test'),
    '@loaders.gl/zip/test': resolveTestPath('./modules/zip/test'),
    // eslint-disable-next-line camelcase
    node_modules: resolveTestPath('./node_modules')
  };
}

export default makeAliases();
