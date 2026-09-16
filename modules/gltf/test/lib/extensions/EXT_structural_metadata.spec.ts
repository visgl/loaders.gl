// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decodeExtensions, encodeExtensions} from '../../../src/lib/api/gltf-extensions';
import {
  GLTFScenegraph,
  createExtStructuralMetadata,
  type PropertyAttribute,
  GLTF_EXT_structural_metadata_GLTF
} from '@loaders.gl/gltf';
import {getOffsetsForProperty} from '../../../src/lib/extensions/utils/3d-tiles-utils';
test('gltf#EXT_structural_metadata - Should decode', async () => {
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
  expect(GLTF_WITH_EXTENSION.json).toEqual(expectedJson);
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
test('gltf#EXT_structural_metadata - Should encode', async () => {
  const scenegraph = new GLTFScenegraph();
  const tableIndex = createExtStructuralMetadata(scenegraph, ATTRIBUTES);
  const gltfBin = encodeExtensions(scenegraph.gltf, {});
  const scenegraph1 = new GLTFScenegraph(gltfBin);
  scenegraph1.createBinaryChunk();
  expect(tableIndex).toBe(0);
  expect(scenegraph1.gltf.buffers[0].byteLength).toBe(120);
  expect(JSON.stringify(scenegraph1.gltf.json)).toEqual(
    JSON.stringify(EXPECTED_GLTF_JSON_WITH_EXTENSION)
  );
});
test('gltf#EXT_structural_metadata - Roundtrip encoding/decoding', async () => {
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
      expect(JSON.stringify(data)).toEqual(JSON.stringify(attr.values));
    } else {
      const dataArray: number[] = [...(data as any)];
      expect(JSON.stringify(dataArray)).toEqual(JSON.stringify(attr.values));
    }
  }
});
test('gltf#EXT_structural_metadata - Should decode variable-length string arrays', async () => {
  // 3 features with variable-length string arrays
  // Feature 0: ["hello", "world"] (2 strings)
  // Feature 1: [] (0 strings)
  // Feature 2: ["foo", "bar"] (2 strings)
  //
  // Binary layout:
  // - values: "helloworldfoobar" (16 bytes)
  // - stringOffsets (UINT8): [0, 5, 10, 13, 16] (5 bytes)
  // - arrayOffsets (UINT8): [0, 2, 2, 4] (4 bytes)
  const binaryBufferData = [
    // values: "helloworldfoobar" (offset 0, length 16)
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
    98,
    97,
    114, // "bar"
    // stringOffsets (offset 16, length 5): [0, 5, 10, 13, 16]
    0,
    5,
    10,
    13,
    16,
    // arrayOffsets (offset 21, length 4): [0, 2, 2, 4]
    0,
    2,
    2,
    4
  ];
  const GLTF_WITH_STRING_ARRAY = {
    buffers: [
      {
        arrayBuffer: new Uint8Array(binaryBufferData).buffer,
        byteOffset: 0,
        byteLength: 25
      }
    ],
    json: {
      extensionsUsed: ['EXT_structural_metadata'],
      buffers: [{byteLength: 25}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 16}, // values
        {buffer: 0, byteOffset: 16, byteLength: 5}, // stringOffsets
        {buffer: 0, byteOffset: 21, byteLength: 4} // arrayOffsets
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
              count: 3,
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
  expect(tagsData, 'Variable-length string arrays decoded correctly').toEqual([
    ['hello', 'world'],
    [],
    ['foo', 'bar']
  ]);
});

test('gltf#EXT_structural_metadata decodes fixed numeric and enum property variants', async () => {
  const bytes = new Uint8Array([1, 2, 3, 4, 0, 0, 1, 0, 9, 0, 1, 0]);
  const gltf = {
    buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}],
    json: {
      buffers: [{byteLength: bytes.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 4},
        {buffer: 0, byteOffset: 4, byteLength: 4},
        {buffer: 0, byteOffset: 8, byteLength: 2},
        {buffer: 0, byteOffset: 10, byteLength: 2}
      ],
      extensions: {
        EXT_structural_metadata: {
          schema: {
            classes: {
              Sample: {
                properties: {
                  fixed: {type: 'SCALAR', componentType: 'UINT8', array: true, count: 2},
                  raw: {type: 'SCALAR'},
                  fixedEnum: {type: 'ENUM', enumType: 'Kind', array: true, count: 1},
                  emptyArray: {type: 'SCALAR', componentType: 'UINT8', array: true}
                }
              },
              Unused: {properties: {value: {type: 'SCALAR', componentType: 'UINT8'}}}
            },
            enums: {
              Kind: {values: [{name: 'known', value: 1}]}
            }
          },
          propertyTables: [
            {
              class: 'Sample',
              count: 2,
              properties: {
                fixed: {values: 0},
                raw: {values: 1},
                fixedEnum: {values: 2},
                emptyArray: {values: 3}
              }
            }
          ]
        }
      }
    }
  } as any;

  await decodeExtensions(gltf, {gltf: {loadBuffers: true, loadImages: false}});
  const properties = gltf.json.extensions.EXT_structural_metadata.propertyTables[0].properties;
  expect(properties.fixed.data.map(value => Array.from(value))).toEqual([
    [1, 2],
    [3, 4]
  ]);
  expect(Array.from(properties.raw.data)).toEqual([0, 0, 1, 0]);
  expect(properties.fixedEnum.data).toEqual([[''], ['']]);
  expect(properties.emptyArray.data).toEqual([]);
});

