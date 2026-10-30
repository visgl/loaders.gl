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
    '@loaders.gl/documents/test': resolveTestPath('./modules/documents/test'),
    test: resolveTestPath('./test'),
    '@loaders.gl/tiles-3d/3d-tiles/test': resolveTestPath('./modules/tiles-3d/test/3d-tiles'),
    '@loaders.gl/tables/arrow/transport': resolveTestPath('./modules/tables/src/arrow/transport'),
    '@loaders.gl/core/arrow-geometry/test': resolveTestPath('./modules/core/test/arrow-geometry'),
    '@loaders.gl/core/geoarrow/test': resolveTestPath('./modules/core/test/geoarrow'),
    '@loaders.gl/tables/arrow/test': resolveTestPath('./modules/tables/test/arrow'),
    '@loaders.gl/documents/test/bson': resolveTestPath('./modules/documents/test/bson'),
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
    '@loaders.gl/scene/gltf/test': resolveTestPath('./modules/scene/test/gltf'),
    '@loaders.gl/tiles-3d/i3s/test': resolveTestPath('./modules/tiles-3d/test/i3s'),
    '@loaders.gl/images/test': resolveTestPath('./modules/images/test'),
    '@loaders.gl/tables/json/test': resolveTestPath('./modules/tables/test/json'),
    '@loaders.gl/geospatial/kml/test': resolveTestPath('./modules/geospatial/test/kml'),
    '@loaders.gl/pointclouds/las/test': resolveTestPath('./modules/pointclouds/test/las'),
    '@loaders.gl/core/loader-utils/test': resolveTestPath(
      './modules/core/test/loader-utils-package'
    ),
    '@loaders.gl/raster/test/lerc': resolveTestPath('./modules/raster/test/lerc'),
    '@loaders.gl/tiles/mlt/test': resolveTestPath('./modules/tiles/test/mlt'),
    '@loaders.gl/tiles/mvt/test': resolveTestPath('./modules/tiles/test/mvt'),
    '@loaders.gl/scientific/test/netcdf': resolveTestPath('./modules/scientific/test/netcdf'),
    '@loaders.gl/scientific/test/zarr': resolveTestPath('./modules/scientific/test/zarr'),
    '@loaders.gl/scene/obj/test': resolveTestPath('./modules/scene/test/obj'),
    '@loaders.gl/tables/parquet/test': resolveTestPath('./modules/tables/test/parquet'),
    '@loaders.gl/tables/lance/test': resolveTestPath('./modules/tables/test/lance'),
    '@loaders.gl/tables/orc/test': resolveTestPath('./modules/tables/test/orc'),
    '@loaders.gl/pointclouds/pcd/test': resolveTestPath('./modules/pointclouds/test/pcd'),
    '@loaders.gl/pointclouds/ply/test': resolveTestPath('./modules/pointclouds/test/ply'),
    '@loaders.gl/splats/test': resolveTestPath('./modules/splats/test'),
    '@loaders.gl/ogc/stac/test': resolveTestPath('./modules/ogc/test/stac'),
    '@loaders.gl/tiles/pmtiles/test': resolveTestPath('./modules/tiles/test/pmtiles'),
    '@loaders.gl/core/polyfills/test': resolveTestPath('./modules/core/test/polyfills-package'),
    '@loaders.gl/tiles-3d/potree/test': resolveTestPath('./modules/tiles-3d/test/potree'),
    '@loaders.gl/geospatial/shapefile/test': resolveTestPath('./modules/geospatial/test/shapefile'),
    '@loaders.gl/core/schema/test': resolveTestPath('./modules/core/test/schema-package'),
    '@loaders.gl/raster/test/terrain': resolveTestPath('./modules/raster/test/terrain'),
    '@loaders.gl/tile-converter/test': resolveTestPath('./apps/tile-converter/test'),
    '@loaders.gl/tiles/test': resolveTestPath('./modules/tiles/test'),
    '@loaders.gl/traces/test': resolveTestPath('./modules/traces/test'),
    '@loaders.gl/geospatial/wkt/test': resolveTestPath('./modules/geospatial/test/wkt'),
    '@loaders.gl/ogc/wms/test': resolveTestPath('./modules/ogc/test/wms'),
    '@loaders.gl/core/worker-utils/test': resolveTestPath(
      './modules/core/test/worker-utils-package'
    ),
    '@loaders.gl/documents/test/xml': resolveTestPath('./modules/documents/test/xml'),
    '@loaders.gl/archives/zip/test': resolveTestPath('./modules/archives/test'),
    // eslint-disable-next-line camelcase
    node_modules: resolveTestPath('./node_modules')
  };
}

export default makeAliases();
