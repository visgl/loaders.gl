/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

// NOTE - Replace with a transform of ocular-dev-tools aliases?
function makeAliases(basename = __dirname) {
  return {
    test: path.resolve(basename, '../test'),
    '@loaders.gl/3d-tiles/test': path.resolve(basename, '../modules/3d-tiles/test'),
    '@loaders.gl/arrow/test': path.resolve(basename, '../modules/arrow/test'),
    '@loaders.gl/compression/test': path.resolve(basename, '../modules/compression/test'),
    '@loaders.gl/crypto/test': path.resolve(basename, '../modules/crypto/test'),
    '@loaders.gl/core/test': path.resolve(basename, '../modules/core/test'),
    '@loaders.gl/csv/test': path.resolve(basename, '../modules/csv/test'),
    '@loaders.gl/draco/test': path.resolve(basename, '../modules/draco/test'),
    '@loaders.gl/excel/test': path.resolve(basename, '../modules/excel/test'),
    '@loaders.gl/flatgeobuf/test': path.resolve(basename, '../modules/flatgeobuf/test'),
    '@loaders.gl/geopackage/test': path.resolve(basename, '../modules/geopackage/test'),
    '@loaders.gl/geotiff/test': path.resolve(basename, '../modules/geotiff/test'),
    '@loaders.gl/gis/test': path.resolve(basename, '../modules/gis/test'),
    '@loaders.gl/gltf/test': path.resolve(basename, '../modules/gltf/test'),
    '@loaders.gl/i3s/test': path.resolve(basename, '../modules/i3s/test'),
    '@loaders.gl/images/test': path.resolve(basename, '../modules/images/test'),
    '@loaders.gl/json/test': path.resolve(basename, '../modules/json/test'),
    '@loaders.gl/kml/test': path.resolve(basename, '../modules/kml/test'),
    '@loaders.gl/las/test': path.resolve(basename, '../modules/las/test'),
    '@loaders.gl/mvt/test': path.resolve(basename, '../modules/mvt/test'),
    '@loaders.gl/netcdf/test': path.resolve(basename, '../modules/netcdf/test'),
    '@loaders.gl/obj/test': path.resolve(basename, '../modules/obj/test'),
    '@loaders.gl/parquet/test': path.resolve(basename, '../modules/parquet/test'),
    '@loaders.gl/pcd/test': path.resolve(basename, '../modules/pcd/test'),
    '@loaders.gl/ply/test': path.resolve(basename, '../modules/ply/test'),
    '@loaders.gl/polyfills/test': path.resolve(basename, '../modules/polyfills/test'),
    '@loaders.gl/potree/test': path.resolve(basename, '../modules/potree/test'),
    '@loaders.gl/shapefile/test': path.resolve(basename, '../modules/shapefile/test'),
    '@loaders.gl/schema/test': path.resolve(basename, '../modules/schema/test'),
    '@loaders.gl/terrain/test': path.resolve(basename, '../modules/terrain/test'),
    '@loaders.gl/textures/test': path.resolve(basename, '../modules/textures/test'),
    '@loaders.gl/tile-converter/test': path.resolve(basename, '../modules/tile-converter/test'),
    '@loaders.gl/tiles/test': path.resolve(basename, '../modules/tiles/test'),
    '@loaders.gl/video/test': path.resolve(basename, '../modules/video/test'),
    '@loaders.gl/wkt/test': path.resolve(basename, '../modules/wkt/test'),
    '@loaders.gl/wms/test': path.resolve(basename, '../modules/wms/test'),
    '@loaders.gl/worker-utils/test': path.resolve(basename, '../modules/worker-utils/test'),
    '@loaders.gl/xml/test': path.resolve(basename, '../modules/xml/test'),
    '@loaders.gl/zarr/test': path.resolve(basename, '../modules/zarr/test'),
    '@loaders.gl/zip/test': path.resolve(basename, '../modules/zip/test'),
    'node_modules': path.resolve(basename, '../node_modules')
  };
}

module.exports = makeAliases();