test('gltf#EXT_structural_metadata decodes signed and unsigned 64-bit enums', async () => {
  const bytes = new Uint8Array(32);
  const dataView = new DataView(bytes.buffer);
  dataView.setBigInt64(0, -1n, true);
  dataView.setBigInt64(8, 5n, true);
  dataView.setBigUint64(16, 1n, true);
  dataView.setBigUint64(24, 5n, true);
  const gltf = {
    buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}],
    json: {
      buffers: [{byteLength: bytes.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 16},
        {buffer: 0, byteOffset: 16, byteLength: 16}
      ],
      extensions: {
        EXT_structural_metadata: {
          schema: {
            classes: {
              Sample: {
                properties: {
                  signed: {type: 'ENUM', enumType: 'SignedKind'},
                  unsigned: {type: 'ENUM', enumType: 'UnsignedKind'}
                }
              }
            },
            enums: {
              SignedKind: {
                valueType: 'INT64',
                values: [
                  {name: 'negative', value: -1},
                  {name: 'five', value: 5}
                ]
              },
              UnsignedKind: {
                valueType: 'UINT64',
                values: [
                  {name: 'one', value: 1},
                  {name: 'five', value: 5}
                ]
              }
            }
          },
          propertyTables: [
            {
              class: 'Sample',
              count: 2,
              properties: {signed: {values: 0}, unsigned: {values: 1}}
            }
          ]
        }
      }
    }
  } as any;

  await decodeExtensions(gltf, {gltf: {loadBuffers: true, loadImages: false}});
  const properties = gltf.json.extensions.EXT_structural_metadata.propertyTables[0].properties;
  expect(properties.signed.data).toEqual(['negative', 'five']);
  expect(properties.unsigned.data).toEqual(['one', 'five']);
});

