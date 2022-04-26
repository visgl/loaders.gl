import {prepareDataForAttributesConversion} from '../../../src/i3s-converter/helpers/gltf-attributes';
import test from 'tape-promise/tape';

test('gltf-attributes - Should generate attributes object from tileContent', async (t) => {
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
