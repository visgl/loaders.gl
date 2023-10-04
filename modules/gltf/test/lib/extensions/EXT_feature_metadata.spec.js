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

  const options = {gltf: {loadImages: true, loadBuffers: true}};
  await decodeExtensions(gltfWithFeatureTextures, options);

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

  const options = {gltf: {loadImages: true, loadBuffers: true}};
  await decodeExtensions(GLTF_WITH_STRING_PROPERTIES, options);

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

test('gltf#EXT_feature_metadata - Should handle number feature attributes', async (t) => {
  const binaryBufferData = [
    65, 76, 48, 49, 51, 65, 76, 48, 49, 51, 65, 76, 48, 49, 51, 65, 76, 48, 49, 51, 65, 76, 48, 49,
    51, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 10, 0, 0, 0, 15, 0, 0, 0, 20, 0, 0, 0, 25, 0,
    0, 0, 193, 189, 240, 255, 193, 189, 240, 255, 193, 189, 240, 255, 193, 189, 240, 255, 193, 189,
    240, 255, 0, 0, 0, 0, 97, 114, 101, 97, 108, 97, 114, 101, 97, 108, 97, 114, 101, 97, 108, 97,
    114, 101, 97, 108, 97, 114, 101, 97, 108, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 10, 0, 0,
    0, 15, 0, 0, 0, 20, 0, 0, 0, 25, 0, 0, 0, 110, 31, 47, 64, 110, 47, 144, 64, 92, 4, 175, 64, 88,
    15, 203, 64, 18, 98, 212, 64, 0, 0, 0, 0, 109, 97, 120, 97, 114, 109, 97, 120, 97, 114, 109, 97,
    120, 97, 114, 109, 97, 120, 97, 114, 109, 97, 120, 97, 114, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5,
    0, 0, 0, 10, 0, 0, 0, 15, 0, 0, 0, 20, 0, 0, 0, 25, 0, 0, 0, 41, 41, 41, 41, 41
  ];
  const GLTF_WITH_EXTENSION = {
    buffers: [
      {
        arrayBuffer: new Uint8Array(binaryBufferData).buffer,
        byteOffset: 0,
        byteLength: binaryBufferData.length
      }
    ],
    json: {
      extensionsUsed: ['EXT_feature_metadata'],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 25},
        {buffer: 0, byteOffset: 32, byteLength: 24},
        {buffer: 0, byteOffset: 56, byteLength: 20},
        {buffer: 0, byteOffset: 80, byteLength: 25},
        {buffer: 0, byteOffset: 112, byteLength: 24},
        {buffer: 0, byteOffset: 136, byteLength: 20},
        {buffer: 0, byteOffset: 160, byteLength: 25},
        {buffer: 0, byteOffset: 192, byteLength: 24},
        {buffer: 0, byteOffset: 216, byteLength: 5}
      ],
      buffers: [{byteLength: 26894}],
      extensions: {
        EXT_feature_metadata: {
          schema: {
            classes: {
              buildings: {
                properties: {
                  f_code: {type: 'STRING'},
                  ffn: {type: 'INT32'},
                  geom_type: {type: 'STRING'},
                  hgt: {type: 'FLOAT32'},
                  src: {type: 'STRING'},
                  ssr: {type: 'UINT8'}
                }
              }
            }
          },
          featureTables: {
            buildings: {
              class: 'buildings',
              count: 5,
              properties: {
                f_code: {bufferView: 0, offsetType: 'UINT32', stringOffsetBufferView: 1},
                ffn: {bufferView: 2},
                geom_type: {bufferView: 3, offsetType: 'UINT32', stringOffsetBufferView: 4},
                hgt: {bufferView: 5},
                src: {bufferView: 6, offsetType: 'UINT32', stringOffsetBufferView: 7},
                ssr: {bufferView: 8}
              }
            }
          }
        }
      }
    }
  };

  const options = {gltf: {loadImages: true, loadBuffers: true}};
  await decodeExtensions(GLTF_WITH_EXTENSION, options);

  const expectedJson = {
    extensionsUsed: ['EXT_feature_metadata'],
    bufferViews: [
      {buffer: 0, byteOffset: 0, byteLength: 25},
      {buffer: 0, byteOffset: 32, byteLength: 24},
      {buffer: 0, byteOffset: 56, byteLength: 20},
      {buffer: 0, byteOffset: 80, byteLength: 25},
      {buffer: 0, byteOffset: 112, byteLength: 24},
      {buffer: 0, byteOffset: 136, byteLength: 20},
      {buffer: 0, byteOffset: 160, byteLength: 25},
      {buffer: 0, byteOffset: 192, byteLength: 24},
      {buffer: 0, byteOffset: 216, byteLength: 5}
    ],
    buffers: [{byteLength: 26894}],
    extensions: {
      EXT_feature_metadata: {
        schema: {
          classes: {
            buildings: {
              properties: {
                f_code: {type: 'STRING'},
                ffn: {type: 'INT32'},
                geom_type: {type: 'STRING'},
                hgt: {type: 'FLOAT32'},
                src: {type: 'STRING'},
                ssr: {type: 'UINT8'}
              }
            }
          }
        },
        featureTables: {
          buildings: {
            class: 'buildings',
            count: 5,
            properties: {
              f_code: {
                bufferView: 0,
                offsetType: 'UINT32',
                stringOffsetBufferView: 1,
                data: ['AL013', 'AL013', 'AL013', 'AL013', 'AL013']
              },
              ffn: {
                bufferView: 2,
                data: new Int32Array([-999999, -999999, -999999, -999999, -999999])
              },
              geom_type: {
                bufferView: 3,
                offsetType: 'UINT32',
                stringOffsetBufferView: 4,
                data: ['areal', 'areal', 'areal', 'areal', 'areal']
              },
              hgt: {
                bufferView: 5,
                data: new Float32Array([
                  2.736293315887451, 4.505789756774902, 5.469282150268555, 6.345623016357422,
                  6.636971473693848
                ])
              },
              src: {
                bufferView: 6,
                offsetType: 'UINT32',
                stringOffsetBufferView: 7,
                data: ['maxar', 'maxar', 'maxar', 'maxar', 'maxar']
              },
              ssr: {bufferView: 8, data: new Uint8Array([41, 41, 41, 41, 41])}
            }
          }
        }
      }
    }
  };

  // Modifies input
  t.deepEqual(GLTF_WITH_EXTENSION.json, expectedJson);

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
          componentType: 5126,
          count: 4,
          type: 'VEC2'
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

  const options = {gltf: {loadImages: true, loadBuffers: true}};
  await decodeExtensions(GLTF_WITH_TEXTURES, options);

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

