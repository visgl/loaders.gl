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

test('gltf#EXT_feature_metadata - Should handle feature texture attributes', async (t) => {
  const GLTF_WITH_TEXTURES = {
    buffers: [
      {
        arrayBuffer: new Float32Array([0.1, 0.1, 0.1, 0.9, 0.9, 0.1, 0.9, 0.9]).buffer,
        byteOffset: 0,
        byteLength: 32
      }
    ],
    images: [
      {
        name: 'first',
        components: 4,
        height: 2,
        width: 2,
        data: new Uint8Array([24, 24, 24, 255, 28, 28, 28, 255, 35, 35, 35, 255, 24, 24, 24, 255])
      }
    ],

    json: {
      accessors: [
        {
          bufferView: 0,
          componentType: 5125,
          count: 8,
          type: 'SCALAR'
        }
      ],
      buffers: [
        {
          buffer: 0,
          byteOffset: 0,
          byteLength: 32
        }
      ],
      bufferViews: [{buffer: 0, byteOffset: 0, byteLength: 32}],
      extensionsUsed: ['EXT_feature_metadata'],
      extensions: {
        EXT_feature_metadata: {
          schema: {
            classes: {
              'r3dm::uncertainty_ce90sum': {
                properties: {
                  'r3dm::uncertainty_ce90sum': {
                    type: 'UINT8'
                  }
                }
              }
            }
          },
          featureTextures: {
            'r3dm::uncertainty_ce90sum': {
              class: 'r3dm::uncertainty_ce90sum',
              properties: {
                'r3dm::uncertainty_ce90sum': {
                  channels: 'r',
                  texture: {
                    index: 0,
                    texCoord: 0
                  }
                }
              }
            }
          },
          extras: {
            draftVersion: '1.0.0'
          }
        }
      },
      textures: [
        {
          sampler: 0,
          source: 0
        }
      ],
      meshes: [
        {
          primitives: [
            {
              attributes: {
                TEXCOORD_0: 0
              },
              indices: 3,
              material: 0,
              mode: 4,
              extensions: {
                EXT_feature_metadata: {
                  featureTextures: ['r3dm::uncertainty_ce90sum']
                }
              }
            }
          ]
        }
      ]
    }
  };

  await decodeExtensions(GLTF_WITH_TEXTURES, {gltf: {loadImages: true}});

  const expectedResult = {
    buf: {
      arrayBuffer: new Uint32Array([0, 1, 2, 0]).buffer,
      byteOffset: 0,
      byteLength: 16
    },
    data: [24, 35, 28]
  };

  t.deepEqual(GLTF_WITH_TEXTURES.buffers[1], expectedResult.buf);
  t.deepEqual(
    GLTF_WITH_TEXTURES.json.extensions.EXT_feature_metadata.featureTextures[
      'r3dm::uncertainty_ce90sum'
    ].properties['r3dm::uncertainty_ce90sum'].data,
    expectedResult.data
  );
  t.end();
});
