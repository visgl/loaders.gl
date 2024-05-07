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
const DECKGL_DATA_URL = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';

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
  }
};
