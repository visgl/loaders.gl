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

export const INITIAL_EXAMPLE_NAME = 'San Francisco';

export const EXAMPLES = {
  'San Francisco': {
    name: 'San Francisco',
    url:
      'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
    viewport: {
      ...VIEW_STATE,
      longitude: -120,
      latitude: 34
    }
  },
  'New York': {
    name: 'New York',
    url:
      'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/New_York_Mesh_NearMap/SceneServer/layers/0',
    viewport: {
      ...VIEW_STATE,
      longitude: -74,
      latitude: 40
    }
  }
};
