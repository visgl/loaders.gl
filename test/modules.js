// Sets up aliases for file reader
require('./aliases');

require('@loaders.gl/polyfills');

// Core
require('@loaders.gl/core/test');
require('@loaders.gl/images/test');

// Table Formats
require('@loaders.gl/arrow/test');
require('@loaders.gl/csv/test');
require('@loaders.gl/experimental/test');

// Archive Formats
require('@loaders.gl/zip/test');

// Pointcloud/Mesh Formats
require('@loaders.gl/draco/test');
require('@loaders.gl/las/test');
require('@loaders.gl/obj/test');
require('@loaders.gl/pcd/test');
require('@loaders.gl/ply/test');

// Scenegraph Formats
require('@loaders.gl/gltf/test');

// 3D Tile Formats
require('@loaders.gl/3d-tiles/test');

// Geospatial Formats
require('@loaders.gl/kml/test');
