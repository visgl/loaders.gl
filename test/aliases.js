/* eslint-disable @typescript-eslint/no-var-requires */

import {path} from '@loaders.gl/loader-utils';
const {resolve} = path;

// NOTE - Replace with a transform of ocular-dev-tools aliases?
function makeAliases(basename = __dirname) {
  return {
    test: resolve(basename, '../test'),
    '@loaders.gl/3d-tiles/test': resolve(basename, '../modules/3d-tiles/test'),
    '@loaders.gl/arrow/test': resolve(basename, '../modules/arrow/test'),
    '@loaders.gl/bson/test': resolve(basename, '../modules/bson/test'),
    '@loaders.gl/compression/test': resolve(basename, '../modules/compression/test'),
    '@loaders.gl/crypto/test': resolve(basename, '../modules/crypto/test'),
    '@loaders.gl/core/test': resolve(basename, '../modules/core/test'),
    '@loaders.gl/csv/test': resolve(basename, '../modules/csv/test'),
    '@loaders.gl/draco/test': resolve(basename, '../modules/draco/test'),
    '@loaders.gl/excel/test': resolve(basename, '../modules/excel/test'),
    '@loaders.gl/flatgeobuf/test': resolve(basename, '../modules/flatgeobuf/test'),
    '@loaders.gl/geopackage/test': resolve(basename, '../modules/geopackage/test'),
    '@loaders.gl/geotiff/test': resolve(basename, '../modules/geotiff/test'),
    '@loaders.gl/gis/test': resolve(basename, '../modules/gis/test'),
    '@loaders.gl/gltf/test': resolve(basename, '../modules/gltf/test'),
    '@loaders.gl/i3s/test': resolve(basename, '../modules/i3s/test'),
    '@loaders.gl/images/test': resolve(basename, '../modules/images/test'),
    '@loaders.gl/json/test': resolve(basename, '../modules/json/test'),
    '@loaders.gl/kml/test': resolve(basename, '../modules/kml/test'),
    '@loaders.gl/las/test': resolve(basename, '../modules/las/test'),
    '@loaders.gl/mvt/test': resolve(basename, '../modules/mvt/test'),
    '@loaders.gl/netcdf/test': resolve(basename, '../modules/netcdf/test'),
    '@loaders.gl/obj/test': resolve(basename, '../modules/obj/test'),
    '@loaders.gl/parquet/test': resolve(basename, '../modules/parquet/test'),
    '@loaders.gl/pcd/test': resolve(basename, '../modules/pcd/test'),
    '@loaders.gl/ply/test': resolve(basename, '../modules/ply/test'),
    '@loaders.gl/polyfills/test': resolve(basename, '../modules/polyfills/test'),
    '@loaders.gl/potree/test': resolve(basename, '../modules/potree/test'),
    '@loaders.gl/shapefile/test': resolve(basename, '../modules/shapefile/test'),
    '@loaders.gl/schema/test': resolve(basename, '../modules/schema/test'),
    '@loaders.gl/terrain/test': resolve(basename, '../modules/terrain/test'),
    '@loaders.gl/textures/test': resolve(basename, '../modules/textures/test'),
    '@loaders.gl/tile-converter/test': resolve(basename, '../modules/tile-converter/test'),
    '@loaders.gl/tiles/test': resolve(basename, '../modules/tiles/test'),
    '@loaders.gl/video/test': resolve(basename, '../modules/video/test'),
    '@loaders.gl/wkt/test': resolve(basename, '../modules/wkt/test'),
    '@loaders.gl/wms/test': resolve(basename, '../modules/wms/test'),
    '@loaders.gl/worker-utils/test': resolve(basename, '../modules/worker-utils/test'),
    '@loaders.gl/xml/test': resolve(basename, '../modules/xml/test'),
    '@loaders.gl/zarr/test': resolve(basename, '../modules/zarr/test'),
    '@loaders.gl/zip/test': resolve(basename, '../modules/zip/test'),
    'node_modules': resolve(basename, '../node_modules')
  };
}

export default makeAliases();
