export const INITIAL_LOADER_NAME = 'GeoParquet';
export const INITIAL_EXAMPLE_NAME = 'Airports';
// export const INITIAL_LOADER_NAME = 'GeoJSON';
// export const INITIAL_EXAMPLE_NAME = 'Vancouver';

export const INITIAL_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

export const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

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

export type Example = {
  format: string;
  data: string;
  viewState: Record<string, number>;
};

export const EXAMPLES: Record<string, Record<string, Example>> = {
  GeoParquet: {
    Airports: {
      format: 'geoparquet',
      data: `${LOADERS_URI}/modules/parquet/test/data/geoparquet/airports.parquet`,
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: -29.76,
        zoom: 1.76
      }
    }
  },
  GeoJSON: {
    Vancouver: {
      format: 'geojson',
      data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json',
      viewState: {
        ...VIEW_STATE,
        latitude: 49.254,
        longitude: -123.13
      }
    }
  },
  // GeoPackage: {
  //   Rivers: {
  //     format: 'geopackage',
  //     data: 'https://raw.githubusercontent.com/ngageoint/geopackage-js/master/test/fixtures/rivers.gpkg',
  //     viewState: {
  //       ...VIEW_STATE,
  //       longitude: -4.65,
  //       latitude: 0,
  //       zoom: 1.76
  //     }
  //   }
  // },
  FlatGeobuf: {
    Countries: {
      format: 'flatgeobuf',
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
