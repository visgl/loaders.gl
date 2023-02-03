export const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

export const INITIAL_CATEGORY_NAME = 'WMS';
export const INITIAL_EXAMPLE_NAME = 'Terrestris(OpenStreetMap)';

export const INITIAL_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

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
    'Terrestris(OpenStreetMap)': {
      // const imageUrl = `https://ows.terrestris.de/osm/service?width=${width}&height=${height}&bbox=${bounds[0]},${bounds[1]},${bounds[2]},${bounds[3]}&srs=EPSG:4326&format=image%2Fpng&request=GetMap&service=WMS&styles=&transparent=TRUE&version=1.1.1&layers=OSM-WMS`;
      // TODO: change in the URL `srs=EPSG:4326` to `srs=EPSG:900913`
      // once we can change the TileLayer bounds from lat/lon to web mercator coordinates
      serviceUrl: `https://ows.terrestris.de/osm/service`,
      layers: ['OSM-WMS'],
      viewState: {...VIEW_STATE}
    },
    'Canadian Weather': {
      serviceUrl: 'https://geo.weather.gc.ca/geomet',
      layers: ['GDPS.ETA_TT'], // 'RDPS.CONV_KINDEX.PT3H'],
      viewState: {...VIEW_STATE, longitude: -100, latitude: 55, zoom: 3},
      opacity: 0.5
    },
    'Deutscher Wetterdienst': {
      serviceUrl: 'https://maps.dwd.de/geoserver/dwd/wms',
      layers: ['Cwam_reg025_fd_sl_DD10M'],
      viewState: {...VIEW_STATE, longitude: 16, latitude: 54, zoom: 3.6},
      opacity: 0.5
    },
    'Trigger Error (No Layer)': {
      serviceUrl: 'https://geo.weather.gc.ca/geomet',
      layers: [],
      viewState: {...VIEW_STATE, longitude: -100, latitude: 55, zoom: 3}
    },
  },
  ImageServer: {
    NLCDLandCover2001: {
      serviceUrl: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/NLCDLandCover2001/ImageServer',
      viewState: {...VIEW_STATE}
    },
    ArcGISSampleImageryLayer: {
      serviceUrl: 'https://developers.arcgis.com/javascript/latest/sample-code/layers-imagerylayer/',
      viewState: {...VIEW_STATE}
    },
    ArcGISExportedImage: {
      serviceUrl: 'https://developers.arcgis.com/rest/services-reference/enterprise/export-image.htm',
      viewState: {...VIEW_STATE}
    }
  }
};
