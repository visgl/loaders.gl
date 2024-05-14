// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

export const INITIAL_CATEGORY_NAME = 'WMS';
export const INITIAL_EXAMPLE_NAME = 'OpenStreetMap WMS (Terrestris)';

const VIEW_STATE = {
  longitude: -122.4,
  latitude: 37.74,
  zoom: 9,
  minZoom: 1,
  maxZoom: 20,
  pitch: 0,
  bearing: 0
};

export const EXAMPLES = {
  WMS: {
    'OpenStreetMap WMS (Terrestris)': {
      // const imageUrl = 'https://ows.terrestris.de/osm/service?width={width}&height={height}&bbox={bounds[0]},{bounds[1]},{bounds[2]},{bounds[3]}&srs=EPSG:4326&format=image%2Fpng&request=GetMap&service=WMS&styles=&transparent=TRUE&version=1.1.1&layers=OSM-WMS';
      // TODO: change in the URL 'srs=EPSG:4326' to 'srs=EPSG:900913'
      // once we can change the TileLayer bounds from lat/lon to web mercator coordinates
      type: 'wms',
      url: 'https://ows.terrestris.de/osm/service',
      description: 'OpenStreetMap rendered, updated weekly, covering the entire globe. Copyright OpenStreetMap.',
      layers: ['OSM-WMS'],
      viewState: {...VIEW_STATE}
    },
    'NOAA Composite Reflectivity WMS': {
      type: 'wms',
      url: 'https://opengeo.ncep.noaa.gov/geoserver/conus/conus_cref_qcd/ows',
      description: 'Radar precipitation data covering the contiguous US. Quality Controlled 1km x 1km CONUS Radar Composite Reflectivity. This data is provided Multi-Radar-Multi-Sensor (MRMS) algorithm.',
      layers: ['conus_cref_qcd'],
      viewState: {...VIEW_STATE}
    },
    'NASA Global Imagery Browse Services for EOSDIS': {
      type: 'wms',
      url: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
      description: 'Over 1,000 NASA satellite imagery products, covering every part of the world. Most imagery is updated daily—available within a few hours after satellite observation, and some products span almost 30 years.',
      layers: ['Lightning'],
      viewState: {...VIEW_STATE, zoom: 3}
    },
    '3DEP Elevation Index': {
      type: 'wms',
      url: 'https://index.nationalmap.gov/arcgis/services/3DEPElevationIndex/MapServer/WMSServer',
      layers: ['23'], 
      viewState: {...VIEW_STATE, longitude: -100, latitude: 55, zoom: 3},
      opacity: 0.5
    },
    'NASA': {
      type: 'wms',
      url: 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',
      layers: ['Land Cover'], 
      viewState: {...VIEW_STATE, longitude: -100, latitude: 55, zoom: 3},
      opacity: 0.5
    },
    
    /*
    'Canadian Weather': {
      type: 'wms',
      url: 'https://geo.weather.gc.ca/geomet',
      layers: ['GDPS.ETA_TT'], // 'RDPS.CONV_KINDEX.PT3H'],
      viewState: {...VIEW_STATE, longitude: -100, latitude: 55, zoom: 3},
      opacity: 0.5
    },
    'Deutscher Wetterdienst': {
      type: 'wms',
      url: 'https://maps.dwd.de/geoserver/dwd/wms',
      layers: ['Cwam_reg025_fd_sl_DD10M'],
      viewState: {...VIEW_STATE, longitude: 16, latitude: 54, zoom: 3.6},
      opacity: 0.5
    },
    */
    'Trigger Error (No Layer)': {
      type: 'wms',
      url: 'https://geo.weather.gc.ca/geomet',
      layers: [],
      viewState: {...VIEW_STATE, longitude: -100, latitude: 55, zoom: 3}
    },
  },
  /*
  ImageServer: {
    NLCDLandCover2001: {
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer/exportImage?bbox={east},{north},{west},{south}&bboxSR=4326&size={width},{height}&imageSR=102100&time=&format=jpgpng&pixelType=U8&noData=&noDataInterpretation=esriNoDataMatchAny&interpolation=+RSP_NearestNeighbor&compression=&compressionQuality=&bandIds=&mosaicRule=&renderingRule=&f=image',
      type: 'template',
      viewState: {...VIEW_STATE}
    },
    ArcGISSampleImageryLayer: {
      url: 'https://developers.arcgis.com/javascript/latest/sample-code/layers-imagerylayer/',
      viewState: {...VIEW_STATE}
    },
    ArcGISExportedImage: {
      url: 'https://developers.arcgis.com/rest/services-reference/enterprise/export-image.htm',
      viewState: {...VIEW_STATE}
    }
  }
  */
};
