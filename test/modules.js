// Sets up aliases for file reader

import ALIASES from './aliases.js';
import {_addAliases} from '@loaders.gl/loader-utils';
import {installFilePolyfills} from '@loaders.gl/polyfills';

_addAliases(ALIASES);
// Install polyfills (primarily for Node)
installFilePolyfills();

// base
// import '@loaders.gl/polyfills/test';
// import '@loaders.gl/worker-utils/test';
// import '@loaders.gl/math/test';
import '@loaders.gl/type-analyzer/test';
// import '@loaders.gl/schema/test';

// // Core
// import '@loaders.gl/loader-utils/test';
// import '@loaders.gl/core/test';

// Table Formats
// import '@loaders.gl/arrow/test';
// import '@loaders.gl/csv/test';
// import '@loaders.gl/json/test';
// import '@loaders.gl/excel/test';
// import '@loaders.gl/parquet/test';
// import '@loaders.gl/xml/test';

// // Image Formats
// import '@loaders.gl/images/test';
// import '@loaders.gl/textures/test';
// // import '@loaders.gl/video/test';
// // import '@loaders.gl/geotiff/test';
// // import '@loaders.gl/zarr/test';
// import '@loaders.gl/netcdf/test';

// // Pointcloud/Mesh Formats
// import '@loaders.gl/draco/test';
// import '@loaders.gl/las/test';
// import '@loaders.gl/obj/test';
// import '@loaders.gl/pcd/test';
// import '@loaders.gl/ply/test';
// import '@loaders.gl/terrain/test';

// // Scenegraph Formats
// import '@loaders.gl/gltf/test';

// // 3D Tile Formats
// import '@loaders.gl/3d-tiles/test';
// import '@loaders.gl/i3s/test';
// import '@loaders.gl/potree/test';
// import '@loaders.gl/tiles/test';

// // Geospatial Formats
// import '@loaders.gl/flatgeobuf/test';
// import '@loaders.gl/geopackage/test';
// import '@loaders.gl/gis/test';
// import '@loaders.gl/kml/test';
// import '@loaders.gl/mvt/test';
// import '@loaders.gl/shapefile/test';
// import '@loaders.gl/wkt/test';
// import '@loaders.gl/wms/test';

// // Archive Formats
// import '@loaders.gl/compression/test';
// import '@loaders.gl/crypto/test';
// import '@loaders.gl/zip/test';

// // Tile converter
// import '@loaders.gl/tile-converter/test';
