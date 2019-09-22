/* global fetch */
const DECK_DATA_URI = 'https://raw.githubusercontent.com/uber-common/deck.gl-data/master';

const ION_TOKEN_ST_HELEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxN2NhMzkwYi0zNWM4LTRjNTYtYWE3Mi1jMDAxYzhlOGVmNTAiLCJpZCI6OTYxOSwic2NvcGVzIjpbImFzbCIsImFzciIsImFzdyIsImdjIl0sImlhdCI6MTU2MjE4MTMxM30.OkgVr6NaKYxabUMIGqPOYFe0V5JifXLVLfpae63x-tA';
const ION_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ';

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
      'Melbourne (PointCloud)': {ionAssetId: 43978, ionAccessToken: ION_TOKEN},
      'Mount St Helens (PointCloud)': {ionAssetId: 33301, ionAccessToken: ION_TOKEN_ST_HELEN},
      'Montreal (PointCloud)': {ionAssetId: 28945, ionAccessToken: ION_TOKEN}
    }
  },
  vricon: {
    name: 'vricon Photogrammetry Samples',
    examples: {
      Cairo: {ionAssetId: 29328, ionAccessToken: ION_TOKEN},
      Caracas: {ionAssetId: 29331, ionAccessToken: ION_TOKEN},
      Damascus: {ionAssetId: 29332, ionAccessToken: ION_TOKEN},
      Honolulu: {ionAssetId: 29333, ionAccessToken: ION_TOKEN},
      'San Francisco': {ionAssetId: 29334, ionAccessToken: ION_TOKEN},
      Tehran: {ionAssetId: 29335, ionAccessToken: ION_TOKEN}
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
