export const INITIAL_EXAMPLE_CATEGORY = 'tiles3d';
export const INITIAL_EXAMPLE_NAME = 'Angkor Wat';

const SHOWCASE_EXAMPLES = {
  tiles3d: {
    name: '3D Tiles',
    examples: {
      'Angkor Wat': {
        tilesetUrl:
          'https://storage.googleapis.com/open-cogs/planet-stac/angkor-wat/3d-geofox.ai/3DTiles/tileset.json',
        viewState: {
          longitude: 103.86674,
          latitude: 13.43811,
          zoom: 11,
          bearing: 0,
          pitch: 45
        }
      }
    }
  },
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
