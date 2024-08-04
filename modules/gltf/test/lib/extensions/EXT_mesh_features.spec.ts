/* eslint-disable camelcase */
import test from 'tape-promise/tape';

import {decodeExtensions, encodeExtensions} from '../../../src/lib/api/gltf-extensions';
import {GLTFScenegraph, createExtMeshFeatures, type GLTF} from '@loaders.gl/gltf';
import {
  encodeExtMeshFeatures,
  decodeExtMeshFeatures
} from '../../../src/lib/extensions/EXT_mesh_features';

const binaryBufferData = [
  0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1, 33, 223, 70, 43, 39,
  58, 199, 113, 55, 81, 71, 94, 21, 60, 71, 154, 68, 219, 198, 113, 55, 81, 199, 183, 210, 225, 198,
  43, 39, 58, 71, 113, 55, 81, 199, 94, 21, 60, 199, 211, 158, 216, 70, 113, 55, 81, 71, 0, 0, 0, 0,
  0, 0, 0, 63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 0, 0, 0, 0, 0, 63, 0, 0, 0, 63, 0, 1, 10,
  0, 68, 82, 89, 71, 82, 79, 85, 78, 68, 0, 108, 60, 0, 95, 5, 0, 1, 3, 0, 0,
  // the following is to allign the buffer:
  0, 0
];

const GLTF_WITH_EXTENSION = {
  buffers: [
    {
      //      arrayBuffer: new Uint8Array(binaryBufferData).buffer,
      arrayBuffer: [],
      byteOffset: 0,
      byteLength: 128
    }
  ],
  images: [
    {
      shape: [1, 1, 4],
      data: {
        '0': 111,
        '1': 103,
        '2': 88,
        '3': 255
      },
      width: 1,
      height: 1,
      components: 4,
      layers: [1]
    },
    {
      shape: [1, 1, 4],
      data: {
        '0': 1,
        '1': 1,
        '2': 1,
        '3': 255
      },
      width: 1,
      height: 1,
      components: 4,
      layers: [1]
    }
  ],
  json: {
    buffers: [
      {
        byteLength: 126
      }
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: 24,
        target: 34963
      },
      {
        buffer: 0,
        byteOffset: 24,
        byteLength: 48,
        target: 34962
      },
      {
        buffer: 0,
        byteOffset: 72,
        byteLength: 32,
        target: 34962
      },
      {
        buffer: 0,
        byteOffset: 104,
        byteLength: 3
      },
      {
        buffer: 0,
        byteOffset: 107,
        byteLength: 10
      },
      {
        buffer: 0,
        byteOffset: 117,
        byteLength: 3
      },
      {
        buffer: 0,
        byteOffset: 120,
        byteLength: 3
      },
      {
        buffer: 0,
        byteOffset: 123,
        byteLength: 3
      }
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5125,
        count: 6,
        type: 'SCALAR'
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
        count: 4,
        type: 'VEC3',
        max: [48149.36831235699, 47655.16766258143, 53559.4425966118],
        min: [-48149.36831235606, -47655.16766258143, -53559.4425966118]
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: 5126,
        count: 4,
        type: 'VEC2'
      }
    ],
    extensions: {},
    extensionsUsed: ['EXT_mesh_features'],
    meshes: [
      {
        primitives: [
          {
            attributes: {
              TEXCOORD_0: 2,
              POSITION: 1
            },
            indices: 0,
            material: 0,
            extensions: {
              EXT_mesh_features: {
                featureIds: [
                  {
                    featureCount: 1,
                    texture: {
                      index: 1
                    },
                    propertyTable: 0,
                    data: undefined
                  }
                ]
              }
            }
          }
        ]
      }
    ],
    textures: [
      {
        sampler: 0,
        source: 0
      },
      {
        sampler: 1,
        source: 1
      }
    ]
  }
};