test('gltf#EXT_feature_metadata - Should handle arrays', async (t) => {
  const binaryBufferData = [
    0, 0, 0, 125, 125, 125, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 100, 100, 0, 125, 63, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 100, 100, 0, 255, 255, 0, 255, 125, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 255, 0, 0, 250, 0, 0, 255, 125, 63, 255, 0, 63, 170, 0, 0, 125, 0, 125, 255, 0, 170,
    0, 255, 86, 117, 79, 0, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 55, 156, 191, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 125, 0, 255, 255, 0, 255, 0, 0, 0, 255, 255, 125, 0, 0, 0, 0, 0, 0, 0, 255,
    255, 0, 0, 0, 0, 0, 0, 0, 125, 125, 255, 125, 255, 0, 0, 0, 255, 0, 125, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 255, 125, 63, 255, 0, 0, 0, 0, 0, 125, 0, 125, 255,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 255, 125, 63, 255, 0, 0, 0, 0, 0, 125, 0,
    125, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 0, 0, 255, 125, 63, 255, 0, 0, 0, 0, 0,
    125, 0, 125, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 110, 101, 118, 101, 114, 95, 99, 108, 97, 115,
    115, 105, 102, 105, 101, 100, 117, 110, 100, 101, 102, 98, 117, 105, 108, 100, 105, 110, 103,
    117, 110, 116, 114, 117, 115, 116, 101, 100, 95, 103, 114, 111, 117, 110, 100, 109, 109, 95,
    111, 98, 106, 101, 99, 116, 117, 110, 116, 114, 117, 115, 116, 101, 100, 95, 103, 114, 111, 117,
    110, 100, 103, 114, 97, 115, 115, 108, 97, 110, 100, 98, 97, 114, 114, 101, 110, 95, 103, 114,
    111, 117, 110, 100, 109, 105, 115, 99, 95, 115, 110, 111, 119, 118, 101, 103, 101, 116, 97, 116,
    105, 111, 110, 118, 101, 103, 95, 109, 105, 120, 118, 101, 103, 95, 101, 118, 101, 114, 103,
    114, 101, 101, 110, 118, 101, 103, 95, 100, 101, 99, 105, 100, 117, 111, 117, 115, 118, 101,
    103, 95, 115, 99, 114, 117, 98, 118, 101, 103, 95, 99, 111, 110, 105, 102, 101, 114, 118, 101,
    103, 95, 98, 114, 111, 97, 100, 108, 101, 97, 102, 118, 101, 103, 95, 111, 95, 114, 111, 97,
    100, 118, 101, 103, 95, 111, 95, 98, 117, 105, 108, 100, 105, 110, 103, 118, 101, 103, 95, 111,
    95, 98, 114, 105, 100, 103, 101, 119, 97, 116, 101, 114, 119, 97, 116, 101, 114, 95, 115, 119,
    105, 109, 109, 105, 110, 103, 112, 111, 111, 108, 109, 109, 95, 103, 114, 111, 117, 110, 100,
    114, 111, 97, 100, 100, 105, 114, 116, 95, 114, 111, 97, 100, 101, 108, 101, 118, 97, 116, 101,
    100, 95, 114, 111, 97, 100, 101, 108, 101, 118, 97, 116, 101, 100, 95, 114, 97, 105, 108, 119,
    97, 121, 114, 97, 105, 108, 119, 97, 121, 114, 117, 110, 119, 97, 121, 108, 111, 119, 95, 118,
    101, 103, 101, 116, 97, 116, 105, 111, 110, 108, 111, 119, 95, 118, 101, 103, 95, 101, 118, 101,
    114, 103, 114, 101, 101, 110, 108, 111, 119, 95, 118, 101, 103, 95, 100, 101, 99, 105, 100, 117,
    111, 117, 115, 108, 111, 119, 95, 118, 101, 103, 95, 99, 111, 110, 105, 102, 101, 114, 108, 111,
    119, 95, 118, 101, 103, 95, 98, 114, 111, 97, 100, 108, 101, 97, 102, 109, 101, 100, 105, 117,
    109, 95, 118, 101, 103, 101, 116, 97, 116, 105, 111, 110, 109, 101, 100, 105, 117, 109, 95, 118,
    101, 103, 95, 101, 118, 101, 114, 103, 114, 101, 101, 110, 109, 101, 100, 105, 117, 109, 95,
    118, 101, 103, 95, 100, 101, 99, 105, 100, 117, 111, 117, 115, 109, 101, 100, 105, 117, 109, 95,
    118, 101, 103, 95, 99, 111, 110, 105, 102, 101, 114, 109, 101, 100, 105, 117, 109, 95, 118, 101,
    103, 95, 98, 114, 111, 97, 100, 108, 101, 97, 102, 104, 105, 103, 104, 95, 118, 101, 103, 101,
    116, 97, 116, 105, 111, 110, 104, 105, 103, 104, 95, 118, 101, 103, 95, 101, 118, 101, 114, 103,
    114, 101, 101, 110, 104, 105, 103, 104, 95, 118, 101, 103, 95, 100, 101, 99, 105, 100, 117, 111,
    117, 115, 104, 105, 103, 104, 95, 118, 101, 103, 95, 99, 111, 110, 105, 102, 101, 114, 104, 105,
    103, 104, 95, 118, 101, 103, 95, 98, 114, 111, 97, 100, 108, 101, 97, 102, 0, 0, 0, 0, 16, 0, 0,
    0, 21, 0, 0, 0, 21, 0, 0, 0, 21, 0, 0, 0, 21, 0, 0, 0, 21, 0, 0, 0, 29, 0, 0, 0, 45, 0, 0, 0,
    54, 0, 0, 0, 54, 0, 0, 0, 54, 0, 0, 0, 54, 0, 0, 0, 54, 0, 0, 0, 54, 0, 0, 0, 54, 0, 0, 0, 54,
    0, 0, 0, 54, 0, 0, 0, 54, 0, 0, 0, 54, 0, 0, 0, 54, 0, 0, 0, 70, 0, 0, 0, 79, 0, 0, 0, 92, 0, 0,
    0, 92, 0, 0, 0, 92, 0, 0, 0, 101, 0, 0, 0, 101, 0, 0, 0, 101, 0, 0, 0, 101, 0, 0, 0, 101, 0, 0,
    0, 101, 0, 0, 0, 101, 0, 0, 0, 101, 0, 0, 0, 101, 0, 0, 0, 101, 0, 0, 0, 101, 0, 0, 0, 101, 0,
    0, 0, 101, 0, 0, 0, 101, 0, 0, 0, 101, 0, 0, 0, 111, 0, 0, 0, 118, 0, 0, 0, 131, 0, 0, 0, 144,
    0, 0, 0, 153, 0, 0, 0, 164, 0, 0, 0, 177, 0, 0, 0, 187, 0, 0, 0, 201, 0, 0, 0, 213, 0, 0, 0,
    213, 0, 0, 0, 213, 0, 0, 0, 213, 0, 0, 0, 213, 0, 0, 0, 213, 0, 0, 0, 213, 0, 0, 0, 213, 0, 0,
    0, 213, 0, 0, 0, 213, 0, 0, 0, 213, 0, 0, 0, 218, 0, 0, 0, 218, 0, 0, 0, 218, 0, 0, 0, 218, 0,
    0, 0, 218, 0, 0, 0, 236, 0, 0, 0, 236, 0, 0, 0, 236, 0, 0, 0, 236, 0, 0, 0, 236, 0, 0, 0, 236,
    0, 0, 0, 236, 0, 0, 0, 236, 0, 0, 0, 236, 0, 0, 0, 236, 0, 0, 0, 236, 0, 0, 0, 236, 0, 0, 0,
    236, 0, 0, 0, 236, 0, 0, 0, 236, 0, 0, 0, 245, 0, 0, 0, 249, 0, 0, 0, 249, 0, 0, 0, 2, 1, 0, 0,
    2, 1, 0, 0, 2, 1, 0, 0, 15, 1, 0, 0, 15, 1, 0, 0, 15, 1, 0, 0, 31, 1, 0, 0, 38, 1, 0, 0, 38, 1,
    0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0,
    44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44,
    1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0,
    0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0,
    44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44, 1, 0, 0, 44,
    1, 0, 0, 44, 1, 0, 0, 58, 1, 0, 0, 58, 1, 0, 0, 75, 1, 0, 0, 92, 1, 0, 0, 92, 1, 0, 0, 107, 1,
    0, 0, 124, 1, 0, 0, 124, 1, 0, 0, 124, 1, 0, 0, 124, 1, 0, 0, 141, 1, 0, 0, 141, 1, 0, 0, 161,
    1, 0, 0, 181, 1, 0, 0, 181, 1, 0, 0, 199, 1, 0, 0, 219, 1, 0, 0, 219, 1, 0, 0, 219, 1, 0, 0,
    219, 1, 0, 0, 234, 1, 0, 0, 234, 1, 0, 0, 252, 1, 0, 0, 14, 2, 0, 0, 14, 2, 0, 0, 30, 2, 0, 0,
    48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48,
    2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0,
    0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0,
    48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48,
    2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0,
    0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0,
    48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48,
    2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0,
    0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0,
    48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48,
    2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0,
    0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0,
    48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48,
    2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0, 48, 2, 0, 0
  ];
  const GLTF_WITH_EXTENSION = {
    buffers: [
      {
        arrayBuffer: new Uint8Array(binaryBufferData).buffer,
        byteOffset: 0,
        byteLength: binaryBufferData.length
      }
    ],
    json: {
      buffers: [
        {
          byteLength: binaryBufferData.length
        }
      ],
      bufferViews: [
        {
          buffer: 0,
          byteOffset: 0,
          byteLength: 768
        },
        {
          buffer: 0,
          byteOffset: 768,
          byteLength: 560
        },
        {
          buffer: 0,
          byteOffset: 1328,
          byteLength: 1028
        }
      ],
      extensions: {
        EXT_feature_metadata: {
          schema: {
            classes: {
              'owt::lulc': {
                properties: {
                  color: {
                    type: 'ARRAY',
                    componentType: 'UINT8',
                    componentCount: 3
                  },
                  name: {
                    type: 'STRING'
                  }
                }
              }
            }
          },
          featureTables: {
            'owt::lulc': {
              class: 'owt::lulc',
              count: 8,
              properties: {
                color: {
                  bufferView: 0
                },
                name: {
                  bufferView: 1,
                  offsetType: 'UINT32',
                  stringOffsetBufferView: 2
                }
              }
            }
          }
        }
      },
      extensionsUsed: ['EXT_feature_metadata']
    }
  };

  const options = {gltf: {loadImages: true, loadBuffers: true}};
  await decodeExtensions(GLTF_WITH_EXTENSION, options);

  const expectedResult = {
    colorData: [
      {
        0: 0,
        1: 0,
        2: 0
      },
      {
        0: 125,
        1: 125,
        2: 125
      },
      {
        0: 0,
        1: 0,
        2: 0
      },
      {
        0: 0,
        1: 0,
        2: 0
      },
      {
        0: 0,
        1: 0,
        2: 0
      },
      {
        0: 0,
        1: 0,
        2: 0
      },
      {
        0: 255,
        1: 0,
        2: 0
      },
      {
        0: 100,
        1: 100,
        2: 0
      }
    ],
    nameData: ['never_classified', 'undef', '', '', '', '', 'building', 'untrusted_ground']
  };

  t.deepEqual(
    GLTF_WITH_EXTENSION.json.extensions.EXT_feature_metadata.featureTables['owt::lulc'].properties
      .color.data,
    expectedResult.colorData
  );
  t.deepEqual(
    GLTF_WITH_EXTENSION.json.extensions.EXT_feature_metadata.featureTables['owt::lulc'].properties
      .name.data,
    expectedResult.nameData
  );
  t.end();
});
