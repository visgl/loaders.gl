// Sets up aliases for file reader

/* eslint-disable @typescript-eslint/no-var-requires */

import ALIASES from './aliases.js';
import {_addAliases} from '@loaders.gl/loader-utils';
import {installFilePolyfills} from '@loaders.gl/polyfills';

_addAliases(ALIASES);
// Install polyfills (primarily for Node)
installFilePolyfills();

// const isBrowser =
//   typeof process !== 'object' || String(process) !== '[object process]' || process.browser;

// base
import '@loaders.gl/polyfills/test/index.js';
import '@loaders.gl/worker-utils/test/index.js';
import '@loaders.gl/math/test/index.js';

// Core
import '@loaders.gl/loader-utils/test/index.js';
import '@loaders.gl/core/test/index.js';

// Image Formats
import '@loaders.gl/images/test/index.js';
import '@loaders.gl/textures/test/index.js';
// import '@loaders.gl/video/test/index.js';
// import '@loaders.gl/geotiff/test/index.js';
// import '@loaders.gl/zarr/test/index.js';
import '@loaders.gl/netcdf/test/index.js';

// Pointcloud/Mesh Formats
import '@loaders.gl/draco/test/index.js';
import '@loaders.gl/las/test/index.js';
import '@loaders.gl/obj/test/index.js';
import '@loaders.gl/pcd/test/index.js';
import '@loaders.gl/ply/test/index.js';
import '@loaders.gl/terrain/test/index.js';

// Scenegraph Formats
import '@loaders.gl/gltf/test/index.js';

// 3D Tile Formats
import '@loaders.gl/3d-tiles/test/index.js';
import '@loaders.gl/i3s/test/index.js';
import '@loaders.gl/potree/test/index.js';
import '@loaders.gl/tiles/test/index.js';

// Geospatial Formats
import '@loaders.gl/flatgeobuf/test/index.js';
import '@loaders.gl/geopackage/test/index.js';
import '@loaders.gl/gis/test/index.js';
import '@loaders.gl/kml/test/index.js';
import '@loaders.gl/mvt/test/index.js';
import '@loaders.gl/shapefile/test/index.js';
import '@loaders.gl/wkt/test/index.js';

// Table Formats
import '@loaders.gl/schema/test/index.js';
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
// if (!isBrowser && TEST_CLI) {
//   import '@loaders.gl/tile-converter/test/index.js';
// }