test('gltf#EXT_mesh_features - Should decode', async (t) => {
  const options = {gltf: {loadImages: true, loadBuffers: true}};
  const gltf = JSON.parse(JSON.stringify(GLTF_WITH_EXTENSION));
  gltf.buffers[0].arrayBuffer = new Uint8Array(binaryBufferData).buffer;
  await decodeExtensions(gltf, options);
  // The clone of GLTF_WITH_EXTENSION has been modified

  t.deepEqual(
    gltf.json.meshes[0].primitives[0].extensions.EXT_mesh_features.featureIds[0].data,
    [1, 1, 1, 1]
  );
  t.end();
});

const PRIMITIVE_EXPECTED = {
  attributes: {TEXCOORD_0: 2, POSITION: 1, _FEATURE_ID_0: 3},
  indices: 0,
  material: 0,
  extensions: {
    EXT_mesh_features: {
      featureIds: [
        {
          featureCount: 1,
          texture: {
            index: 1
          },
          propertyTable: 0
        },
        {
          featureCount: 7,
          propertyTable: 8,
          attribute: 0
        }
      ]
    }
  }
};

const PRIMITIVE_DECODED_EXPECTED = {
  attributes: {TEXCOORD_0: 2, POSITION: 1, _FEATURE_ID_0: 3},
  indices: 0,
  material: 0,
  extensions: {
    EXT_mesh_features: {
      featureIds: [
        {
          featureCount: 1,
          texture: {
            index: 1
          },
          propertyTable: 0,
          data: [1, 1, 1, 1]
        },
        {
          featureCount: 7,
          propertyTable: 8,
          data: {
            '0': 4,
            '1': 4,
            '2': 4,
            '3': 3,
            '4': 0,
            '5': 1,
            '6': 2
          },
          attribute: 0
        }
      ]
    }
  }
};

test('gltf#EXT_mesh_features - Should encode featureIDs', (t) => {
  const gltf = JSON.parse(JSON.stringify(GLTF_WITH_EXTENSION));
  gltf.buffers[0].arrayBuffer = new Uint8Array(binaryBufferData).buffer;

  const scenegraph = new GLTFScenegraph(gltf as unknown as {json: GLTF});
  const primitive = gltf.json.meshes[0].primitives[0];
  const featureIds = [4, 4, 4, 3, 0, 1, 2];
  const typedArray = new Uint32Array(featureIds);
  const tableIndex = 8;

  createExtMeshFeatures(scenegraph, primitive, typedArray, tableIndex);
  encodeExtensions(scenegraph.gltf, {});

  // The clone of GLTF_WITH_EXTENSION has been modified
  t.deepEqual(JSON.stringify(primitive), JSON.stringify(PRIMITIVE_EXPECTED));
  t.end();
});

test('gltf#EXT_mesh_features - Roundtrip encode/decode featureIDs', (t) => {
  const gltf = JSON.parse(JSON.stringify(GLTF_WITH_EXTENSION));
  gltf.buffers[0].arrayBuffer = new Uint8Array(binaryBufferData).buffer;

  const scenegraph = new GLTFScenegraph(gltf as unknown as {json: GLTF});
  const primitive = gltf.json.meshes[0].primitives[0];
  const featureIds = [4, 4, 4, 3, 0, 1, 2];
  const typedArray = new Uint32Array(featureIds);
  const tableIndex = 8;

  createExtMeshFeatures(scenegraph, primitive, typedArray, tableIndex);
  encodeExtMeshFeatures(scenegraph, {});

  // The clone of GLTF_WITH_EXTENSION has been modified
  t.deepEqual(JSON.stringify(primitive), JSON.stringify(PRIMITIVE_EXPECTED));

  const options = {gltf: {loadImages: true, loadBuffers: true}};
  decodeExtMeshFeatures(scenegraph, options);

  t.deepEqual(JSON.stringify(primitive), JSON.stringify(PRIMITIVE_DECODED_EXPECTED));

  t.end();
});
