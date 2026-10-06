// SPDX-License-Identifier: MIT

import {expect, test} from 'vitest';
import type {GLTFWithBuffers} from '@loaders.gl/gltf';
import {
  get3DTiles2SubtreeBufferIndices,
  get3DTiles2SubtreeBufferViewIndices,
  parse3DTiles2Subtree,
  parse3DTiles2Tileset
} from '../src/lib/parsers/parse-3d-tiles-2-gltf';

/** Creates a decoded subtree with optional accessors or structural metadata. */
function createSubtree(
  extension: Record<string, unknown>,
  properties: Record<string, unknown> = {}
): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '2.1'},
      ...properties,
      extensions: {
        ...((properties.extensions || {}) as Record<string, unknown>),
        '3DTILES_subtree': {
          tileAvailability: {constant: 1},
          childSubtreeAvailability: {constant: 0},
          ...extension
        }
      }
    },
    buffers: []
  } as GLTFWithBuffers;
}

/** Creates two deliberately unaligned sparse views over five deterministic bytes. */
function createSparseSubtree(): GLTFWithBuffers {
  const source = createSubtree(
    {tileAttributes: {_CUSTOM: 0}},
    {
      accessors: [
        {
          componentType: 5123,
          type: 'SCALAR',
          count: 2,
          sparse: {count: 1, indices: {bufferView: 0, componentType: 5123}, values: {bufferView: 1}}
        }
      ],
      bufferViews: [
        {buffer: 0, byteOffset: 1, byteLength: 2},
        {buffer: 0, byteOffset: 3, byteLength: 2}
      ]
    }
  );
  const bytes = new Uint8Array(5);
  bytes[0] = 99;
  const view = new DataView(bytes.buffer);
  view.setUint16(1, 1, true);
  view.setUint16(3, 42, true);
  source.buffers = [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: 5}];
  return source;
}

test('sparse subtree data copies unaligned indices and values without modifying the source', () => {
  const source = createSparseSubtree();
  const original = structuredClone(source);
  const result = parse3DTiles2Subtree(source, '');
  expect(result.tileAttributes!._CUSTOM).toEqual(new Uint16Array([0, 42]));
  expect(source).toEqual(original);
});

test.each([
  [
    'missing indices view',
    (source: GLTFWithBuffers) => (source.json.accessors![0].sparse!.indices.bufferView = 8),
    'sparse indices references missing bufferView 8'
  ],
  [
    'missing values view',
    (source: GLTFWithBuffers) => (source.json.accessors![0].sparse!.values.bufferView = 8),
    'sparse values references missing bufferView 8'
  ],
  [
    'missing loaded buffer',
    (source: GLTFWithBuffers) => (source.buffers = []),
    'sparse indices references missing bufferView 0'
  ],
  [
    'short indices',
    (source: GLTFWithBuffers) => (source.json.bufferViews![0].byteLength = 1),
    'sparse indices exceeds bufferView 0'
  ],
  [
    'short values',
    (source: GLTFWithBuffers) => (source.json.bufferViews![1].byteLength = 1),
    'sparse values exceeds bufferView 1'
  ],
  [
    'out-of-range index',
    (source: GLTFWithBuffers) => new DataView(source.buffers[0].arrayBuffer).setUint16(1, 2, true),
    'sparse index is out of bounds'
  ]
] as const)('sparse subtree checks %s', (_name, mutate, message) => {
  const source = createSparseSubtree();
  mutate(source);
  expect(() => parse3DTiles2Subtree(source, '')).toThrow(message);
});

test('subtree dependency discovery ignores invalid references and includes sparse and metadata views', () => {
  const source = createSubtree(
    {
      tileAvailability: {bitstream: 0},
      contentAvailability: [{bitstream: 1}, {constant: 0}],
      tileAttributes: {_INVALID: '0', _MISSING: 99, _SPARSE: 0}
    },
    {
      accessors: [
        {
          componentType: 5121,
          type: 'SCALAR',
          count: 1,
          sparse: {
            count: 1,
            indices: {bufferView: 2, componentType: 5121},
            values: {bufferView: 3}
          }
        }
      ],
      bufferViews: [
        {buffer: 0, byteLength: 1, extensions: {KHR_meshopt_compression: {buffer: 4}}},
        {buffer: 1, byteLength: 1},
        {buffer: 1, byteLength: 1},
        {buffer: 2, byteLength: 1},
        {buffer: 3, byteLength: 1}
      ],
      extensions: {
        EXT_structural_metadata: {
          propertyTables: [
            {
              properties: {
                names: {values: 4, stringOffsets: 3, arrayOffsets: 2},
                invalid: {values: '4'}
              }
            },
            {}
          ]
        }
      }
    }
  );
  expect(get3DTiles2SubtreeBufferViewIndices(source.json)).toEqual([0, 1, 2, 3, 4]);
  expect(get3DTiles2SubtreeBufferIndices(source.json)).toEqual([0, 4, 1, 2, 3]);
});

