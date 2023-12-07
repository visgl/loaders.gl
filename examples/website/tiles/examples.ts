// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

// export const INITIAL_CATEGORY_NAME = 'MVT';
// export const INITIAL_EXAMPLE_NAME = 'OpenStreetMap Tiles';

export const INITIAL_CATEGORY_NAME = 'PMTILES';
export const INITIAL_EXAMPLE_NAME = 'FSQ Tiles';

export const INITIAL_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const VIEW_STATE = {
  longitude: -122.4,
  latitude: 37.74,
  zoom: 9,
  minZoom: 1,
  maxZoom: 20,
  pitch: 0,
  bearing: 0
};

export type Example = {
  format: string;
  data: string;
  attributions?: string[];
  viewState?: Record<string, unknown>;
  tileSize?: number[];
}

export const EXAMPLES: Record<string, Record<string, Example>> = {
  MVT: {
    'OpenStreetMap Tiles': {
      format: 'mvt',
      data: 'https://c.tile.openstreetmap.org',
      // TODO deduce from templates
      // data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      viewState: {...VIEW_STATE, longitude: 40, latitude: 57, zoom: 5}
    }
  },
  PMTILES: {
    'FSQ Tiles': {
      format: 'pmtiles',
      data: 'https://4sq-studio-public.s3.us-west-2.amazonaws.com/pmtiles-test/161727fe-7952-4e57-aa05-850b3086b0b2.pmtiles',
      attributions: ["© Foursquare"],
      viewState: {...VIEW_STATE}
    },
    'NZ Buildings': {
      format: 'pmtiles',
      data: 'https://r2-public.protomaps.com/protomaps-sample-datasets/nz-buildings-v3.pmtiles',
      attributions: ["© Land Information New Zealand"],
      viewState: {...VIEW_STATE}
    },
    'Terrarium': {
      format: 'pmtiles',
      data:"https://r2-public.protomaps.com/protomaps-sample-datasets/terrarium_z9.pmtiles",
      tileSize: [512,512]
    }
  }
};
