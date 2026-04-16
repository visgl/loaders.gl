/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars = {
  Examples: [
    {
      type: 'doc',
      label: 'Overview',
      id: 'index'
    },
    {
      type: 'category',
      label: 'General Data Formats',
      items: ['table/arrow', 'table/bson', 'table/json', 'table/xml']
    },
    {
      type: 'category',
      label: 'Trace Formats',
      items: ['traces/chrome-trace']
    },
    {
      type: 'category',
      label: 'Geospatial Table Formats',
      items: [
        'geospatial/csv',
        'geospatial/shapefile',
        'geospatial/geojson',
        'geospatial/geoarrow',
        'geospatial/geoparquet',
        'geospatial/geopackage',
        'geospatial/kml',
        'geospatial/gpx',
        'geospatial/tcx'
      ]
    },
    {
      type: 'category',
      label: 'Tiled Geospatial Formats',
      items: ['tiles/mvt', 'tiles/pmtiles', 'tiles/table-tiler', 'tiles/mlt']
    },
    {
      type: 'category',
      label: 'Tiled 3D Formats',
      items: [
        'i3s-building-scene-layer',
        'i3s-picking',
        'i3s-colorization-by-attributes',
        'i3s-slpk',
        '3d-tiles',
        'pointclouds/potree-source',
        'pointclouds/copc-source'
      ]
    },
    {
      type: 'category',
      label: 'Geospatial Services',
      items: [
        'tiles/wms',
        'tiles/wfs',
        'tiles/arcgis-image-server',
        'tiles/arcgis-feature-server'
      ]
    },
    {
      type: 'category',
      label: 'Point Cloud Formats',
      items: [
        'pointclouds/gaussian-splats',
        'pointclouds/draco',
        'pointclouds/las',
        'pointclouds/pcd',
        'pointclouds/ply',
        'pointclouds/obj'
      ]
    },
    {
      type: 'category',
      label: 'Geospatial Raster Formats',
      items: ['geospatial/geotiff']
    },
    {
      type: 'category',
      label: 'Bioimaging Raster Formats',
      items: ['bioimaging/ome-tiff', 'bioimaging/ome-zarr']
    },
    {
      type: 'category',
      label: 'General Formats',
      collapsed: false,
      items: [
        'textures',
        // 'gltf',
      ]
    },
    {
      type: 'category',
      label: 'Benchmarks',
      items: [
        'benchmarks',
      ]
    }
  ]
};

module.exports = sidebars;
