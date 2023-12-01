// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

export const INITIAL_LOADER_NAME = 'GeoParquet';
export const INITIAL_EXAMPLE_NAME = 'Airports';

// export const INITIAL_LOADER_NAME = 'GeoJSON';
// export const INITIAL_EXAMPLE_NAME = 'Vancouver';

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

export type Example = {
  format: string;
  data: string;
  viewState?: Record<string, number>;
  layerProps?: Record<string, any>;
};

export const LOADERS_URL = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';
const DECKGL_DATA_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const PARQUET_PATH = '/formats/geoparquet';

const GEOARROW_TEST_DATA = `${LOADERS_URL}/modules/arrow/test/data/geoarrow`;

export const EXAMPLES: Record<string, Record<string, Example>> = {
  GeoArrow: {
    multipolygon_hole: {
      format: 'geoarrow',
      data: `${GEOARROW_TEST_DATA}/multipolygon_hole.arrow`,
      viewState: {...VIEW_STATE, longitude: 10.388, latitude:   1.447, zoom: 4}
    }
  },
  GeoParquet: {
    Airports: {
      format: 'geoparquet',
      data: `${LOADERS_URL}/modules/parquet/test/data/geoparquet/airports.parquet`,
      viewState: {...VIEW_STATE, longitude: -4.65, latitude: -29.76, zoom: 1.76}
    }
  },
  GeoJSON: {
    Vancouver: {
      format: 'geojson',
      data: `${DECKGL_DATA_URL}/examples/geojson/vancouver-blocks.json`,
      viewState: {...VIEW_STATE, latitude: 49.254, longitude: -123.13}
    },
    Countries: {
      format: 'geojson',
      data: `${LOADERS_URL}/modules/geojson/test/data/countries.json`,
      viewState: {...VIEW_STATE, longitude: -4.65, latitude: -29.76, zoom: 1.76}
    }
  },
  GeoPackage: {
    Rivers: {
      format: 'geopackage',
      data: 'https://raw.githubusercontent.com/ngageoint/geopackage-js/master/test/fixtures/rivers.gpkg',
      viewState: {...VIEW_STATE, longitude: -4.65, latitude: 0, zoom: 1.76}
    }
  },
  FlatGeobuf: {
    Countries: {
      format: 'flatgeobuf',
      data: `${LOADERS_URL}/modules/flatgeobuf/test/data/countries.fgb`,
      viewState: {...VIEW_STATE, longitude: -4.65, latitude: -29.76, zoom: 1.76},
      layerProps: {getFillColor: (_, {index}) => [index % 255, 0, 0]}
    }
  },
  Shapefile: {
    'Countries and Graticules': {
      format: 'shapefile',
      data: `${LOADERS_URL}/modules/shapefile/test/data/graticules-and-countries/99bfd9e7-bb42-4728-87b5-07f8c8ac631c2020328-1-1vef4ev.lu5nk.shp`,
      viewState: {...VIEW_STATE, longitude: -4.65, latitude: -29.76, zoom: 1.76},
      layerProps: {getFillColor: (_, {index}) => [0, index % 255, 0]}
    },
    'SF Topography': {
      format: 'shapefile',
      data: `${DECKGL_DATA_URL}/test-data/shapefile/geo_export_14556060-0002-4a9e-8ef0-03da3e246166.shp`,
      viewState: {...VIEW_STATE, latitude: 37.75, longitude: -122.4, zoom: 11}
    }
  },

  KML: {
    'Congressional Districts': {
      format: 'kml',
      data: `${DECKGL_DATA_URL}/formats/kml/congressional-districts/cb_2022_us_cd118_20m.kml`,
      viewState: {...VIEW_STATE, latitude: 14.5, longitude: -78.13, zoom: 2.6},
      layerProps: {getFillColor: (_, {index}) => [index % 255, 0, 0]}
    }
  },

  TCX: {
    'TXC Sample': {
      format: 'tcx',
      data: `${LOADERS_URL}/modules/kml/test/data/tcx/tcx_sample.tcx`,
      viewState: {...VIEW_STATE, latitude: 37.89544935, longitude: -122.4883889, zoom: 16}
    }
  },

  GPX: {
    Trek: {
      format: 'gpx',
      data: `${LOADERS_URL}/modules/kml/test/data/gpx/trek.gpx`,
      viewState: {...VIEW_STATE, latitude: 44.907783722, longitude: 6.08, zoom: 13}
    }
  },

  GeoArrowTest: {
    line: {format: 'geoarrow', data: `${GEOARROW_TEST_DATA}/line.arrow`},
    multiline: {format: 'geoarrow', data: `${GEOARROW_TEST_DATA}/multiline.arrow`},
    multipoint: {format: 'geoarrow', data: `${GEOARROW_TEST_DATA}/multipoint.arrow`},
    multipolygon: {
      format: 'geoarrow',
      data: `${GEOARROW_TEST_DATA}/multipolygon.arrow`
    },
    multipolygon_hole: {
      format: 'geoarrow',
      data: `${GEOARROW_TEST_DATA}/multipolygon_hole.arrow`
    },
    point: {format: 'geoarrow', data: `${GEOARROW_TEST_DATA}/point.arrow`},
    polygon: {format: 'geoarrow', data: `${GEOARROW_TEST_DATA}/polygon.arrow`}
  },

  GeoParquetTest: getGeoParquetTestExamples(),

  KMLTests: {
    // TODO - size of features is excessive.
    'KML Sample': {
      format: 'kml',
      data: `${LOADERS_URL}/modules/kml/test/data/kml/KML_Samples.kml`,
      viewState: {...VIEW_STATE, latitude: 37.65, longitude: -121.7, zoom: 11}
    }
  }
};

// Add Geoparquet datasets

function getGeoParquetTestExamples() {
  const GeoParquet: Record<string, Example> = {};

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
      const data = `${DECKGL_DATA_URL}${PARQUET_PATH}/${urlPrefix}_${PARQUET_VERSION}_${compression}${parquetExtension}`;
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
      const data = `${DECKGL_DATA_URL}${PARQUET_PATH}/${urlPrefix}_zstd${parquetExtension}`;
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

  GeoParquet.NZBuildingFootprints = {
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

  return GeoParquet;
}
