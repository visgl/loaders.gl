import {prepareDataForAttributesConversion} from '../../../src/i3s-converter/helpers/gltf-attributes';
import test from 'tape-promise/tape';

test('gltf-attributes - Should generate attributes object from tileContent without images', async (t) => {
  const tileContent = {
    gltf: {
      materials: [{id: 'one', alphaMode: 'OPAQUE'}],
      scene: {
        id: 'scene-one',
        nodes: [
          {
            id: 'node-one',
            name: 'nodeName',
            mesh: {
              primitives: [
                {
                  attributes: {
                    _BATCHID: {
                      id: 'accessor-1',
                      value: new Float32Array([1, 2, 3]),
                      bufferView: {buffer: {arrayBuffer: new ArrayBuffer(1)}}
                    },
                    NORMAL: {
                      id: 'accessor-2',
                      value: new Float32Array([4, 5, 6]),
                      bufferView: {buffer: {arrayBuffer: new ArrayBuffer(2)}}
                    },
                    POSITION: {
                      id: 'accessor-3',
                      value: new Float32Array([7, 8, 9]),
                      bufferView: {buffer: {arrayBuffer: new ArrayBuffer(3)}}
                    }
                  },
                  indices: {
                    id: 'accessor-4',
                    value: new Uint16Array([1, 2, 3, 4, 5]),
                    bufferView: {buffer: {arrayBuffer: new ArrayBuffer(4)}}
                  },
                  material: {
                    id: 'material-0',
                    alphaMode: 'OPAQUE'
                  }
                }
              ]
            }
          }
        ]
      }
    },
    cartographicOrigin: [1, 2, 3],
    cartesianModelMatrix: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  };

  const expectedResult = {
    gltfMaterials: [{id: 'one'}],
    nodes: [
      {
        id: 'node-one',
        name: 'nodeName',
        images: [],
        mesh: {
          primitives: [
            {
              attributes: {
                _BATCHID: {value: new Float32Array([1, 2, 3])},
                NORMAL: {value: new Float32Array([4, 5, 6])},
                POSITION: {value: new Float32Array([7, 8, 9])}
              },
              indices: {
                value: new Uint16Array([1, 2, 3, 4, 5])
              },
              material: {
                id: 'material-0'
              }
            }
          ]
        }
      }
    ],
    cartographicOrigin: [1, 2, 3],
    cartesianModelMatrix: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  };
  // @ts-expect-error
  const result = prepareDataForAttributesConversion(tileContent);

  t.ok(result);
  t.deepEqual(result, expectedResult);
  t.end();
});

test('gltf-attributes - Should generate attributes object from tileContent with images', async (t) => {
  const tileContent = {
    gltf: {
      materials: [{id: 'one', alphaMode: 'OPAQUE'}],
      images: [
        {
          name: 'test',
          mimeType: 'image/ktx2',
          image: {
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
        },
        {
          name: 'test2',
          mimeType: 'image/jpeg',
          image: {
            width: 3,
            height: 3,
            components: 4,
            data: new Uint8Array([3, 3, 3, 255, 4, 4, 4, 255]),
            shape: [2, 2, 4]
          }
        }
      ],
      scene: {
        id: 'scene-one',
        nodes: [
          {
            id: 'node-one',
            name: 'nodeName',
            mesh: {
              primitives: [
                {
                  attributes: {
                    _BATCHID: {
                      id: 'accessor-1',
                      value: new Float32Array([1, 2, 3]),
                      bufferView: {buffer: {arrayBuffer: new ArrayBuffer(1)}}
                    },
                    NORMAL: {
                      id: 'accessor-2',
                      value: new Float32Array([4, 5, 6]),
                      bufferView: {buffer: {arrayBuffer: new ArrayBuffer(2)}}
                    },
                    POSITION: {
                      id: 'accessor-3',
                      value: new Float32Array([7, 8, 9]),
                      bufferView: {buffer: {arrayBuffer: new ArrayBuffer(3)}}
                    }
                  },
                  indices: {
                    id: 'accessor-4',
                    value: new Uint16Array([1, 2, 3, 4, 5]),
                    bufferView: {buffer: {arrayBuffer: new ArrayBuffer(4)}}
                  },
                  material: {
                    id: 'material-0',
                    alphaMode: 'OPAQUE'
                  }
                }
              ]
            }
          }
        ]
      }
    },
    cartographicOrigin: [1, 2, 3],
    cartesianModelMatrix: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  };

  const expectedResult = {
    gltfMaterials: [{id: 'one'}],
    nodes: [
      {
        id: 'node-one',
        name: 'nodeName',
        images: [
          {
            width: undefined,
            height: undefined,
            components: undefined,
            mimeType: 'image/ktx2',
            compressed: true,
            data: null
          },
          {
            width: 3,
            height: 3,
            components: 4,
            mimeType: 'image/jpeg',
            compressed: false,
            data: new Uint8Array([3, 3, 3, 255, 4, 4, 4, 255])
          }
        ],
        mesh: {
          primitives: [
            {
              attributes: {
                _BATCHID: {value: new Float32Array([1, 2, 3])},
                NORMAL: {value: new Float32Array([4, 5, 6])},
                POSITION: {value: new Float32Array([7, 8, 9])}
              },
              indices: {
                value: new Uint16Array([1, 2, 3, 4, 5])
              },
              material: {
                id: 'material-0'
              }
            }
          ]
        }
      }
    ],
    cartographicOrigin: [1, 2, 3],
    cartesianModelMatrix: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  };
  // @ts-expect-error
  const result = prepareDataForAttributesConversion(tileContent);

  t.ok(result);
  t.deepEqual(result, expectedResult);
  t.end();
});
