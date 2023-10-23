import {MapView} from '@deck.gl/core';
import {MAP_STYLES} from './constants';

const VIEW_STATE = {
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
};

export const INITIAL_EXAMPLE_NAME = 'San Francisco v1.7';

export const EXAMPLES = {
  'San Francisco v1.6': {
    name: 'San Francisco v1.6',
    url: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
    viewport: {
      ...VIEW_STATE,
      longitude: -120,
      latitude: 34
    }
  },
  'San Francisco v1.7': {
    name: 'San Francisco v1.7',
    url: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_3DObjects_1_7/SceneServer/layers/0',
    viewport: {
      ...VIEW_STATE,
      longitude: -120,
      latitude: 34
    }
  },
  // use for debugging/testing purpose only
  // 'Lyon': {
  //  name: 'Lyon',
  //  url:
  //    'https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/STM____FR_Lyon__Textured_buildings/SceneServer/layers/0?f=pjson',
  //  viewport: {
  //    ...VIEW_STATE,
  //    latitude: 45.764,
  //    longitude: 4.8357
  //  }
  // },
  'New York': {
    name: 'New York',
    url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Buildings_NewYork_17/SceneServer/layers/0',
    viewport: {
      ...VIEW_STATE,
      longitude: -74,
      latitude: 40
    }
  },
  Building: {
    name: 'Building',
    url: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/Admin_Building_v17/SceneServer/layers/0',
    viewport: {
      ...VIEW_STATE
    }
  }
};

// HERO EXAMPLE CONSTANTS
export const HERO_EXAMPLE_MAP_STYLE = MAP_STYLES['Light'];
export const HERO_EXAMPLE_URL =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_3DObjects_1_7/SceneServer/layers/0';

export const HERO_EXAMPLE_VIEW_STATE = {
  transitionDuration: 0,
  longitude: -122.401,
  latitude: 37.796,
  pitch: 40,
  bearing: 0,
  zoom: 16.5,
};

export const HERO_EXAMPLE_VIEW = new MapView({
  id: 'main',
  controller: {
    inertia: true,
    dragPan: false,
    dragRotate: false,
    scrollZoom: false
  },
  farZMultiplier: 2.02
});
