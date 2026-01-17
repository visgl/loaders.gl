/* eslint-disable camelcase */
import test from 'tape-promise/tape';
import {decodeExtensions, encodeExtensions} from '../../../src/lib/api/gltf-extensions';
import {
  GLTFScenegraph,
  createExtStructuralMetadata,
  type PropertyAttribute,
  GLTF_EXT_structural_metadata_GLTF
} from '@loaders.gl/gltf';

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

  const options = {gltf: {loadImages: true, loadBuffers: true}};
  await decodeExtensions(GLTF_WITH_EXTENSION, options);

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

const ATTRIBUTES: PropertyAttribute[] = [
  {
    name: 'OBJECTID',
    elementType: 'SCALAR',
    componentType: 'UINT32',
    values: [1060555, 1059993, 1058835, 1077325]
  },
  {
    name: 'BIN',
    elementType: 'SCALAR',
    componentType: 'INT32',
    values: [3197233, 3197234, 3197231, 3197232]
  },
  {
    name: 'LSTMODDATE',
    elementType: 'STRING',
    values: ['2/14/2009', '2/14/2009', '2/14/2009', '2/14/2009']
  },
  {
    name: 'HEIGHTROOF',
    elementType: 'SCALAR',
    componentType: 'FLOAT64',
    values: [31.46, 31.49, 31.49, 31.49]
  }
];

const EXPECTED_GLTF_JSON_WITH_EXTENSION = {
  asset: {
    version: '2.0',
    generator: 'loaders.gl'
  },
  buffers: [{byteLength: 120}],
  extensions: {
    EXT_structural_metadata: {
      schema: {
        id: 'schema_id',
        classes: {
          schemaClassId: {
            properties: {
              OBJECTID: {
                type: 'SCALAR',
                componentType: 'UINT32'
              },
              BIN: {
                type: 'SCALAR',
                componentType: 'INT32'
              },
              LSTMODDATE: {
                type: 'STRING'
              },
              HEIGHTROOF: {
                type: 'SCALAR',
                componentType: 'FLOAT64'
              }
            }
          }
        }
      },
      propertyTables: [
        {
          class: 'schemaClassId',
          count: 4,
          properties: {
            OBJECTID: {
              values: 0
            },
            BIN: {
              values: 1
            },
            LSTMODDATE: {
              values: 3,
              stringOffsets: 2
            },
            HEIGHTROOF: {
              values: 4
            }
          }
        }
      ]
    }
  },
  extensionsRequired: [],
  extensionsUsed: ['EXT_structural_metadata'],
  bufferViews: [
    {buffer: 0, byteOffset: 0, byteLength: 16},
    {buffer: 0, byteOffset: 16, byteLength: 16},
    {buffer: 0, byteOffset: 32, byteLength: 20},
    {buffer: 0, byteOffset: 52, byteLength: 36},
    {buffer: 0, byteOffset: 88, byteLength: 32}
  ]
};

test('gltf#EXT_structural_metadata - Should encode', async (t) => {
  const scenegraph = new GLTFScenegraph();
  const tableIndex = createExtStructuralMetadata(scenegraph, ATTRIBUTES);
  const gltfBin = encodeExtensions(scenegraph.gltf, {});
  const scenegraph1 = new GLTFScenegraph(gltfBin);
  scenegraph1.createBinaryChunk();

  t.equal(tableIndex, 0);
  t.equal(scenegraph1.gltf.buffers[0].byteLength, 120);

  t.deepEqual(
    JSON.stringify(scenegraph1.gltf.json),
    JSON.stringify(EXPECTED_GLTF_JSON_WITH_EXTENSION)
  );
  t.end();
});

