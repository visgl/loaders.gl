/* eslint-disable @typescript-eslint/no-var-requires */

import {path} from '@loaders.gl/core/loader-utils';
const {resolve} = path;

declare const __TEST_REPOSITORY_ROOT__: string;

/**
 * Converts a local filesystem path into a Vite-served browser URL when needed.
 */
function resolveTestPath(testPath: string): string {
  if (typeof window !== 'undefined') {
    return `/__loaders_gl_test_fixtures__/${testPath.replace(/^\.\//, '')}`;
  }
  return resolve(testPath);
}

// NOTE - Replace with a transform of ocular-dev-tools aliases?
function makeAliases() {
  return {
    test: resolveTestPath('./test'),
    '@loaders.gl/tiles-3d/3d-tiles/test': resolveTestPath('./modules/tiles-3d/test/3d-tiles'),
    '@loaders.gl/arrow/transport': resolveTestPath('./modules/arrow/src/transport'),
    '@loaders.gl/arrow-geometry/test': resolveTestPath('./modules/arrow-geometry/test'),
    '@loaders.gl/geoarrow/test': resolveTestPath('./modules/geoarrow/test'),
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
    '@loaders.gl/raster/test/geotiff': resolveTestPath('./modules/raster/test/geotiff'),
    '@loaders.gl/gltf/test': resolveTestPath('./modules/gltf/test'),
    '@loaders.gl/tiles-3d/i3s/test': resolveTestPath('./modules/tiles-3d/test/i3s'),
    '@loaders.gl/images/test': resolveTestPath('./modules/images/test'),
    '@loaders.gl/json/test': resolveTestPath('./modules/json/test'),
    '@loaders.gl/kml/test': resolveTestPath('./modules/kml/test'),
    '@loaders.gl/las/test': resolveTestPath('./modules/las/test'),
    '@loaders.gl/core/loader-utils/test': resolveTestPath(
      './modules/core/test/loader-utils-package'
    ),
    '@loaders.gl/raster/test/lerc': resolveTestPath('./modules/raster/test/lerc'),
    '@loaders.gl/tiles/mlt/test': resolveTestPath('./modules/tiles/test/mlt'),
    '@loaders.gl/tiles/mvt/test': resolveTestPath('./modules/tiles/test/mvt'),
    '@loaders.gl/scientific/test/netcdf': resolveTestPath('./modules/scientific/test/netcdf'),
    '@loaders.gl/scientific/test/zarr': resolveTestPath('./modules/scientific/test/zarr'),
    '@loaders.gl/obj/test': resolveTestPath('./modules/obj/test'),
    '@loaders.gl/parquet/test': resolveTestPath('./modules/parquet/test'),
    '@loaders.gl/lance/test': resolveTestPath('./modules/lance/test'),
    '@loaders.gl/orc/test': resolveTestPath('./modules/orc/test'),
    '@loaders.gl/pcd/test': resolveTestPath('./modules/pcd/test'),
    '@loaders.gl/ply/test': resolveTestPath('./modules/ply/test'),
    '@loaders.gl/splats/test': resolveTestPath('./modules/splats/test'),
    '@loaders.gl/stac/test': resolveTestPath('./modules/stac/test'),
    '@loaders.gl/tiles/pmtiles/test': resolveTestPath('./modules/tiles/test/pmtiles'),
    '@loaders.gl/core/polyfills/test': resolveTestPath('./modules/core/test/polyfills-package'),
    '@loaders.gl/potree/test': resolveTestPath('./modules/potree/test'),
    '@loaders.gl/shapefile/test': resolveTestPath('./modules/shapefile/test'),
    '@loaders.gl/core/schema/test': resolveTestPath('./modules/core/test/schema-package'),
    '@loaders.gl/raster/test/terrain': resolveTestPath('./modules/raster/test/terrain'),
    '@loaders.gl/textures/test': resolveTestPath('./modules/textures/test'),
    '@loaders.gl/tile-converter/test': resolveTestPath('./apps/tile-converter/test'),
    '@loaders.gl/tiles/test': resolveTestPath('./modules/tiles/test'),
    '@loaders.gl/traces/test': resolveTestPath('./modules/traces/test'),
    '@loaders.gl/video/test': resolveTestPath('./modules/video/test'),
    '@loaders.gl/wkt/test': resolveTestPath('./modules/wkt/test'),
    '@loaders.gl/wms/test': resolveTestPath('./modules/wms/test'),
    '@loaders.gl/core/worker-utils/test': resolveTestPath(
      './modules/core/test/worker-utils-package'
    ),
    '@loaders.gl/xml/test': resolveTestPath('./modules/xml/test'),
    '@loaders.gl/zip/test': resolveTestPath('./modules/zip/test'),
    // eslint-disable-next-line camelcase
    node_modules: resolveTestPath('./node_modules')
  };
}

export default makeAliases();