test('gltf#EXT_structural_metadata loads an external schema before decoding tables', async () => {
  const bytes = new Uint8Array([7, 9]);
  const gltf = {
    buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}],
    json: {
      buffers: [{byteLength: bytes.byteLength}],
      bufferViews: [{buffer: 0, byteOffset: 0, byteLength: bytes.byteLength}],
      extensions: {
        EXT_structural_metadata: {
          schemaUri: 'metadata/schema.json',
          propertyTables: [{class: 'Sample', count: 2, properties: {value: {values: 0}}}]
        }
      }
    }
  } as any;
  const requestedUrls: string[] = [];

  await decodeExtensions(gltf, {gltf: {loadBuffers: true, loadImages: false}}, {
    baseUrl: 'https://example.com/models/',
    fetch: async (url: string) => {
      requestedUrls.push(url);
      return new Response(
        JSON.stringify({
          id: 'external-schema',
          classes: {
            Sample: {
              properties: {
                value: {type: 'SCALAR', componentType: 'UINT8', required: true}
              }
            }
          }
        })
      );
    }
  } as any);

  expect(requestedUrls).toEqual(['https://example.com/models/metadata/schema.json']);
  const extension = gltf.json.extensions.EXT_structural_metadata;
  expect(extension.schema.id).toBe('external-schema');
  expect(Array.from(extension.propertyTables[0].properties.value.data)).toEqual([7, 9]);
});

test('gltf#EXT_structural_metadata decodes packed Boolean properties and arrays', async () => {
  const binary = new Uint8Array([0b00000101, 0b00110101, 0b00001101, 0, 1, 4]);
  const gltf = {
    buffers: [{arrayBuffer: binary.buffer, byteOffset: 0, byteLength: binary.byteLength}],
    json: {
      buffers: [{byteLength: binary.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 1},
        {buffer: 0, byteOffset: 1, byteLength: 1},
        {buffer: 0, byteOffset: 2, byteLength: 1},
        {buffer: 0, byteOffset: 3, byteLength: 3}
      ],
      extensions: {
        EXT_structural_metadata: {
          schema: {
            classes: {
              Scalars: {properties: {value: {type: 'BOOLEAN', required: true}}},
              Fixed: {
                properties: {value: {type: 'BOOLEAN', array: true, count: 3, required: true}}
              },
              Variable: {
                properties: {value: {type: 'BOOLEAN', array: true, required: true}}
              }
            }
          },
          propertyTables: [
            {class: 'Scalars', count: 3, properties: {value: {values: 0}}},
            {class: 'Fixed', count: 2, properties: {value: {values: 1}}},
            {
              class: 'Variable',
              count: 2,
              properties: {value: {values: 2, arrayOffsets: 3, arrayOffsetType: 'UINT8'}}
            }
          ]
        }
      }
    }
  };

  await decodeExtensions(gltf as any, {gltf: {loadBuffers: true, loadImages: false}});

  const tables = gltf.json.extensions.EXT_structural_metadata.propertyTables;
  expect(tables[0].properties.value.data).toEqual([true, false, true]);
  expect(tables[1].properties.value.data).toEqual([
    [true, false, true],
    [false, true, true]
  ]);
  expect(tables[2].properties.value.data).toEqual([[true], [false, true, true]]);
});

