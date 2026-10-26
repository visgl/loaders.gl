// Sets up aliases for file reader

/* eslint-disable @typescript-eslint/no-var-requires */

import './init-tests';

// Utility modules
import '@loaders.gl/core/polyfills/test';
import '@loaders.gl/core/worker-utils/test';
import '@loaders.gl/core/geoarrow/test';

// Core
import '@loaders.gl/core/loader-utils/test';
import '@loaders.gl/core/schema/test';
import '@loaders.gl/core/schema-utils/test';
import '@loaders.gl/core/test';

// Image Formats
import '@loaders.gl/images/test';
import '@loaders.gl/textures/test';
import '@loaders.gl/raster/test/lerc';
// import '@loaders.gl/video/test';
import '@loaders.gl/raster/test/geotiff';
import '@loaders.gl/scientific/test/netcdf';
import '@loaders.gl/scientific/test/zarr';

// Pointcloud/Mesh Formats
import '@loaders.gl/draco/test';
// import '@loaders.gl/las/test';
import '@loaders.gl/obj/test';
import '@loaders.gl/pcd/test';
import '@loaders.gl/ply/test';
import '@loaders.gl/splats/test';
import '@loaders.gl/raster/test/terrain';

// Scenegraph Formats
import '@loaders.gl/gltf/test';

// 3D Tile Formats
import '@loaders.gl/tiles-3d/3d-tiles/test';
import '@loaders.gl/tiles-3d/i3s/test';
import '@loaders.gl/tiles-3d/test';
import '@loaders.gl/tiles-3d/potree/test';
import '@loaders.gl/tiles/test';

// Geospatial Formats
// TODO restore once we have upgraded to ES modules
import '@loaders.gl/geospatial/flatgeobuf/test';
import '@loaders.gl/geospatial/geopackage/test';
import '@loaders.gl/geospatial/kml/test';
import '@loaders.gl/geospatial/shapefile/test';
import '@loaders.gl/wkt/test';
import '@loaders.gl/ogc/wms/test';
import '@loaders.gl/ogc/stac/test';

import '@loaders.gl/tiles/mlt/test';
import '@loaders.gl/tiles/mvt/test';

// Range request archive style formats
import '@loaders.gl/tiles/pmtiles/test';

// Table Formats
import '@loaders.gl/tables/arrow/test';
import '@loaders.gl/tables/csv/test';
import '@loaders.gl/tables/json/test';
import '@loaders.gl/tables/excel/test';
import '@loaders.gl/tables/parquet/test';
import '@loaders.gl/tables/lance/test';
import '@loaders.gl/tables/orc/test';
import '@loaders.gl/traces/test';

// unstructured (JSON) formats
// JSON listed in tabular loaders since it optionally supports that category
import '@loaders.gl/tables/bson/test';
import '@loaders.gl/xml/test';

// Archive Formats
import '@loaders.gl/compression/test';
import '@loaders.gl/crypto/test';
import '@loaders.gl/archives/zip/test';