test('gltf#EXT_structural_metadata - Roundtrip encoding/decoding', async (t) => {
  const scenegraph = new GLTFScenegraph();
  createExtStructuralMetadata(scenegraph, ATTRIBUTES);
  const gltfBin = encodeExtensions(scenegraph.gltf, {});

  const scenegraph1 = new GLTFScenegraph(gltfBin);
  scenegraph1.createBinaryChunk();

  const options = {gltf: {loadImages: true, loadBuffers: true}};
  await decodeExtensions(scenegraph1.gltf, options);

  const scenegraph2 = new GLTFScenegraph(scenegraph1.gltf);
  scenegraph2.createBinaryChunk();

  for (const attr of ATTRIBUTES) {
    const name = attr.name;
    const ext = scenegraph2.gltf.json.extensions
      ?.EXT_structural_metadata as GLTF_EXT_structural_metadata_GLTF;
    const data = ext.propertyTables?.[0].properties?.[name].data;
    if (ext.schema?.classes?.schemaClassId.properties[name].type === 'STRING') {
      t.deepEqual(JSON.stringify(data), JSON.stringify(attr.values));
    } else {
      const dataArray: number[] = [...(data as any)];
      t.deepEqual(JSON.stringify(dataArray), JSON.stringify(attr.values));
    }
  }
  t.end();
});

test('gltf#EXT_structural_metadata - Should decode variable-length string arrays', async (t) => {
  // 2 features with variable-length string arrays
  // Feature 0: ["hello", "world"] (2 strings)
  // Feature 1: ["foo"] (1 string)
  //
  // Binary layout:
  // - values: "helloworldfoo" (13 bytes)
  // - stringOffsets (UINT8): [0, 5, 10, 13] (4 bytes)
  // - arrayOffsets (UINT8): [0, 2, 3] (3 bytes)

  const binaryBufferData = [
    // values: "helloworldfoo" (offset 0, length 13)
    104,
    101,
    108,
    108,
    111, // "hello"
    119,
    111,
    114,
    108,
    100, // "world"
    102,
    111,
    111, // "foo"
    // stringOffsets (offset 13, length 4): [0, 5, 10, 13]
    0,
    5,
    10,
    13,
    // arrayOffsets (offset 17, length 3): [0, 2, 3]
    0,
    2,
    3
  ];

  const GLTF_WITH_STRING_ARRAY = {
    buffers: [
      {
        arrayBuffer: new Uint8Array(binaryBufferData).buffer,
        byteOffset: 0,
        byteLength: 20
      }
    ],
    json: {
      extensionsUsed: ['EXT_structural_metadata'],
      buffers: [{byteLength: 20}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 13}, // values
        {buffer: 0, byteOffset: 13, byteLength: 4}, // stringOffsets
        {buffer: 0, byteOffset: 17, byteLength: 3} // arrayOffsets
      ],
      extensions: {
        EXT_structural_metadata: {
          schema: {
            id: 'schema',
            classes: {
              TestClass: {
                properties: {
                  tags: {
                    type: 'STRING',
                    array: true
                    // no "count" means variable-length
                  }
                }
              }
            }
          },
          propertyTables: [
            {
              name: 'TestTable',
              class: 'TestClass',
              count: 2,
              properties: {
                tags: {
                  values: 0,
                  stringOffsets: 1,
                  stringOffsetType: 'UINT8',
                  arrayOffsets: 2,
                  arrayOffsetType: 'UINT8'
                }
              }
            }
          ]
        }
      }
    }
  };

  const options = {gltf: {loadImages: true, loadBuffers: true}};
  await decodeExtensions(GLTF_WITH_STRING_ARRAY, options);

  const ext = GLTF_WITH_STRING_ARRAY.json.extensions
    .EXT_structural_metadata as GLTF_EXT_structural_metadata_GLTF;
  const tagsData = ext.propertyTables?.[0].properties?.tags.data;

  // Verify variable-length string arrays are correctly decoded
  t.deepEqual(
    tagsData,
    [['hello', 'world'], ['foo']],
    'Variable-length string arrays decoded correctly'
  );
  t.end();
});
