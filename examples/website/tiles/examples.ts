// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

export const LOADERS_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

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

export const EXAMPLES = {
  TILES: {
    'OpenStreetMap Tiles': {
      format: 'tile',
      data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
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
    'Protomaps Tiles': {
      format: 'pmtiles',
      data: 'https://r2-public.protomaps.com/protomaps-sample-datasets/terrarium_z9.pmtiles',
      attributions: ["© Land Information New Zealand"],
      viewState: {...VIEW_STATE}
    },
    'Terrarium': {
      url:"https://r2-public.protomaps.com/protomaps-sample-datasets/terrarium_z9.pmtiles",
      tileSize: [512,512]
    }
  }
};
