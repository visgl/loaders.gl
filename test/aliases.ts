/* eslint-disable @typescript-eslint/no-var-requires */

import {path} from '@loaders.gl/loader-utils';
const {resolve} = path;

// NOTE - Replace with a transform of ocular-dev-tools aliases?
function makeAliases() {
  return {
    test: resolve('./test'),
    '@loaders.gl/3d-tiles/test': resolve('./modules/3d-tiles/test'),
    '@loaders.gl/arrow/test': resolve('./modules/arrow/test'),
    '@loaders.gl/bson/test': resolve('./modules/bson/test'),
    '@loaders.gl/compression/test': resolve('./modules/compression/test'),
    '@loaders.gl/crypto/test': resolve('./modules/crypto/test'),
    '@loaders.gl/core/test': resolve('./modules/core/test'),
    '@loaders.gl/csv/test': resolve('./modules/csv/test'),
    '@loaders.gl/draco/test': resolve('./modules/draco/test'),
    '@loaders.gl/excel/test': resolve('./modules/excel/test'),
    '@loaders.gl/flatgeobuf/test': resolve('./modules/flatgeobuf/test'),
    '@loaders.gl/geopackage/test': resolve('./modules/geopackage/test'),
    '@loaders.gl/geotiff/test': resolve('./modules/geotiff/test'),
    '@loaders.gl/gis/test': resolve('./modules/gis/test'),
    '@loaders.gl/gltf/test': resolve('./modules/gltf/test'),
    '@loaders.gl/i3s/test': resolve('./modules/i3s/test'),
    '@loaders.gl/images/test': resolve('./modules/images/test'),
    '@loaders.gl/json/test': resolve('./modules/json/test'),
    '@loaders.gl/kml/test': resolve('./modules/kml/test'),
    '@loaders.gl/las/test': resolve('./modules/las/test'),
    '@loaders.gl/lerc/test': resolve('./modules/lerc/test'),
    '@loaders.gl/mvt/test': resolve('./modules/mvt/test'),
    '@loaders.gl/netcdf/test': resolve('./modules/netcdf/test'),
    '@loaders.gl/obj/test': resolve('./modules/obj/test'),
    '@loaders.gl/parquet/test': resolve('./modules/parquet/test'),
    '@loaders.gl/pcd/test': resolve('./modules/pcd/test'),
    '@loaders.gl/ply/test': resolve('./modules/ply/test'),
    '@loaders.gl/pmtiles/test': resolve('./modules/pmtiles/test'),
    '@loaders.gl/polyfills/test': resolve('./modules/polyfills/test'),
    '@loaders.gl/potree/test': resolve('./modules/potree/test'),
    '@loaders.gl/shapefile/test': resolve('./modules/shapefile/test'),
    '@loaders.gl/schema/test': resolve('./modules/schema/test'),
    '@loaders.gl/terrain/test': resolve('./modules/terrain/test'),
    '@loaders.gl/textures/test': resolve('./modules/textures/test'),
    '@loaders.gl/tile-converter/test': resolve('./modules/tile-converter/test'),
    '@loaders.gl/tiles/test': resolve('./modules/tiles/test'),
    '@loaders.gl/video/test': resolve('./modules/video/test'),
    '@loaders.gl/wkt/test': resolve('./modules/wkt/test'),
    '@loaders.gl/wms/test': resolve('./modules/wms/test'),
    '@loaders.gl/worker-utils/test': resolve('./modules/worker-utils/test'),
    '@loaders.gl/xml/test': resolve('./modules/xml/test'),
    '@loaders.gl/zarr/test': resolve('./modules/zarr/test'),
    '@loaders.gl/zip/test': resolve('./modules/zip/test'),
    'node_modules': resolve('./node_modules')
  };
}

export default makeAliases();