test('gltf#EXT_structural_metadata treats array offsets as elements and groups fixed strings', async () => {
  const binary = new Uint8Array(35);
  new Uint16Array(binary.buffer, 0, 6).set([1, 2, 3, 4, 5, 6]);
  binary.set([0, 2, 3], 12);
  binary.set(new TextEncoder().encode('abbcdd'), 15);
  binary.set([0, 1, 3, 4, 6], 21);
  new Uint16Array(binary.buffer, 26, 3).set([10, 20, 30]);
  binary.set([0, 2, 3], 32);
  const gltf = {
    buffers: [{arrayBuffer: binary.buffer, byteOffset: 0, byteLength: binary.byteLength}],
    json: {
      buffers: [{byteLength: binary.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 12},
        {buffer: 0, byteOffset: 12, byteLength: 3},
        {buffer: 0, byteOffset: 15, byteLength: 6},
        {buffer: 0, byteOffset: 21, byteLength: 5},
        {buffer: 0, byteOffset: 26, byteLength: 6},
        {buffer: 0, byteOffset: 32, byteLength: 3}
      ],
      extensions: {
        EXT_structural_metadata: {
          schema: {
            classes: {
              Numeric: {
                properties: {
                  value: {
                    type: 'VEC2',
                    componentType: 'UINT16',
                    array: true,
                    required: true
                  }
                }
              },
              Strings: {
                properties: {
                  value: {type: 'STRING', array: true, count: 2, required: true}
                }
              },
              Enums: {
                properties: {
                  value: {type: 'ENUM', enumType: 'Kind', array: true, required: true}
                }
              }
            },
            enums: {
              Kind: {
                valueType: 'UINT16',
                values: [
                  {name: 'first', value: 10},
                  {name: 'second', value: 20},
                  {name: 'third', value: 30}
                ]
              }
            }
          },
          propertyTables: [
            {
              class: 'Numeric',
              count: 2,
              properties: {value: {values: 0, arrayOffsets: 1, arrayOffsetType: 'UINT8'}}
            },
            {
              class: 'Strings',
              count: 2,
              properties: {value: {values: 2, stringOffsets: 3, stringOffsetType: 'UINT8'}}
            },
            {
              class: 'Enums',
              count: 2,
              properties: {value: {values: 4, arrayOffsets: 5, arrayOffsetType: 'UINT8'}}
            }
          ]
        }
      }
    }
  };

  await decodeExtensions(gltf as any, {gltf: {loadBuffers: true, loadImages: false}});

  const tables = gltf.json.extensions.EXT_structural_metadata.propertyTables;
  expect(tables[0].properties.value.data).toEqual([
    new Uint16Array([1, 2, 3, 4]),
    new Uint16Array([5, 6])
  ]);
  expect(tables[1].properties.value.data).toEqual([
    ['a', 'bb'],
    ['c', 'dd']
  ]);
  expect(tables[2].properties.value.data).toEqual([['first', 'second'], ['third']]);
});

test('gltf#EXT_structural_metadata converts safe UINT64 offsets and rejects lossy values', () => {
  const offsets = new BigUint64Array([0n, 2n, 3n]);
  const gltf = {
    buffers: [{arrayBuffer: offsets.buffer, byteOffset: 0, byteLength: offsets.byteLength}],
    json: {
      buffers: [{byteLength: offsets.byteLength}],
      bufferViews: [{buffer: 0, byteOffset: 0, byteLength: offsets.byteLength}]
    }
  };
  const scenegraph = new GLTFScenegraph(gltf as any);

  expect(getOffsetsForProperty(scenegraph, 0, 'UINT64', 2)).toEqual(new Float64Array([0, 2, 3]));

  offsets[2] = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
  expect(() => getOffsetsForProperty(scenegraph, 0, 'UINT64', 2)).toThrow(
    /UINT64 offset exceeds the safe integer range/
  );
});

test('gltf#EXT_structural_metadata applies normalized scale and offset transforms', async () => {
  const bytes = new Uint8Array([0, 255]);
  const gltf = {
    buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}],
    json: {
      buffers: [{byteLength: bytes.byteLength}],
      bufferViews: [{buffer: 0, byteOffset: 0, byteLength: bytes.byteLength}],
      extensions: {
        EXT_structural_metadata: {
          schema: {
            classes: {
              Sample: {
                properties: {
                  value: {
                    type: 'SCALAR',
                    componentType: 'UINT8',
                    normalized: true,
                    offset: 10,
                    scale: 2
                  }
                }
              }
            }
          },
          propertyTables: [{class: 'Sample', count: 2, properties: {value: {values: 0}}}]
        }
      }
    }
  } as any;

  await decodeExtensions(gltf, {gltf: {loadBuffers: true, loadImages: false}});

  const values = gltf.json.extensions.EXT_structural_metadata.propertyTables[0].properties.value
    .data;
  expect(Array.from(values)).toEqual([10, 12]);
});

