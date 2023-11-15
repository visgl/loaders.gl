// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

export const INITIAL_LOADER_NAME = 'GeoParquet';
export const INITIAL_EXAMPLE_NAME = 'Airports';
// export const INITIAL_LOADER_NAME = 'GeoJSON';
// export const INITIAL_EXAMPLE_NAME = 'Vancouver';

export const INITIAL_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

export const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';
const DECKGL_DATA_URI = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const PARQUET_PATH = '/formats/geoparquet';

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

// Add Geoparquet datasets
const GeoParquet: Record<string, Example> = {
  Airports: {
    format: 'geoparquet',
    data: `${LOADERS_URI}/modules/parquet/test/data/geoparquet/airports.parquet`,
    viewState: {
      ...VIEW_STATE,
      longitude: -4.65,
      latitude: -29.76,
      zoom: 1.76
    }
  },
  NZBuildingFootprints: {
    format: 'geoparquet',
    data: 'https://storage.googleapis.com/open-geodata/linz-examples/nz-building-outlines.parquet',
    viewState: {
      latitude: 47.65,
      longitude: 7,
      zoom: 4.5,
      maxZoom: 20,
      maxPitch: 89,
      bearing: 0
    }
  }
};
const compressions = ['snappy', 'gzip', 'brotli', 'no_compression'];
const PARQUET_VERSION = '0.4.0';
const parquetExtension = '.parquet';
const files = [
  {name: 'Countries', urlPrefix: 'countries/countries', hasZstd: true},
  {name: 'Major rivers', urlPrefix: 'major-rivers/major-rivers'},
  {
    name: 'Fort Collins streets',
    urlPrefix: 'fort-collins-streets/fort-collins-streets',
    hasZstd: true,
    viewState: {
      longitude: -105.1003626,
      latitude: 40.5529294,
      zoom: 13
    }
  },
  {
    name: 'Fort Collins address',
    urlPrefix: 'fort-collins-address/fort-collins-address',
    viewState: {
      longitude: -105.1003626,
      latitude: 40.5529294,
      zoom: 13
    }
  }
];
for (const file of files) {
  const {name, urlPrefix, hasZstd, viewState} = file;
  for (const compression of compressions) {
    const data = `${DECKGL_DATA_URI}${PARQUET_PATH}/${urlPrefix}_${PARQUET_VERSION}_${compression}${parquetExtension}`;
    GeoParquet[`${name} (${compression})`] = {
      format: 'geoparquet',
      data,
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: -29.76,
        zoom: 1.76,
        ...viewState
      }
    };
  }
  if (hasZstd) {
    const data = `${DECKGL_DATA_URI}${PARQUET_PATH}/${urlPrefix}_zstd${parquetExtension}`;
    GeoParquet[`${name} (zstd)`] = {
      format: 'geoparquet',
      data,
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: -29.76,
        zoom: 1.76,
        ...viewState
      }
    };
  }
}

const _EXAMPLES: Record<string, Record<string, Example>> = {
  GeoParquet,
  GeoJSON: {
    Vancouver: {
      format: 'geojson',
      data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/geojson/vancouver-blocks.json',
      viewState: {
        ...VIEW_STATE,
        latitude: 49.254,
        longitude: -123.13
      }
    },
    Countries: {
      format: 'geojson',
      data: 'http://localhost:5173/countries.geojson',
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: -29.76,
        zoom: 1.76
      }
    },
    Streets: {
      format: 'geojson',
      data: 'http://localhost:5173/streets.geojson',
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: -29.76,
        zoom: 1.76
      }
    }
  },
  GeoPackage: {
    Rivers: {
      format: 'geopackage',
      data: 'https://raw.githubusercontent.com/ngageoint/geopackage-js/master/test/fixtures/rivers.gpkg',
      viewState: {
        ...VIEW_STATE,
        longitude: -4.65,
        latitude: 0,
        zoom: 1.76
      }
    }
  },
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

export const EXAMPLES = _EXAMPLES;
