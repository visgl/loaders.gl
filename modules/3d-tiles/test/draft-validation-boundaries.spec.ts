// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {parse3DTiles2Subtree} from '../src/lib/parsers/parse-3d-tiles-2-gltf';

/** Creates one draft tileset root with valid implicit-tiling metadata. */
function createImplicitTileset(
  overrides: Record<string, unknown> = {},
  nodeOverrides: Record<string, unknown> = {}
) {
  return {
    asset: {version: '2.1'},
    extensionsUsed: ['3DTILES_tileset', '3DTILES_implicit_tiling'],
    extensionsRequired: ['3DTILES_tileset', '3DTILES_implicit_tiling'],
    extensions: {'3DTILES_tileset': {geometricError: 16}},
    scenes: [{nodes: [0]}],
    scene: 0,
    shapes: [{type: 'box', box: {size: [1, 1, 1]}}],
    nodes: [
      {
        boundingVolume: {shape: 0},
        ...nodeOverrides,
        extensions: {
          '3DTILES_tileset': {geometricError: 16, refine: 'REPLACE'},
          '3DTILES_implicit_tiling': {
            contentUri: 'tiles/{level}/{x}/{y}.glb',
            subtreeUri: 'subtrees/{level}/{x}/{y}.gltf',
            subdivisionScheme: 'QUADTREE',
            availableLevels: 2,
            subtreeLevels: 1,
            ...overrides
          }
        }
      }
    ]
  };
}

test.each([
  ['contentUri', '', 'requires contentUri'],
  ['contentUri', 4, 'requires contentUri'],
  ['subtreeUri', '', 'requires subtreeUri'],
  ['subtreeUri', null, 'requires subtreeUri'],
  ['subdivisionScheme', 'HEXATREE', 'unsupported subdivisionScheme'],
  ['availableLevels', 0, 'positive availableLevels'],
  ['availableLevels', 1.5, 'positive availableLevels'],
  ['subtreeLevels', -1, 'positive subtreeLevels'],
  ['subtreeLevels', null, 'positive subtreeLevels']
])('draft implicit tiling rejects %s=%j', async (name, value, message) => {
  const json = createImplicitTileset({[String(name)]: value});
  await expect(
    parse(new TextEncoder().encode(JSON.stringify(json)).buffer, Tiles3DLoader, {
      worker: false,
      '3d-tiles': {loadGLTF: false}
    })
  ).rejects.toThrow(String(message));
});

test.each([
  {children: [1]},
  {externalAsset: 0}
])('draft implicit tiling rejects explicit placement %j', async node => {
  const json = createImplicitTileset({}, node);
  await expect(
    parse(new TextEncoder().encode(JSON.stringify(json)).buffer, Tiles3DLoader, {
      worker: false,
      '3d-tiles': {loadGLTF: false}
    })
  ).rejects.toThrow('must not define children or externalAsset');
});

test('draft implicit tiling rejects spherical bounding volumes', async () => {
  const json = {...createImplicitTileset(), shapes: [{type: 'sphere', sphere: {radius: 1}}]};
  await expect(
    parse(new TextEncoder().encode(JSON.stringify(json)).buffer, Tiles3DLoader, {
      worker: false,
      '3d-tiles': {loadGLTF: false}
    })
  ).rejects.toThrow('cannot use a sphere');
});

/** Creates a minimal already-decoded subtree for validation of its owning parser. */
function createSubtree(extension: Record<string, unknown> = {}) {
  return {
    json: {
      asset: {version: '2.1'},
      extensions: {
        '3DTILES_subtree': {
          tileAvailability: {constant: 1},
          childSubtreeAvailability: {constant: 0},
          ...extension
        }
      }
    },
    buffers: []
  } as any;
}

test.each([
  [{tileAvailability: null}, 'tileAvailability is required'],
  [{childSubtreeAvailability: null}, 'childSubtreeAvailability is required'],
  [{tileAvailability: {constant: 1, bitstream: 0}}, 'two data sources'],
  [{tileAvailability: {constant: 2}}, 'requires constant or bitstream'],
  [{tileAvailability: {bitstream: 2}}, 'missing bufferView 2'],
  [{tileAttributes: {TILE_GEOMETRIC_ERROR: 0.5}}, 'invalid accessor'],
  [{tileAttributes: {TILE_GEOMETRIC_ERROR: 2}}, 'missing accessor 2'],
  [{tileProperties: 0.5}, 'invalid table index'],
  [{tileProperties: 0}, 'invalid property table']
])('draft subtree rejects malformed metadata %j', (extension, message) => {
  expect(() => parse3DTiles2Subtree(createSubtree(extension), '')).toThrow(message);
});

test.each([
  5123, 5125
])('draft subtree decodes unaligned unsigned accessor type %i', componentType => {
  const source = createSubtree({tileAttributes: {CUSTOM_VALUE: 0}});
  const byteLength = componentType === 5123 ? 2 : 4;
  const bytes = new Uint8Array(byteLength + 1);
  new DataView(bytes.buffer).setUint16(1, 42, true);
  source.buffers = [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.length}];
  source.json.bufferViews = [{buffer: 0, byteOffset: 1, byteLength}];
  source.json.accessors = [{bufferView: 0, componentType, type: 'SCALAR', count: 1}];
  expect(Array.from(parse3DTiles2Subtree(source, '').tileAttributes!.CUSTOM_VALUE)).toEqual([42]);
});

test.each([
  [{componentType: 9999, type: 'SCALAR', count: 1}, 'unsupported accessor component type'],
  [{componentType: 5123, type: 'FUTURE', count: 1}, 'unsupported accessor type'],
  [{componentType: 5123, type: 'SCALAR', count: 1, bufferView: 1}, 'No gltf buffer view'],
  [{componentType: 5123, type: 'SCALAR', count: 2, bufferView: 0}, 'assert failed: gltf']
])('draft subtree checks accessor metadata %j', (accessor, message) => {
  const source = createSubtree({tileAttributes: {CUSTOM_VALUE: 0}});
  source.json.accessors = [accessor];
  source.json.bufferViews = [{buffer: 0, byteLength: 2}];
  source.buffers = [{arrayBuffer: new ArrayBuffer(2), byteOffset: 0, byteLength: 2}];
  expect(() => parse3DTiles2Subtree(source, '')).toThrow(message);
});
