const DECK_DATA_URI = 'https://raw.githubusercontent.com/visgl/deck.gl-data/master';
const ION_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NjEwMjA4Ni00YmVkLTQyMjgtYjRmZS1lY2M3ZWFiMmFmNTYiLCJpZCI6MjYxMzMsImlhdCI6MTY3NTM2ODY4NX0.chGkGL6DkDNv5wYJQDMzWIvi9iDoVa27dgng_5ARDmo';

const DATA_URI = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';
const EXAMPLE_INDEX_URL = `${DATA_URI}/modules/3d-tiles/test/data/index.json`;

export const INITIAL_EXAMPLE_CATEGORY = 'ion';
export const INITIAL_EXAMPLE_NAME = 'Melbourne (PointCloud)';

const SHOWCASE_EXAMPLES = {
  ion: {
    name: 'Cesium ION',
    examples: {
      'Melbourne (PointCloud)': {
        ionAssetId: 43978,
        ionAccessToken: ION_TOKEN,
        maximumScreenSpaceError: 4
      },
      'Melbourne (Photogrammetry)': {
        ionAssetId: 69380,
        ionAccessToken: ION_TOKEN,
        maximumScreenSpaceError: 4
      },
      'Montreal (PointCloud)': {
        ionAssetId: 28945,
        ionAccessToken: ION_TOKEN,
        maximumScreenSpaceError: 8
      },
      'Mount St Helens (PointCloud)': {
        ionAssetId: 33301,
        ionAccessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxN2NhMzkwYi0zNWM4LTRjNTYtYWE3Mi1jMDAxYzhlOGVmNTAiLCJpZCI6OTYxOSwic2NvcGVzIjpbImFzbCIsImFzciIsImFzdyIsImdjIl0sImlhdCI6MTU2MjE4MTMxM30.OkgVr6NaKYxabUMIGqPOYFe0V5JifXLVLfpae63x-tA',
        maximumScreenSpaceError: 4
      },
      // This tileset is not available on CesiumIon anymore
      // '555 Market (PointCloud)': {
      //   ionAssetId: 55337,
      //   ionAccessToken: ION_TOKEN,
      //   maximumScreenSpaceError: 16
      // },
      'Phillipines (B3DM)': {
        ionAssetId: 34014,
        ionAccessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MTQ0NTNiOC0wNzlmLTQ1ZGEtYjM3Yi05ZmJlY2FiMmRjYWMiLCJpZCI6MTMxNTEsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjI2OTQ3NTh9.tlqEVzzO25Itcla4jD17yywNFvAVM-aNVduzF6ss-1g'
      },
      'Phillipines (PointCloud)': {
        ionAssetId: 34013,
        ionAccessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0MTQ0NTNiOC0wNzlmLTQ1ZGEtYjM3Yi05ZmJlY2FiMmRjYWMiLCJpZCI6MTMxNTEsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjI2OTQ3NTh9.tlqEVzzO25Itcla4jD17yywNFvAVM-aNVduzF6ss-1g'
      }
    }
  },
  nearmap: {
    name: 'nearmap Photogrammetry Tilesets',
    examples: {
      'Las Vegas': {
        ionAssetId: 44865,
        ionAccessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwOTBkYTA1ZS03NGM5LTQyNTEtOTViOS1hZDFmNDZjZGQ3YTEiLCJpZCI6NDQsInNjb3BlcyI6WyJhc3IiXSwiYXNzZXRzIjpbNDQ4NjVdLCJpYXQiOjE1Njk0MTcwNjh9.zrWE65u2u-TYyTSRKhDl9-yDYrC_qxiJQ-tZFCgMbt0'
      },
      'New York': {
        ionAssetId: 7162,
        ionAccessToken:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzMGY4ODczYy1mNTk4LTRiMDUtYmIxYy0xZWYwOWZmMGY4NjQiLCJpZCI6NDQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJhc3NldHMiOlsxLDIsMyw0LDYxOTMsNjI3Myw3MTYyLDczNTMsNzE0Ml0sImlhdCI6MTU0MTYxODM0NX0.lWnGs9ySXO4QK3HagcMsDpZ8L01DpmUDQm38-2QAQuE'
      }
    }
  },
  // These tilesets are not available anymore due
  // vricon: {
  //   name: 'VRICON Photogrammetry Samples',
  //   examples: {
  //     Cairo: {ionAssetId: 29328, ionAccessToken: ION_TOKEN},
  //     Caracas: {ionAssetId: 29331, ionAccessToken: ION_TOKEN},
  //     Damascus: {ionAssetId: 29332, ionAccessToken: ION_TOKEN},
  //     Honolulu: {ionAssetId: 29333, ionAccessToken: ION_TOKEN},
  //     'San Francisco': {ionAssetId: 29334, ionAccessToken: ION_TOKEN},
  //     Tehran: {ionAssetId: 29335, ionAccessToken: ION_TOKEN}
  //   }
  // },
  github: {
    name: 'Others',
    examples: {
      '555 Market - Point Cloud (Github Pages)': {
        tilesetUrl: `${DECK_DATA_URI}/3d-tiles/555Market/tileset.json`
      },
      'Royal Exhibition Building (Github Pages)': {
        tilesetUrl: `${DECK_DATA_URI}/3d-tiles/RoyalExhibitionBuilding/tileset.json`
      }
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

function resolveUrls(exampleIndex) {
  for (const category of Object.values(exampleIndex)) {
    for (const example of Object.values(category.examples)) {
      example.tilesetUrl = `${DATA_URI}/${example.path}/${example.tileset}`;
    }
  }
}
