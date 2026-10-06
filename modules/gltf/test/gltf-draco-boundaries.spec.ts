// SPDX-License-Identifier: MIT

import {beforeEach, expect, test, vi} from 'vitest';
import {encodeDraco, type DracoEncodingResult} from '@loaders.gl/draco';
import type {GLTFWithBuffers} from '../src/lib/types/gltf-types';
import {compressGLTFWithDraco} from '../src/lib/encoders/encode-gltf-draco';

vi.mock('@loaders.gl/draco', () => ({encodeDraco: vi.fn()}));

const encodeDracoMock = vi.mocked(encodeDraco);
const ENABLED_OPTIONS = {gltf: {draco: {enabled: true}}};

/** Creates one unindexed triangle backed by an explicitly bounded buffer slice. */
function createTriangle(): GLTFWithBuffers {
  const arrayBuffer = new ArrayBuffer(44);
  new Float32Array(arrayBuffer, 4, 9).set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  new Uint8Array(arrayBuffer).set([91, 92, 93, 94]);
  return {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: 37}],
      bufferViews: [{buffer: 0, byteLength: 36}],
      accessors: [{bufferView: 0, componentType: 5126, count: 3, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}}]}]
    },
    buffers: [{arrayBuffer, byteOffset: 4, byteLength: 37}]
  };
}

beforeEach(() => {
  encodeDracoMock.mockReset();
  encodeDracoMock.mockResolvedValue({
    data: new Uint8Array([11, 12, 13]).buffer,
    report: {attributes: {POSITION: {id: 7}}}
  } as DracoEncodingResult);
});

test('disabled compression returns the input without inspecting mesh storage', async () => {
  const source = createTriangle();
  expect(await compressGLTFWithDraco(source)).toBe(source);
  expect(await compressGLTFWithDraco(source, {gltf: {draco: {enabled: false}}})).toBe(source);
  expect(encodeDracoMock).not.toHaveBeenCalled();
});

test('compression rejects multiple loaded buffers before invoking the encoder', async () => {
  const source = createTriangle();
  source.buffers.push({...source.buffers[0]});
  await expect(compressGLTFWithDraco(source, ENABLED_OPTIONS)).rejects.toThrow('single buffer');
  expect(encodeDracoMock).not.toHaveBeenCalled();
});

test.each([
  undefined,
  [],
  [{primitives: []}],
  [{}]
])('empty mesh declarations clone JSON without creating compressed storage: %j', async meshes => {
  const source = {json: {asset: {version: '2.0'}, meshes}} as unknown as GLTFWithBuffers;
  const output = await compressGLTFWithDraco(source, ENABLED_OPTIONS);
  expect(output).not.toBe(source);
  expect(output.json).toEqual(JSON.parse(JSON.stringify(source.json)));
  expect(output.buffers).toEqual([]);
  expect(encodeDracoMock).not.toHaveBeenCalled();
});

test.each([
  undefined,
  true
])('unsupported primitive modes are skipped with option %j', async skip => {
  const source = createTriangle();
  source.json.meshes![0].primitives[0].mode = 1;
  const output = await compressGLTFWithDraco(source, {
    gltf: {draco: {enabled: true, skipUnsupportedPrimitives: skip}}
  });
  expect(output.json).toEqual(source.json);
  expect(output.buffers[0].arrayBuffer).not.toBe(source.buffers[0].arrayBuffer);
  expect(encodeDracoMock).not.toHaveBeenCalled();
});

test('strict compression rejects unsupported primitive modes', async () => {
  const source = createTriangle();
  source.json.meshes![0].primitives[0].mode = 0;
  await expect(
    compressGLTFWithDraco(source, {
      gltf: {draco: {enabled: true, skipUnsupportedPrimitives: false}}
    })
  ).rejects.toThrow('primitive mode 0');
});

test.each([
  ['missing POSITION', {attributes: {}}, 'requires a POSITION'],
  ['missing attributes', {}, 'requires a POSITION'],
  ['missing accessor', {attributes: {POSITION: 8}}, 'resolve accessor 8'],
  ['missing indices', {attributes: {POSITION: 0}, indices: 8}, 'resolve index accessor 8'],
  [
    'existing compression',
    {attributes: {POSITION: 0}, extensions: {KHR_draco_mesh_compression: {bufferView: 0}}},
    'refuses to replace'
  ]
])('rejects %s before native encoding', async (_name, primitive, message) => {
  const source = createTriangle();
  source.json.meshes![0].primitives[0] = primitive as never;
  await expect(compressGLTFWithDraco(source, ENABLED_OPTIONS)).rejects.toThrow(message);
  expect(encodeDracoMock).not.toHaveBeenCalled();
});

