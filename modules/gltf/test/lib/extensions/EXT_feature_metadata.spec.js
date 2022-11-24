/* eslint-disable camelcase */
import test from 'tape-promise/tape';

// @ts-expect-error
import {decodeExtensions} from '@loaders.gl/gltf/lib/api/gltf-extensions';

test('gltf#EXT_feature_metadata - Should do nothing if no "EXT_feature_metadata" extension', async (t) => {
  const gltfWithFeatureTextures = {
    json: {
      extensionsUsed: ['EXT_feature_metadata'],
      extensions: {}
    }
  };

  await decodeExtensions(gltfWithFeatureTextures);

  const expectedResult = {
    json: {
      extensionsUsed: ['EXT_feature_metadata'],
      extensions: {}
    }
  };

  // Modifies input
  t.deepEqual(gltfWithFeatureTextures.json, expectedResult.json);
  t.end();
});

/**
 * TODO Add support for featureTextures
 * Spec - https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata#feature-textures
 */
test('gltf#EXT_feature_metadata - Should do nothing for extension with feature textures', async (t) => {
  const gltfWithFeatureTextures = {
    json: {
      extensionsUsed: ['EXT_feature_metadata'],
      extensions: {
        EXT_feature_metadata: {
          schema: {
            classes: {
              label: {
                properties: {
                  component: {type: 'STRING'}
                }
              }
            }
          },
          featureTextures: {}
        }
      }
    }
  };

  await decodeExtensions(gltfWithFeatureTextures);

  const expectedResult = {
    json: {
      extensionsUsed: ['EXT_feature_metadata'],
      extensions: {
        EXT_feature_metadata: {
          schema: {
            classes: {
              label: {
                properties: {
                  component: {type: 'STRING'}
                }
              }
            }
          },
          featureTextures: {}
        }
      }
    }
  };

  // Modifies input
  t.deepEqual(gltfWithFeatureTextures.json, expectedResult.json);
  t.end();
});

test('gltf#EXT_feature_metadata - Should handle String feature attributes', async (t) => {
  const GLTF_WITH_STRING_PROPERTIES = {
    buffers: [
      {
        // 'windowroofdoor' encoded string
        arrayBuffer: new Uint8Array([
          119, 105, 110, 100, 111, 119, 114, 111, 111, 102, 100, 111, 111, 114, 0, 0, 0, 0, 6, 0, 0,
          0, 10, 0, 0, 0, 14, 0, 0, 0
        ]).buffer,
        byteOffset: 0,
        byteLength: 30
      }
    ],
    json: {
      bufferViews: [
        // Strings Buffer View
        {buffer: 0, byteOffset: 0, byteLength: 14},
        // Strings Offsets Buffer View
        {buffer: 0, byteOffset: 14, byteLength: 16}
      ],
      extensionsUsed: ['EXT_feature_metadata'],
      extensions: {
        EXT_feature_metadata: {
          schema: {
            classes: {
              label: {
                properties: {
                  component: {type: 'STRING'}
                }
              }
            }
          },
          featureTables: {
            labels: {
              class: 'label',
              count: 3,
              properties: {
                component: {bufferView: 0, stringOffsetBufferView: 1}
              }
            }
          }
        }
      }
    }
  };

  await decodeExtensions(GLTF_WITH_STRING_PROPERTIES);

  const expectedResult = {
    buffers: [
      {
        // 'windowroofdoor' encoded string
        arrayBuffer: new Uint8Array([
          119, 105, 110, 100, 111, 119, 114, 111, 111, 102, 100, 111, 111, 114, 0, 0, 0, 0, 6, 0, 0,
          0, 10, 0, 0, 0, 14, 0, 0, 0
        ]).buffer,
        byteOffset: 0,
        byteLength: 30
      }
    ],
    json: {
      bufferViews: [
        // Strings Buffer View
        {buffer: 0, byteOffset: 0, byteLength: 14},
        // Strings Offsets Buffer View
        {buffer: 0, byteOffset: 14, byteLength: 16}
      ],
      extensionsUsed: ['EXT_feature_metadata'],
      extensions: {
        EXT_feature_metadata: {
          schema: {
            classes: {
              label: {
                properties: {
                  component: {type: 'STRING'}
                }
              }
            }
          },
          featureTables: {
            labels: {
              class: 'label',
              count: 3,
              properties: {
                component: {
                  bufferView: 0,
                  stringOffsetBufferView: 1,
                  data: ['window', 'roof', 'door']
                }
              }
            }
          }
        }
      }
    }
  };

  // Modifies input
  t.deepEqual(GLTF_WITH_STRING_PROPERTIES.json, expectedResult.json);
  t.end();
});
