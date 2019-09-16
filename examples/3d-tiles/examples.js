/* global fetch */
const DECK_DATA_URI = 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master';

const ION_TOKEN_VRICON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNGZmZjBjMS04ZGYwLTRhYjAtOWIzYy0wZWJmNzI4OWZhNGEiLCJpZCI6MTYyMywic2NvcGVzIjpbImFzciIsImdjIl0sImFzc2V0cyI6WzI5MzI4LDI5MzMxLDI5MzMyLDI5MzMzLDI5MzM0LDI5MzM1LDEsMiwzLDQsMzk1NF0sImlhdCI6MTU2MDQ0ODA2Nn0.zZPuc5WzTsrKNviCY2jyhmDwJITXzhbRTnJS025_uBw';
const ION_TOKEN_1 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxN2NhMzkwYi0zNWM4LTRjNTYtYWE3Mi1jMDAxYzhlOGVmNTAiLCJpZCI6OTYxOSwic2NvcGVzIjpbImFzbCIsImFzciIsImFzdyIsImdjIl0sImlhdCI6MTU2MjE4MTMxM30.OkgVr6NaKYxabUMIGqPOYFe0V5JifXLVLfpae63x-tA';
const ION_TOKEN_2 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzMGY4ODczYy1mNTk4LTRiMDUtYmIxYy0xZWYwOWZmMGY4NjQiLCJpZCI6NDQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJhc3NldHMiOlsxLDIsMyw0LDYxOTMsNjI3Myw3MTYyLDczNTMsNzE0Ml0sImlhdCI6MTU0MTYxODM0NX0.lWnGs9ySXO4QK3HagcMsDpZ8L01DpmUDQm38-2QAQuE';
const ION_TOKEN_MELBOURNE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjYTExNWEwZC00MWFmLTRmNWUtOTA1Zi00OGUzMzlkMDVlNWQiLCJpZCI6NDQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJhc3NldHMiOlsyODk1N10sImlhdCI6MTU2ODM5OTgxNn0.Bqe4IWmT6etdZYqm12WcgdW52wDLzdbKM4Xx_8lRZmk';

const DATA_URI = 'https://raw.githubusercontent.com/uber-web/loaders.gl/master';
const EXAMPLE_INDEX_URL = `${DATA_URI}/modules/3d-tiles/test/data/index.json`;

export const INITIAL_EXAMPLE_CATEGORY = 'ion';
export const INITIAL_EXAMPLE_NAME = 'Melbourne (PointCloud)';

const ADDITIONAL_EXAMPLES = {
  github: {
    examples: {
      'Royal Exhibition Building (Github Pages)': {
        tilesetUrl: `${DECK_DATA_URI}/3d-tiles/RoyalExhibitionBuilding/tileset.json`
      }
    }
  },
  ion: {
    name: 'Cesium ION',
    examples: {
      'Melbourne (PointCloud)': {ionAssetId: 28957, ionAccessToken: ION_TOKEN_MELBOURNE},
      'Mount St Helens (PointCloud)': {ionAssetId: 33301, ionAccessToken: ION_TOKEN_1},
      'Montreal (PointCloud)': {ionAssetId: 28945, ionAccessToken: ION_TOKEN_1},
      'New York Buildings 1 (3D Photogrammetry)': {
        ionAssetId: 6193,
        ionAccessToken: ION_TOKEN_2
      },
      'Manhattan (3D Photogrammetry)': {
        ionAssetId: 7162,
        ionAccessToken: ION_TOKEN_2
      }
    }
  },
  vricon: {
    name: 'vricon Photogrammetry Samples',
    examples: {
      Cairo: {ionAssetId: 29328, ionAccessToken: ION_TOKEN_VRICON},
      Caracas: {ionAssetId: 29331, ionAccessToken: ION_TOKEN_VRICON},
      Damascus: {ionAssetId: 29332, ionAccessToken: ION_TOKEN_VRICON},
      Honolulu: {ionAssetId: 29333, ionAccessToken: ION_TOKEN_VRICON},
      'San Francisco': {ionAssetId: 29334, ionAccessToken: ION_TOKEN_VRICON},
      Tehran: {ionAssetId: 29335, ionAccessToken: ION_TOKEN_VRICON}
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

  resolveUrls(testExamples);

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

function resolveUrls(exampleIndex) {
  for (const category of Object.values(exampleIndex)) {
    for (const example of Object.values(category.examples)) {
      example.tilesetUrl = `${DATA_URI}/${example.path}/${example.tileset}`;
    }
  }
}
