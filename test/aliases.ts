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
    '@loaders.gl/tables/arrow/transport': resolveTestPath('./modules/tables/src/arrow/transport'),
    '@loaders.gl/arrow-geometry/test': resolveTestPath('./modules/arrow-geometry/test'),
    '@loaders.gl/geoarrow/test': resolveTestPath('./modules/geoarrow/test'),
    '@loaders.gl/tables/arrow/test': resolveTestPath('./modules/tables/test/arrow'),
    '@loaders.gl/tables/bson/test': resolveTestPath('./modules/tables/test/bson'),
    '@loaders.gl/compression/test': resolveTestPath('./modules/compression/test'),
    '@loaders.gl/crypto/test': resolveTestPath('./modules/crypto/test'),
    '@loaders.gl/core/test': resolveTestPath('./modules/core/test'),
    '@loaders.gl/tables/csv/test': resolveTestPath('./modules/tables/test/csv'),
    '@loaders.gl/draco/test': resolveTestPath('./modules/draco/test'),
    '@loaders.gl/tables/excel/test': resolveTestPath('./modules/tables/test/excel'),
    '@loaders.gl/geospatial/flatgeobuf/test': resolveTestPath(
      './modules/geospatial/test/flatgeobuf'
    ),
    '@loaders.gl/geospatial/geopackage/test': resolveTestPath(
      './modules/geospatial/test/geopackage'
    ),
    '@loaders.gl/raster/test/geotiff': resolveTestPath('./modules/raster/test/geotiff'),
    '@loaders.gl/gltf/test': resolveTestPath('./modules/gltf/test'),
    '@loaders.gl/tiles-3d/i3s/test': resolveTestPath('./modules/tiles-3d/test/i3s'),
    '@loaders.gl/images/test': resolveTestPath('./modules/images/test'),
    '@loaders.gl/tables/json/test': resolveTestPath('./modules/tables/test/json'),
    '@loaders.gl/geospatial/kml/test': resolveTestPath('./modules/geospatial/test/kml'),
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
    '@loaders.gl/tables/parquet/test': resolveTestPath('./modules/tables/test/parquet'),
    '@loaders.gl/tables/lance/test': resolveTestPath('./modules/tables/test/lance'),
    '@loaders.gl/tables/orc/test': resolveTestPath('./modules/tables/test/orc'),
    '@loaders.gl/pcd/test': resolveTestPath('./modules/pcd/test'),
    '@loaders.gl/ply/test': resolveTestPath('./modules/ply/test'),
    '@loaders.gl/splats/test': resolveTestPath('./modules/splats/test'),
    '@loaders.gl/ogc/stac/test': resolveTestPath('./modules/ogc/test/stac'),
    '@loaders.gl/tiles/pmtiles/test': resolveTestPath('./modules/tiles/test/pmtiles'),
    '@loaders.gl/core/polyfills/test': resolveTestPath('./modules/core/test/polyfills-package'),
    '@loaders.gl/tiles-3d/potree/test': resolveTestPath('./modules/tiles-3d/test/potree'),
    '@loaders.gl/geospatial/shapefile/test': resolveTestPath('./modules/geospatial/test/shapefile'),
    '@loaders.gl/core/schema/test': resolveTestPath('./modules/core/test/schema-package'),
    '@loaders.gl/raster/test/terrain': resolveTestPath('./modules/raster/test/terrain'),
    '@loaders.gl/textures/test': resolveTestPath('./modules/textures/test'),
    '@loaders.gl/tile-converter/test': resolveTestPath('./apps/tile-converter/test'),
    '@loaders.gl/tiles/test': resolveTestPath('./modules/tiles/test'),
    '@loaders.gl/traces/test': resolveTestPath('./modules/traces/test'),
    '@loaders.gl/video/test': resolveTestPath('./modules/video/test'),
    '@loaders.gl/wkt/test': resolveTestPath('./modules/wkt/test'),
    '@loaders.gl/ogc/wms/test': resolveTestPath('./modules/ogc/test/wms'),
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
