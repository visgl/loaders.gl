// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {decode} from '../../../src/lib/extensions/EXT_structural_metadata';

/** Builds a one-column metadata table from an exact binary value buffer. */
function createMetadata(
  property: Record<string, unknown>,
  values: ArrayBufferView,
  count = 1,
  column: Record<string, unknown> = {}
) {
  return {
    buffers: [
      {arrayBuffer: values.buffer, byteOffset: values.byteOffset, byteLength: values.byteLength}
    ],
    json: {
      buffers: [{byteLength: values.byteLength}],
      bufferViews: [{buffer: 0, byteOffset: 0, byteLength: values.byteLength}],
      extensions: {
        EXT_structural_metadata: {
          schema: {classes: {Sample: {properties: {value: property}}}},
          propertyTables: [{class: 'Sample', count, properties: {value: {values: 0, ...column}}}]
        }
      }
    }
  } as any;
}

test.each([
  ['INT8', new Int8Array([-128, 127])],
  ['INT16', new Int16Array([-32768, 32767])],
  ['UINT16', new Uint16Array([0, 65535])],
  ['INT32', new Int32Array([-2147483648, 2147483647])],
  ['UINT32', new Uint32Array([0, 4294967295])],
  ['INT64', new BigInt64Array([-9223372036854775808n, 9223372036854775807n])]
])('structural metadata normalizes %s extrema and preserves raw values', async (componentType, values) => {
  const gltf = createMetadata(
    {type: 'SCALAR', componentType, normalized: true},
    values as ArrayBufferView,
    2
  );
  await decode(gltf, {gltf: {loadBuffers: true}});
  const property = gltf.json.extensions.EXT_structural_metadata.propertyTables[0].properties.value;
  expect(Array.from(property.data)).toEqual([String(componentType).startsWith('INT') ? -1 : 0, 1]);
  expect(Array.from(property.rawData)).toEqual(Array.from(values as any));
  expect(Object.keys(property)).not.toContain('rawData');
});

test.each([
  ['VEC2', 2],
  ['VEC3', 3],
  ['VEC4', 4],
  ['MAT2', 4],
  ['MAT3', 9],
  ['MAT4', 16]
])('structural metadata applies component transforms to %s', async (type, size) => {
  const values = new Float32Array(Number(size)).fill(2);
  const gltf = createMetadata(
    {type, componentType: 'FLOAT32', offset: 100, scale: 100},
    values,
    1,
    {offset: [3], scale: [4]}
  );
  await decode(gltf, {gltf: {loadBuffers: true}});
  expect(
    Array.from(gltf.json.extensions.EXT_structural_metadata.propertyTables[0].properties.value.data)
  ).toEqual([11, ...new Array(Number(size) - 1).fill(2)]);
});

test('structural metadata leaves non-normalizable floats unchanged and validates Boolean bounds', async () => {
  const gltf = createMetadata(
    {type: 'SCALAR', componentType: 'FLOAT32', normalized: true},
    new Float32Array([3])
  );
  await decode(gltf, {gltf: {loadBuffers: true}});
  const property = gltf.json.extensions.EXT_structural_metadata.propertyTables[0].properties.value;
  expect(property.data).toBe(property.rawData);
  await expect(
    decode(createMetadata({type: 'BOOLEAN'}, new Uint8Array([1]), 9), {gltf: {loadBuffers: true}})
  ).rejects.toThrow('BOOLEAN values exceed');
  const missingCount = createMetadata({type: 'BOOLEAN', array: true}, new Uint8Array([1]));
  await decode(missingCount, {gltf: {loadBuffers: true}});
  expect(
    missingCount.json.extensions.EXT_structural_metadata.propertyTables[0].properties.value.data
  ).toEqual([]);
});

test('structural metadata rejects unavailable external schemas without public network access', async () => {
  const createExternal = () =>
    ({json: {extensions: {EXT_structural_metadata: {schemaUri: 'schema.json'}}}}) as any;
  await expect(decode(createExternal(), {gltf: {loadBuffers: true}})).rejects.toThrow(
    'loader context is required'
  );
  await expect(
    decode(
      createExternal(),
      {core: {baseUrl: 'https://example.test/model.gltf'}, gltf: {loadBuffers: true}},
      {fetch: async () => new Response('', {status: 404})} as any
    )
  ).rejects.toThrow('(404)');
});

test('structural metadata decodes property textures across primitives and deduplicates values', async () => {
  const coordinates = new Float32Array([0, 0, 0.75, 0, 0, 0]);
  const primitive = {
    attributes: {TEXCOORD_0: 0},
    extensions: {EXT_structural_metadata: {propertyTextures: [0, 1]}}
  };
  const gltf = {
    buffers: [{arrayBuffer: coordinates.buffer, byteOffset: 0, byteLength: coordinates.byteLength}],
    images: [{width: 2, height: 1, data: new Uint8Array([7, 0, 0, 255, 9, 0, 0, 255])}],
    json: {
      buffers: [{byteLength: coordinates.byteLength}],
      bufferViews: [{buffer: 0, byteLength: coordinates.byteLength}],
      accessors: [{bufferView: 0, componentType: 5126, type: 'VEC2', count: 3}],
      images: [{mimeType: 'image/png'}],
      textures: [{source: 0}],
      meshes: [{primitives: [primitive, {attributes: {}}]}],
      extensions: {
        EXT_structural_metadata: {
          propertyTextures: [
            {class: 'Sample', properties: {value: {index: 0, channels: [0]}, omitted: null}},
            {class: 'Empty'}
          ]
        }
      }
    }
  } as any;
  await decode(gltf, {gltf: {loadBuffers: true, loadImages: true}});
  const extension = gltf.json.extensions.EXT_structural_metadata;
  expect(extension.propertyTextures[0].properties.value.data).toEqual([7, 9]);
  expect(extension.dataAttributeNames).toEqual(['Sample_value']);
  expect(primitive.attributes).toHaveProperty('Sample_value');
});
