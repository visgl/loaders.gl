export const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

export const INITIAL_CATEGORY_NAME = 'WMS';
export const INITIAL_EXAMPLE_NAME = 'Terrestris';

export const INITIAL_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const VIEW_STATE = {
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 1,
  maxZoom: 30,
  zoom: 11
};

export const EXAMPLES = {
  WMS: {
    'Terrestris': {
      serviceUrl: `https://ows.terrestris.de/osm/service`,
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: 0,
        zoom: 1.76
      }
    },
    'Weather Geomet': {
      serviceUrl: 'https://geo.weather.gc.ca/geomet',
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: 0,
        zoom: 1.76
      }
    },
    'DWD Maps': {
      serviceUrl: 'https://maps.dwd.de/geoserver/dwd/wms',
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: 0,
        zoom: 1.76
      }
    }
  },
  ImageServer: {
    Vancouver: {
      data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json',
      viewState: {
        ...VIEW_STATE,
        latitude: 49.254,
        longitude: -123.13
      }
    }
  }
};
