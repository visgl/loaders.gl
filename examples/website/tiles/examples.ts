// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Example} from './components/example-panel';

export const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

// export const INITIAL_CATEGORY_NAME = 'MVT';
// export const INITIAL_EXAMPLE_NAME = 'OpenStreetMap Tiles';

export const INITIAL_CATEGORY_NAME = 'GeoJSON';
export const INITIAL_EXAMPLE_NAME = 'Countries';

export const INITIAL_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const VIEW_STATE = {
  longitude: -122.4,
  latitude: 37.74,
  zoom: 2,
  minZoom: 1,
  maxZoom: 20,
  pitch: 0,
  bearing: 0
};

export const LOADERS_URL = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

export const EXAMPLES: Record<string, Record<string, Example>> = {
  MVT: {
    'OpenStreetMap Tiles': {
      sourceType: 'mvt',
      data: 'https://c.tile.openstreetmap.org',
      // TODO deduce from templates
      // data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      viewState: {...VIEW_STATE, longitude: 40, latitude: 57, zoom: 5}
    }
  },
  PMTILES: {
    'FSQ Tiles': {
      sourceType: 'pmtiles',
      data: 'https://4sq-studio-public.s3.us-west-2.amazonaws.com/pmtiles-test/161727fe-7952-4e57-aa05-850b3086b0b2.pmtiles',
      attributions: ["© Foursquare"],
      viewState: {...VIEW_STATE}
    },
    'NZ Buildings': {
      sourceType: 'pmtiles',
      data: 'https://r2-public.protomaps.com/protomaps-sample-datasets/nz-buildings-v3.pmtiles',
      attributions: ["© Land Information New Zealand"],
      viewState: {...VIEW_STATE}
    },
    'Terrarium': {
      sourceType: 'pmtiles',
      data:"https://r2-public.protomaps.com/protomaps-sample-datasets/terrarium_z9.pmtiles",
      tileSize: [512,512]
    }
  },
  GeoJSON: {
    // Vancouver: {
    //   sourceType: 'geojson',
    //   data: `${DECKGL_DATA_URL}/examples/geojson/vancouver-blocks.json`,
    //   viewState: {...VIEW_STATE, latitude: 49.254, longitude: -123.13}
    // },
    Countries: {
      sourceType: 'table',
      data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson',
      // data: `${LOADERS_URL}/modules/flatgeobuf/test/data/countries.json`,
      viewState: {...VIEW_STATE, longitude: -4.65, latitude: -29.76, zoom: 1.76}
    }
  },
  WMS: {
    'OpenStreetMap WMS (Terrestris)': {
      // const imageUrl = 'https://ows.terrestris.de/osm/service?width={width}&height={height}&bbox={bounds[0]},{bounds[1]},{bounds[2]},{bounds[3]}&srs=EPSG:4326&format=image%2Fpng&request=GetMap&service=WMS&styles=&transparent=TRUE&version=1.1.1&layers=OSM-WMS';
      // TODO: change in the URL 'srs=EPSG:4326' to 'srs=EPSG:900913'
      // once we can change the TileLayer bounds from lat/lon to web mercator coordinates
      sourceType: 'wms',
      service: 'https://ows.terrestris.de/osm/service',
      description: 'OpenStreetMap rendered, updated weekly, covering the entire globe. Copyright OpenStreetMap.',
      layers: ['OSM-WMS'],
      viewState: {...VIEW_STATE}
    },
    'NOAA Composite Reflectivity WMS': {
      sourceType: 'wms',
      service: 'https://opengeo.ncep.noaa.gov/geoserver/conus/conus_cref_qcd/ows',
      description: 'Radar precipitation data covering the contiguous US. Quality Controlled 1km x 1km CONUS Radar Composite Reflectivity. This data is provided Multi-Radar-Multi-Sensor (MRMS) algorithm.',
      layers: ['conus_cref_qcd'],
      viewState: {...VIEW_STATE}
    },
    'NASA Global Imagery Browse Services for EOSDIS': {
      sourceType: 'wms',
      service: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
      description: 'Over 1,000 NASA satellite imagery products, covering every part of the world. Most imagery is updated daily—available within a few hours after satellite observation, and some products span almost 30 years.',
      layers: ['Lightning'],
      viewState: {...VIEW_STATE, zoom: 3}
    },
    '3DEP Elevation Index': {
      sourceType: 'wms',
      service: 'https://index.nationalmap.gov/arcgis/services/3DEPElevationIndex/MapServer/WMSServer',
      layers: ['23'], 
      viewState: {...VIEW_STATE, longitude: -100, latitude: 55, zoom: 3},
      opacity: 0.5
    },
    'NASA': {
      sourceType: 'wms',
      service: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
      layers: ['Land Cover'], 
      viewState: {...VIEW_STATE, longitude: -100, latitude: 55, zoom: 3},
      opacity: 0.5
    },
    
    /*
    'Canadian Weather': {
      sourceType: 'wms',
      service: 'https://geo.weather.gc.ca/geomet',
      layers: ['GDPS.ETA_TT'], // 'RDPS.CONV_KINDEX.PT3H'],
      viewState: {...VIEW_STATE, longitude: -100, latitude: 55, zoom: 3},
      opacity: 0.5
    },
    'Deutscher Wetterdienst': {
      sourceType: 'wms',
      service: 'https://maps.dwd.de/geoserver/dwd/wms',
      layers: ['Cwam_reg025_fd_sl_DD10M'],
      viewState: {...VIEW_STATE, longitude: 16, latitude: 54, zoom: 3.6},
      opacity: 0.5
    },
    */
    'Trigger Error (No Layer)': {
      sourceType: 'wms',
      service: 'https://geo.weather.gc.ca/geomet',
      layers: [],
      viewState: {...VIEW_STATE, longitude: -100, latitude: 55, zoom: 3}
    },
  },
  /*
  ImageServer: {
    NLCDLandCover2001: {
      service: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer/exportImage?bbox={east},{north},{west},{south}&bboxSR=4326&size={width},{height}&imageSR=102100&time=&format=jpgpng&pixelType=U8&noData=&noDataInterpretation=esriNoDataMatchAny&interpolation=+RSP_NearestNeighbor&compression=&compressionQuality=&bandIds=&mosaicRule=&renderingRule=&f=image',
      sourceType: 'template',
      viewState: {...VIEW_STATE}
    },
    ArcGISSampleImageryLayer: {
      service: 'https://developers.arcgis.com/javascript/latest/sample-code/layers-imagerylayer/',
      viewState: {...VIEW_STATE}
    },
    ArcGISExportedImage: {
      service: 'https://developers.arcgis.com/rest/services-reference/enterprise/export-image.htm',
      viewState: {...VIEW_STATE}
    }
  }
  */
};
