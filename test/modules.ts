// Sets up aliases for file reader

/* eslint-disable @typescript-eslint/no-var-requires */

import ALIASES from './aliases.js';
import {_addAliases} from '@loaders.gl/loader-utils';
import {installFilePolyfills} from '@loaders.gl/polyfills';

_addAliases(ALIASES);
// Install polyfills (primarily for Node)
installFilePolyfills();

// base
import '@loaders.gl/polyfills/test/index';
import '@loaders.gl/worker-utils/test/index';
import '@loaders.gl/math/test/index';

// Core
import '@loaders.gl/loader-utils/test/index';
import '@loaders.gl/core/test/index';

// Image Formats
import '@loaders.gl/images/test/index';
import '@loaders.gl/textures/test/index';
// import '@loaders.gl/video/test/index';
// import '@loaders.gl/geotiff/test/index';
// import '@loaders.gl/zarr/test/index';
import '@loaders.gl/netcdf/test/index';

// Pointcloud/Mesh Formats
import '@loaders.gl/draco/test/index';
import '@loaders.gl/las/test/index';
import '@loaders.gl/obj/test/index';
import '@loaders.gl/pcd/test/index';
import '@loaders.gl/ply/test/index';
import '@loaders.gl/terrain/test/index';

// Scenegraph Formats
import '@loaders.gl/gltf/test/index';

// 3D Tile Formats
import '@loaders.gl/3d-tiles/test/index';
import '@loaders.gl/i3s/test/index';
import '@loaders.gl/potree/test/index';
import '@loaders.gl/tiles/test/index';

// Geospatial Formats
import '@loaders.gl/flatgeobuf/test/index';
import '@loaders.gl/geopackage/test/index';
import '@loaders.gl/gis/test/index';
import '@loaders.gl/kml/test/index';
import '@loaders.gl/mvt/test/index';
import '@loaders.gl/shapefile/test/index';
import '@loaders.gl/wkt/test/index';

// Table Formats
import '@loaders.gl/schema/test/index';
import '@loaders.gl/arrow/test/index.js';
import '@loaders.gl/csv/test/index.js';
import '@loaders.gl/json/test/index.js';
import '@loaders.gl/excel/test/index.js';
import '@loaders.gl/parquet/test/index.js';

// Archive Formats
import '@loaders.gl/compression/test/index.js';
// import '@loaders.gl/crypto/test/index.js';
import '@loaders.gl/zip/test/index.js';

// Cli
export const isBrowser =
  typeof process !== 'object' || String(process) !== '[object process]' || process.browser;
if (!isBrowser) {
  require('@loaders.gl/tile-converter/test');
}
