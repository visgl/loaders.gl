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

  await decodeExtensions(GLTF_WITH_EXTENSION);

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
