export const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

export const INITIAL_EXAMPLE_NAME = 'Vancouver';
export const INITIAL_LOADER_NAME = 'GeoJSON';

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
  GeoPackage: {
    Rivers: {
      data: 'https://raw.githubusercontent.com/ngageoint/geopackage-js/master/test/fixtures/rivers.gpkg',
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: 0,
        zoom: 1.76
      }
    }
  },
  GeoJSON: {
    Vancouver: {
      data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json',
      viewState: {
        ...VIEW_STATE,
        latitude: 49.254,
        longitude: -123.13
      }
    }
  },
  FlatGeobuf: {
    Countries: {
      data: `${LOADERS_URI}/modules/flatgeobuf/test/data/countries.fgb`,
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: -29.76,
        zoom: 1.76
      }
    }
  }
};
