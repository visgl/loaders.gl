/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars = {
  examplesSidebar: [
    {
      type: 'doc',
      label: 'Overview',
      id: 'index'
    },
    {
      type: 'category',
      label: 'Geospatial Table Loaders',
      collapsed: false,
      items: [
        'geospatial/flatgeobuf',
        'geospatial/geoarrow',
        'geospatial/geoparquet',
        'geospatial/geopackage',
        'geospatial/geojson',
        'geospatial/shapefile',
        'geospatial/kml',
        'geospatial/gpx',
        'geospatial/tcx'
      ]
    },
    {
      type: 'category',
      label: 'Geospatial Tile Loaders',
      items: [
        'tiles/mvt',
        'tiles/pmtiles',
        'tiles/table-tiler',
        'tiles/wms',
        'i3s-building-scene-layer',
        'i3s-picking',
        'i3s-colorization-by-attributes',
        '3d-tiles'
      ]
    },
    {
      type: 'category',
      label: 'Point Cloud Loaders',
      items: [
        'pointclouds/draco',
        'pointclouds/las',
        'pointclouds/pcd',
        'pointclouds/ply',
        'pointclouds/obj'
      ]
    },
    {
      type: 'category',
      label: 'General Loaders',
      collapsed: false,
      items: [
        'textures',
        // 'gltf',
      ]
    }
    // {
    //   type: 'category',
    //   label: 'Benchmarks',
    //   items: [
    //     'benchmarks',
    //   ]
    // }
  ]
};

module.exports = sidebars;
