import test from 'tape-promise/tape';
import {handleBatchIdsExtensions} from '../../../src/i3s-converter/helpers/batch-ids-extensions';

test('tile-converter(i3s)#handleBatchIdsExtensions - Should return empty array if no extensions in primitive', async (t) => {
  const attributes = {};
  const primitive = {};
  const images = [];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);

  t.deepEqual(batchIds, []);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - Should return empty array for not supported EXT_mesh_features yet', async (t) => {
  const attributes = {};
  const primitive = {
    extensions: {
      EXT_mesh_features: {}
    }
  };
  const images = [];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);

  t.deepEqual(batchIds, []);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - Should return empty array for not supported extensions', async (t) => {
  const attributes = {};
  const primitive = {
    extensions: {
      UnsupportedExtension: {}
    }
  };
  const images = [];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);

  t.deepEqual(batchIds, []);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - EXT_feature_metadata - Should return empty array for empty EXT_feature_metadata extension', async (t) => {
  const attributes = {};
  const primitive = {
    extensions: {
      EXT_feature_metadata: {}
    }
  };
  const images = [];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);

  t.deepEqual(batchIds, []);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - EXT_feature_metadata - Should return batchIds if attribute exists', async (t) => {
  const attributes = {
    _FEATURE_ID_0: {value: new Float32Array([1, 2, 3])}
  };
  const primitive = {
    extensions: {
      EXT_feature_metadata: {
        featureIdAttributes: [
          {
            featureIds: {
              attribute: '_FEATURE_ID_0'
            }
          }
        ]
      }
    }
  };
  const images = [];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);
  const expectedResult = new Float32Array([1, 2, 3]);

  t.deepEqual(batchIds, expectedResult);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - EXT_feature_metadata - Should return empty array for implicit batchIds if no POSITIONS', async (t) => {
  const attributes = {};
  const primitive = {
    extensions: {
      EXT_feature_metadata: {
        featureIdAttributes: [
          {
            featureIds: {
              constant: 0,
              devisor: 1
            }
          }
        ]
      }
    }
  };
  const images = [];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);

  t.deepEqual(batchIds, []);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - EXT_feature_metadata - Should return implicit batchIds for divisor = 0 ', async (t) => {
  const attributes = {
    POSITIONS: {value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9])}
  };
  const primitive = {
    extensions: {
      EXT_feature_metadata: {
        featureIdAttributes: [
          {
            featureIds: {
              constant: 0,
              divisor: 0
            }
          }
        ]
      }
    }
  };
  const images = [];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);
  const expectedResult = new Float32Array([0, 0, 0]);

  t.deepEqual(batchIds, expectedResult);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - EXT_feature_metadata - Should return implicit batchIds for divisor = 1', async (t) => {
  const attributes = {
    POSITIONS: {value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9])}
  };
  const primitive = {
    extensions: {
      EXT_feature_metadata: {
        featureIdAttributes: [
          {
            featureIds: {
              constant: 0,
              divisor: 1
            }
          }
        ]
      }
    }
  };
  const images = [];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);
  const expectedResult = new Float32Array([0, 1, 2]);

  t.deepEqual(batchIds, expectedResult);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - EXT_feature_metadata - Should return implicit batchIds for divisor = 2', async (t) => {
  const attributes = {
    POSITIONS: {value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])}
  };
  const primitive = {
    extensions: {
      EXT_feature_metadata: {
        featureIdAttributes: [
          {
            featureIds: {
              constant: 0,
              divisor: 2
            }
          }
        ]
      }
    }
  };
  const images = [];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);
  const expectedResult = new Float32Array([0, 0, 1, 1, 2]);

  t.deepEqual(batchIds, expectedResult);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - EXT_feature_metadata - Should return empty batchIds for compressed texture', async (t) => {
  const attributes = {
    POSITIONS: {value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9])},
    TEXCOORD_0: {
      value: new Float32Array([0.1, 0.1, 0.9, 0.9, 0.1, 0.9])
    }
  };
  const primitive = {
    extensions: {
      EXT_feature_metadata: {
        featureIdTextures: [
          {
            featureIds: {
              texture: {
                index: 0
              },
              channels: 'r'
            }
          }
        ]
      }
    }
  };
  const images = [
    {
      name: 'first',
      compressed: true,
      data: [
        {
          components: 4,
          width: 2,
          height: 2,
          data: new Uint8Array([1, 2, 3, 255])
        }
      ]
    }
  ];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);

  t.deepEqual(batchIds, []);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - EXT_feature_metadata - Should return batchIds for featureTextures provided', async (t) => {
  const attributes = {
    firstTextureName: {
      value: new Float32Array([33, 35, 29, 32, 24, 28])
    }
  };
  const primitive = {
    extensions: {
      EXT_feature_metadata: {
        featureTextures: ['firstTextureName', 'secondTextureName']
      }
    }
  };
  const images = [
    {
      name: 'first',
      components: 4,
      height: 2,
      width: 2,
      data: new Uint8Array([24, 24, 24, 255, 28, 28, 28, 255, 35, 35, 35, 255, 24, 24, 24, 255])
    }
  ];
  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images, 'firstTextureName');

  t.deepEqual(batchIds, [33, 35, 29, 32, 24, 28]);
});

test('tile-converter(i3s)#handleBatchIdsExtensions - EXT_feature_metadata - Should return batchIds for texture', async (t) => {
  const attributes = {
    POSITIONS: {value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9])},
    TEXCOORD_0: {
      value: new Float32Array([0.1, 0.1, 0.9, 0.9, 0.1, 0.9])
    }
  };
  const primitive = {
    extensions: {
      EXT_feature_metadata: {
        featureIdTextures: [
          {
            featureIds: {
              texture: {
                index: 0
              },
              channels: 'r'
            }
          }
        ]
      }
    }
  };
  const images = [
    {
      name: 'first',
      components: 4,
      height: 2,
      width: 2,
      data: new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255, 255, 0, 0, 255, 0, 0, 255, 255])
    }
  ];

  // @ts-ignore
  const batchIds = handleBatchIdsExtensions(attributes, primitive, images);
  const expectedResult = [255, 0, 255];

  t.deepEqual(batchIds, expectedResult);
});
