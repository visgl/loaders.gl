import {BoundingSphere} from '@math.gl/culling';
import {prepareDataForAttributesConversion} from '../../../src/i3s-converter/helpers/gltf-attributes';
import test from 'tape-promise/tape';
import {Matrix4} from '@math.gl/core';

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
    }
  };

  const expectedResult = {
    nodes: [
      {
        id: 'node-one',
        name: 'nodeName',
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
              material: {id: 'material-0'}
            }
          ]
        }
      }
    ],
    images: [],
    cartographicOrigin: [8.676496951388435, 50.108416671362576, 189.47502169783516],
    cartesianModelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  };
  const result = prepareDataForAttributesConversion(
    // @ts-expect-error
    tileContent,
    new Matrix4(),
    new BoundingSphere([4051833.805439, 618316.801881, 4870677.172590001])
  );

  t.ok(result);
  // @ts-expect-error
  delete result.nodes[0].mesh.primitives[0].material.uniqueId;
  t.deepEqual(result.nodes, expectedResult.nodes);
  t.deepEqual(result.images, expectedResult.images);
  t.ok(areNumberArraysEqual(result.cartographicOrigin, expectedResult.cartographicOrigin));
  t.ok(areNumberArraysEqual(result.cartesianModelMatrix, expectedResult.cartesianModelMatrix));
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
            width: 2,
            height: 1,
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
    }
  };

  const expectedResult = {
    nodes: [
      {
        id: 'node-one',
        name: 'nodeName',
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
    images: [
      null,
      {
        width: 2,
        height: 1,
        components: 4,
        mimeType: 'image/jpeg',
        compressed: false,
        data: new Uint8Array([3, 3, 3, 255, 4, 4, 4, 255])
      }
    ],
    cartographicOrigin: [8.676496951388435, 50.108416671362576, 189.47502169783516],
    cartesianModelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  };

  const result = prepareDataForAttributesConversion(
    // @ts-expect-error
    tileContent,
    new Matrix4(),
    new BoundingSphere([4051833.805439, 618316.801881, 4870677.172590001])
  );

  t.ok(result);
  // @ts-expect-error
  delete result.nodes[0].mesh.primitives[0].material.uniqueId;
  t.deepEqual(result.nodes, expectedResult.nodes);
  t.deepEqual(result.images, expectedResult.images);
  t.ok(areNumberArraysEqual(result.cartographicOrigin, expectedResult.cartographicOrigin));
  t.ok(areNumberArraysEqual(result.cartesianModelMatrix, expectedResult.cartesianModelMatrix));
  t.end();
});

const EPSILON = 0.000000001;
function areNumberArraysEqual(array1, array2) {
  let result = true;
  if (array1.length !== array2.length) {
    return false;
  }
  for (let i = 0; i < array1.length; i++) {
    if (Math.abs(array1[i] - array2[i]) > EPSILON) {
      result = false;
      break;
    }
  }
  return result;
}
