/* global fetch */
const DECK_DATA_URI = 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master';

const ION_ACCESS_TOKEN_VRICON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNGZmZjBjMS04ZGYwLTRhYjAtOWIzYy0wZWJmNzI4OWZhNGEiLCJpZCI6MTYyMywic2NvcGVzIjpbImFzciIsImdjIl0sImFzc2V0cyI6WzI5MzI4LDI5MzMxLDI5MzMyLDI5MzMzLDI5MzM0LDI5MzM1LDEsMiwzLDQsMzk1NF0sImlhdCI6MTU2MDQ0ODA2Nn0.zZPuc5WzTsrKNviCY2jyhmDwJITXzhbRTnJS025_uBw';
const ION_ACCESS_TOKEN_1 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxN2NhMzkwYi0zNWM4LTRjNTYtYWE3Mi1jMDAxYzhlOGVmNTAiLCJpZCI6OTYxOSwic2NvcGVzIjpbImFzbCIsImFzciIsImFzdyIsImdjIl0sImlhdCI6MTU2MjE4MTMxM30.OkgVr6NaKYxabUMIGqPOYFe0V5JifXLVLfpae63x-tA';
const ION_ACCESS_TOKEN_2 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzMGY4ODczYy1mNTk4LTRiMDUtYmIxYy0xZWYwOWZmMGY4NjQiLCJpZCI6NDQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJhc3NldHMiOlsxLDIsMyw0LDYxOTMsNjI3Myw3MTYyLDczNTMsNzE0Ml0sImlhdCI6MTU0MTYxODM0NX0.lWnGs9ySXO4QK3HagcMsDpZ8L01DpmUDQm38-2QAQuE';

export const DATA_URI = 'https://raw.githubusercontent.com/uber-web/loaders.gl/master';

const EXAMPLE_INDEX_URL = `${DATA_URI}/modules/3d-tiles/test/data/index.json`;

const ADDITIONAL_EXAMPLES = {
  additional: {
    name: 'additional',
    examples: {
      'Mount St Helens (Cesium Ion PointCloud)': {
        ionAssetId: 33301,
        ionAccessToken: ION_ACCESS_TOKEN_1
      },
      'Montreal (Cesium Ion PointCloud)': {ionAssetId: 28945, ionAccessToken: ION_ACCESS_TOKEN_1},
      '6193 (Cesium Ion Batched)': {ionAssetId: 6193, ionAccessToken: ION_ACCESS_TOKEN_2},
      '7162 (Cesium Ion Batched)': {ionAssetId: 7162, ionAccessToken: ION_ACCESS_TOKEN_2},
      'Royal Exhibition Building (Github Pages)': {
        tilesetUrl: `${DECK_DATA_URI}/3d-tiles/RoyalExhibitionBuilding/tileset.json`
      }
    }
  },
  vricon: {
    name: 'vricon',
    examples: {
      Cairo: {ionAssetId: 29328, ionAccessToken: ION_ACCESS_TOKEN_VRICON},
      Caracas: {ionAssetId: 29331, ionAccessToken: ION_ACCESS_TOKEN_VRICON},
      Damascus: {ionAssetId: 29332, ionAccessToken: ION_ACCESS_TOKEN_VRICON},
      Honolulu: {ionAssetId: 29333, ionAccessToken: ION_ACCESS_TOKEN_VRICON},
      'San Francisco': {ionAssetId: 29334, ionAccessToken: ION_ACCESS_TOKEN_VRICON},
      Tehran: {ionAssetId: 29335, ionAccessToken: ION_ACCESS_TOKEN_VRICON}
    }
  }
};

export async function loadExampleIndex() {
  // Load the index file that lists example tilesets (from the loaders.gl github repo)
  const response = await fetch(EXAMPLE_INDEX_URL);
  const testExamples = await response.json();

  // We don't yet support geometry and vector tiles, so remove those categories for now
  delete testExamples.Geometry;
  delete testExamples.Vector;
  // TODO - We should fix rendering of composite tiles, not hard
  delete testExamples.Composite;

  return {
    ...testExamples,
    ...ADDITIONAL_EXAMPLES,
    custom: {
      name: 'Custom',
      examples: {
        'Custom Tileset': {},
        'ION Tileset': {}
      }
    }
  };
}
