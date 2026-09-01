const ION_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4OGMyMDVmMS0zNjIyLTRkMDQtYTQ2MS05YmQ3MTc5ZDJhOTAiLCJpZCI6MjYxMzMsImlhdCI6MTc3NjA4NzkxNX0.wfqN4Vu94UsALYDIunRGWO8wKFYMoe67ooozJwDAo-c';

export const INITIAL_EXAMPLE_CATEGORY = 'i3s';
export const INITIAL_EXAMPLE_NAME = 'San Francisco Buildings';

const SHOWCASE_EXAMPLES = {
  i3s: {
    name: 'I3S city scenes',
    examples: {
      'San Francisco Buildings': {
        format: 'i3s',
        maximumScreenSpaceError: 4,
        viewState: {
          longitude: -122.4075,
          latitude: 37.789,
          zoom: 15.1,
          bearing: -28,
          pitch: 64
        },
        tilesetUrl:
          'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0'
      }
    }
  },
  ion: {
    name: '3D Tiles — deck.gl showcase',
    examples: {
      'City of Melbourne 3D Point Cloud': {
        ionAssetId: 43978,
        ionAccessToken: ION_TOKEN,
        maximumScreenSpaceError: 4,
        viewState: {
          longitude: 144.94346,
          latitude: -37.81277,
          zoom: 10,
          bearing: 0,
          pitch: 45
        }
      }
    }
  }
};

export async function loadExampleIndex() {
  return {
    ...SHOWCASE_EXAMPLES,
    custom: {
      name: 'Custom',
      examples: {
        'Custom Tileset': {},
        'ION Tileset': {}
      }
    }
  };
}