test('gltf#EXT_structural_metadata validates unsupported property definitions', async () => {
  const makeGLTF = (property: any, schema: any = {}) => ({
    buffers: [{arrayBuffer: new Uint8Array([1, 0]).buffer, byteOffset: 0, byteLength: 2}],
    json: {
      buffers: [{byteLength: 2}],
      bufferViews: [{buffer: 0, byteOffset: 0, byteLength: 2}],
      extensions: {
        EXT_structural_metadata: {
          schema: {
            classes: {Sample: {properties: {value: property}}},
            ...schema
          },
          propertyTables: [{class: 'Sample', count: 1, properties: {value: {values: 0}}}]
        }
      }
    }
  });

  await expect(
    decodeExtensions(makeGLTF({type: 'FUTURE'}) as any, {
      gltf: {loadBuffers: true, loadImages: false}
    })
  ).rejects.toThrow(/Unknown classProperty type/);
  await expect(
    decodeExtensions(makeGLTF({type: 'ENUM'}) as any, {
      gltf: {loadBuffers: true, loadImages: false}
    })
  ).rejects.toThrow(/enumType is not set/);
  await expect(
    decodeExtensions(makeGLTF({type: 'ENUM', enumType: 'Missing'}) as any, {
      gltf: {loadBuffers: true, loadImages: false}
    })
  ).rejects.toThrow(/does't contain Missing/);

  const noSchema = makeGLTF({type: 'SCALAR'});
  delete (noSchema.json.extensions.EXT_structural_metadata as any).schema;
  await expect(
    decodeExtensions(noSchema as any, {gltf: {loadBuffers: true, loadImages: false}})
  ).resolves.toBeUndefined();
  await expect(
    decodeExtensions({buffers: [], json: {}} as any, {
      gltf: {loadBuffers: true, loadImages: false}
    })
  ).resolves.toBeUndefined();
});

test('gltf#EXT_structural_metadata decodes every table that shares a class', async () => {
  const gltf = {
    buffers: [{arrayBuffer: new Uint8Array([7, 9]).buffer, byteOffset: 0, byteLength: 2}],
    json: {
      buffers: [{byteLength: 2}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 1},
        {buffer: 0, byteOffset: 1, byteLength: 1}
      ],
      extensions: {
        EXT_structural_metadata: {
          schema: {
            classes: {
              Sample: {
                properties: {
                  value: {type: 'SCALAR', componentType: 'UINT8', required: true}
                }
              }
            }
          },
          propertyTables: [
            {class: 'Sample', count: 1, properties: {value: {values: 0}}},
            {class: 'Sample', count: 1, properties: {value: {values: 1}}}
          ]
        }
      }
    }
  } as any;

  await decodeExtensions(gltf, {gltf: {loadBuffers: true, loadImages: false}});

  const propertyTables = gltf.json.extensions.EXT_structural_metadata.propertyTables;
  expect(Array.from(propertyTables[0].properties.value.data)).toEqual([7]);
  expect(Array.from(propertyTables[1].properties.value.data)).toEqual([9]);
});

test('gltf#EXT_structural_metadata validates encoder attribute consistency', () => {
  const scenegraph = new GLTFScenegraph();
  expect(() =>
    createExtStructuralMetadata(scenegraph, [
      {name: 'first', elementType: 'SCALAR', componentType: 'UINT8', values: [1, 2]},
      {name: 'second', elementType: 'SCALAR', componentType: 'UINT8', values: [1]}
    ])
  ).toThrow('Illegal values in attributes');

  const invalidComponentScenegraph = new GLTFScenegraph();
  createExtStructuralMetadata(invalidComponentScenegraph, [
    {name: 'value', elementType: 'SCALAR', componentType: 'FUTURE', values: [1]}
  ]);
  expect(() => encodeExtensions(invalidComponentScenegraph.gltf, {})).toThrow(
    'Illegal component type'
  );
});