test('metadata transforms use raw values, signed clamping, and per-component fallback factors', () => {
  const source = createSubtree(
    {tileProperties: 0, contentProperties: 1},
    {
      extensions: {
        EXT_structural_metadata: {
          schema: {
            classes: {
              tile: {
                properties: {
                  bounds: {
                    type: 'VEC2',
                    componentType: 'INT8',
                    normalized: true,
                    scale: [2],
                    offset: [1],
                    required: true
                  },
                  zone: {type: 'SCALAR', required: true, scale: 100, offset: 100},
                  label: {type: 'STRING', required: true},
                  missing: {type: 'SCALAR', default: 9},
                  unknownInteger: {type: 'SCALAR', componentType: 'FUTURE', normalized: true},
                  identifiers: {type: 'SCALAR', array: true}
                }
              },
              empty: {}
            }
          },
          propertyTables: [
            {
              class: 'tile',
              count: 2,
              properties: {
                bounds: {rawData: new Int8Array([127, -128, 0, 127]), data: [999, 999, 999, 999]},
                zone: {rawData: [2n, 3n], scale: 3, offset: 4},
                label: {data: ['north', 'south']},
                unknownInteger: {data: [5, 6]},
                identifiers: {data: [[1n, 2n], [3n]]}
              }
            },
            {class: 'empty', count: 1}
          ]
        }
      }
    }
  );
  const result = parse3DTiles2Subtree(source, '');
  expect(result.tilePropertyRows).toEqual([
    {
      bounds: [3, -1],
      zone: 10,
      label: 'north',
      missing: 9,
      unknownInteger: 5,
      identifiers: [1n, 2n]
    },
    {bounds: [1, 1], zone: 13, label: 'south', missing: 9, unknownInteger: 6, identifiers: [3n]}
  ]);
  expect(result.tileTemplatePropertyRows).toEqual([
    {zone: 10, label: 'north'},
    {zone: 13, label: 'south'}
  ]);
  expect(result.contentPropertyRows).toEqual([{}]);
});

test.each([
  [7n, 7, 'default'],
  [7n, '+7', 'default'],
  [7n, '7.0', 7n],
  [7n, 'invalid', 7n],
  [[1n, 2n], ['1', '2'], 'default'],
  [[1n, 2n], ['1'], [1n, 2n]],
  [
    [1n, 2n],
    ['1', '3'],
    [1n, 2n]
  ]
])('metadata noData compares source values exactly in row %#', (value, noData, expected) => {
  const source = createSubtree(
    {tileProperties: 0},
    {
      extensions: {
        EXT_structural_metadata: {
          schema: {
            classes: {
              tile: {
                properties: {
                  identifier: {
                    type: 'SCALAR',
                    array: Array.isArray(value),
                    noData,
                    default: 'default'
                  }
                }
              }
            }
          },
          propertyTables: [{class: 'tile', count: 1, properties: {identifier: {data: [value]}}}]
        }
      }
    }
  );
  expect(parse3DTiles2Subtree(source, '').tilePropertyRows).toEqual([{identifier: expected}]);
});

test('loaded URI package files retain their active byte range without resolving or copying', () => {
  const source = createSubtree(
    {},
    {files: [{uri: 'tile.glb', name: 'mesh', mimeType: 'model/gltf-binary'}]}
  );
  const buffer = {arrayBuffer: new Uint8Array([99, 1, 2, 88]).buffer, byteOffset: 1, byteLength: 2};
  source.files = [{...buffer, mimeType: 'model/gltf-binary'}];
  const files = parse3DTiles2Subtree(source, 'package/').resourceFiles!;
  expect(files).toEqual([
    {
      name: 'mesh',
      mimeType: 'model/gltf-binary',
      originalUri: 'tile.glb',
      data: buffer.arrayBuffer,
      byteOffset: 1,
      byteLength: 2
    }
  ]);
  expect(files[0].data).toBe(buffer.arrayBuffer);
});

/** Creates a root tile whose georeference is validated by the owning converter. */
function createGeoreferencedTileset(georeference: Record<string, unknown>): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '2.1'},
      scene: 0,
      scenes: [{nodes: [0]}],
      shapes: [{type: 'box', box: {size: [1, 1, 1]}}],
      extensions: {'3DTILES_tileset': {geometricError: 1}, EXT_geospatial_crs: {}},
      nodes: [
        {
          boundingVolume: {shape: 0},
          extensions: {
            '3DTILES_tileset': {geometricError: 0, refine: 'ADD'},
            EXT_georeference: georeference
          }
        }
      ]
    },
    buffers: []
  } as GLTFWithBuffers;
}

test.each([
  {longitude: '0', latitude: 0},
  {longitude: Infinity, latitude: 0},
  {longitude: -181, latitude: 0},
  {longitude: 181, latitude: 0},
  {longitude: 0, latitude: '0'},
  {longitude: 0, latitude: NaN},
  {longitude: 0, latitude: -91},
  {longitude: 0, latitude: 91},
  {longitude: 0, latitude: 0, height: '0'},
  {longitude: 0, latitude: 0, height: Infinity}
])('rejects invalid georeference components %j', georeference => {
  expect(() => parse3DTiles2Tileset(createGeoreferencedTileset(georeference), '')).toThrow(
    'invalid geographic coordinates'
  );
});

test('zero-height georeferencing uses the WGS84 surface and composes local placement', () => {
  const source = createGeoreferencedTileset({longitude: 0, latitude: 0});
  source.json.nodes![0].translation = [0, 2, 0];
  const root = parse3DTiles2Tileset(source, '').root;
  expect(root.transform!.slice(12, 15)).toEqual([6378139, 0, 0]);
});