test('sparse POSITION data is rejected before it can be encoded as dense data', async () => {
  const source = createTriangle();
  source.json.accessors![0].sparse = {
    count: 1,
    indices: {bufferView: 0, componentType: 5121},
    values: {bufferView: 0}
  };
  await expect(compressGLTFWithDraco(source, ENABLED_OPTIONS)).rejects.toThrow('sparse accessor 0');
});

test('unindexed POSITION counts must describe complete triangles', async () => {
  const source = createTriangle();
  source.json.accessors![0].count = 2;
  await expect(compressGLTFWithDraco(source, ENABLED_OPTIONS)).rejects.toThrow('triangle-aligned');
});

test.each([5130, 5134, 5135])('64-bit component type %i cannot enter native Draco', async type => {
  const source = createTriangle();
  source.buffers = [{arrayBuffer: new ArrayBuffer(72), byteOffset: 0, byteLength: 72}];
  source.json.bufferViews![0].byteLength = 72;
  source.json.accessors![0].componentType = type;
  await expect(compressGLTFWithDraco(source, ENABLED_OPTIONS)).rejects.toThrow(
    `64-bit accessor 0 (componentType ${type})`
  );
  expect(encodeDracoMock).not.toHaveBeenCalled();
});

test.each([
  ['SCALAR', 1],
  ['VEC2', 2],
  ['VEC3', 3],
  ['VEC4', 4],
  ['MAT2', 4],
  ['MAT3', 9],
  ['MAT4', 16]
] as const)('passes %s attributes with %i components and normalized metadata', async (type, size) => {
  const source = createTriangle();
  source.buffers = [
    {arrayBuffer: new ArrayBuffer(36 + size * 12), byteOffset: 0, byteLength: 36 + size * 12}
  ];
  source.json.bufferViews!.push({buffer: 0, byteOffset: 36, byteLength: size * 12});
  source.json.accessors!.push({
    bufferView: 1,
    componentType: 5126,
    count: 3,
    type,
    normalized: false
  });
  source.json.meshes![0].primitives[0].attributes._CUSTOM = 1;
  await compressGLTFWithDraco(source, ENABLED_OPTIONS);
  expect(encodeDracoMock.mock.calls[0][0]).toMatchObject({
    attributes: {_CUSTOM: {size, normalized: false}},
    indices: new Uint32Array([0, 1, 2])
  });
});

test('multiple payloads align correctly and preserve preexisting extension declarations', async () => {
  const source = createTriangle();
  source.json.meshes![0].primitives[0].extensions = {EXT_example: {value: 1}};
  source.json.meshes![0].primitives.push({attributes: {POSITION: 0}, mode: 4});
  source.json.extensionsUsed = ['EXT_example', 'KHR_draco_mesh_compression'];
  const input = structuredClone(source);
  const modules = {custom: 'local'};
  const core = {useLocalLibraries: true};
  const output = await compressGLTFWithDraco(source, {...ENABLED_OPTIONS, core, modules});
  expect(output.json.bufferViews!.slice(1)).toEqual([
    {buffer: 0, byteOffset: 40, byteLength: 3},
    {buffer: 0, byteOffset: 44, byteLength: 3}
  ]);
  expect(new Uint8Array(output.buffers[0].arrayBuffer).slice(37)).toEqual(
    new Uint8Array([0, 0, 0, 11, 12, 13, 0, 11, 12, 13])
  );
  expect(output.json.buffers![0].byteLength).toBe(47);
  expect(output.json.extensionsUsed).toEqual(source.json.extensionsUsed);
  expect(output.json.meshes![0].primitives[0].extensions).toEqual({
    EXT_example: {value: 1},
    KHR_draco_mesh_compression: {bufferView: 1, attributes: {POSITION: 7}}
  });
  expect(encodeDracoMock.mock.calls[0][1]).toMatchObject({core, modules});
  expect(source).toEqual(input);
});

test('encoder failures preserve caller JSON and loaded bytes', async () => {
  const source = createTriangle();
  const original = structuredClone(source);
  const error = new Error('fixture encoding failure');
  encodeDracoMock.mockRejectedValue(error);
  await expect(compressGLTFWithDraco(source, ENABLED_OPTIONS)).rejects.toBe(error);
  expect(source).toEqual(original);
});
