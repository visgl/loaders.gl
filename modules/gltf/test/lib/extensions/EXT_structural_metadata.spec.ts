/* eslint-disable camelcase */
import test from 'tape-promise/tape';

import {decodeExtensions} from '../../../src/lib/api/gltf-extensions';

test('gltf#EXT_structural_metadata - Should decode', async (t) => {
  const binaryBufferData = [
    0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1, 33, 223, 70, 43, 39,
    58, 199, 113, 55, 81, 71, 94, 21, 60, 71, 154, 68, 219, 198, 113, 55, 81, 199, 183, 210, 225,
    198, 43, 39, 58, 71, 113, 55, 81, 199, 94, 21, 60, 199, 211, 158, 216, 70, 113, 55, 81, 71, 0,
    0, 0, 0, 0, 0, 0, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 0, 63,
    0, 1, 10, 0, 68, 82, 89, 71, 82, 79, 85, 78, 68, 0, 108, 60, 0, 95, 5, 0, 1, 3, 0, 0
  ];
  const GLTF_WITH_EXTENSION = {
    buffers: [
      {
        arrayBuffer: new Uint8Array(binaryBufferData).buffer,
        byteOffset: 0,
        byteLength: 128
      }
    ],
    json: {
      extensionsUsed: ['EXT_structural_metadata', 'EXT_mesh_features'],
      buffers: [{byteLength: 126}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 24, target: 34963},
        {buffer: 0, byteOffset: 24, byteLength: 48, target: 34962},
        {buffer: 0, byteOffset: 72, byteLength: 32, target: 34962},
        {buffer: 0, byteOffset: 104, byteLength: 3},
        {buffer: 0, byteOffset: 107, byteLength: 10},
        {buffer: 0, byteOffset: 117, byteLength: 3},
        {buffer: 0, byteOffset: 120, byteLength: 3},
        {buffer: 0, byteOffset: 123, byteLength: 3}
      ],
      extensions: {
        EXT_structural_metadata: {
          schema: {
            id: 'schema',
            classes: {
              CDBMaterialsClass: {
                properties: {
                  name: {type: 'STRING', required: true},
                  substrates: {
                    type: 'ENUM',
                    enumType: 'CDBBaseMaterial',
                    array: true,
                    required: true
                  },
                  weights: {type: 'SCALAR', componentType: 'UINT8', array: true, required: true}
                }
              }
            },
            enums: {
              CDBBaseMaterial: {
                valueType: 'UINT8',
                values: [
                  {name: 'BM_ASH', description: 'Ash (generic)', value: 0},
                  {name: 'BM_ASH-VOLCANIC', description: 'Volcanic Ash', value: 1},
                  {name: 'BM_ASPHALT', description: 'Asphalt', value: 2},
                  {name: 'BM_BOULDERS', description: 'Boulders', value: 79},
                  {name: 'BM_BRICK', description: 'Brick', value: 3},
                  {
                    name: 'BM_MOISTURE',
                    description: 'Embedded water in porous materials',
                    value: 60
                  },
                  {name: 'BM_SOIL', description: 'Generic soil', value: 108}
                ]
              }
            }
          },
          propertyTables: [
            {
              name: 'CDBMaterialFeatureTable',
              class: 'CDBMaterialsClass',
              count: 2,
              properties: {
                name: {
                  values: 4,
                  stringOffsets: 3,
                  stringOffsetType: 'UINT8'
                },
                substrates: {
                  values: 5,
                  arrayOffsets: 7,
                  arrayOffsetType: 'UINT8'
                },
                weights: {
                  values: 6,
                  arrayOffsets: 7,
                  arrayOffsetType: 'UINT8'
                }
              }
            }
          ]
        }
      }
    }
  };

  await decodeExtensions(GLTF_WITH_EXTENSION);

  const expectedJson = {
    extensionsUsed: ['EXT_structural_metadata', 'EXT_mesh_features'],
    buffers: [{byteLength: 126}],
    bufferViews: [
      {buffer: 0, byteOffset: 0, byteLength: 24, target: 34963},
      {buffer: 0, byteOffset: 24, byteLength: 48, target: 34962},
      {buffer: 0, byteOffset: 72, byteLength: 32, target: 34962},
      {buffer: 0, byteOffset: 104, byteLength: 3},
      {buffer: 0, byteOffset: 107, byteLength: 10},
      {buffer: 0, byteOffset: 117, byteLength: 3},
      {buffer: 0, byteOffset: 120, byteLength: 3},
      {buffer: 0, byteOffset: 123, byteLength: 3}
    ],
    extensions: {
      EXT_structural_metadata: {
        schema: {
          id: 'schema',
          classes: {
            CDBMaterialsClass: {
              properties: {
                name: {type: 'STRING', required: true},
                substrates: {
                  type: 'ENUM',
                  enumType: 'CDBBaseMaterial',
                  array: true,
                  required: true
                },
                weights: {type: 'SCALAR', componentType: 'UINT8', array: true, required: true}
              }
            }
          },
          enums: {
            CDBBaseMaterial: {
              valueType: 'UINT8',
              values: [
                {name: 'BM_ASH', description: 'Ash (generic)', value: 0},
                {name: 'BM_ASH-VOLCANIC', description: 'Volcanic Ash', value: 1},
                {name: 'BM_ASPHALT', description: 'Asphalt', value: 2},
                {name: 'BM_BOULDERS', description: 'Boulders', value: 79},
                {name: 'BM_BRICK', description: 'Brick', value: 3},
                {
                  name: 'BM_MOISTURE',
                  description: 'Embedded water in porous materials',
                  value: 60
                },
                {name: 'BM_SOIL', description: 'Generic soil', value: 108}
              ]
            }
          }
        },
        propertyTables: [
          {
            name: 'CDBMaterialFeatureTable',
            class: 'CDBMaterialsClass',
            count: 2,
            properties: {
              name: {
                values: 4,
                stringOffsets: 3,
                stringOffsetType: 'UINT8',
                data: ['\u0000', 'DRYGROUND']
              },
              substrates: {
                values: 5,
                arrayOffsets: 7,
                arrayOffsetType: 'UINT8',
                data: [['BM_ASH'], ['BM_SOIL', 'BM_MOISTURE']]
              },
              weights: {
                values: 6,
                arrayOffsets: 7,
                arrayOffsetType: 'UINT8',
                data: [new Uint8Array([0]), new Uint8Array([95, 5])]
              }
            }
          }
        ]
      }
    }
  };

  // Modifies input
  t.deepEqual(GLTF_WITH_EXTENSION.json, expectedJson);
  t.end();
});
