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

export const INITIAL_EXAMPLE_NAME = 'San Francisco v1.6';

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
  }
};
