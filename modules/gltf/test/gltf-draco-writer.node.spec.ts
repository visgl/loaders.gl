import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {
  compressGLTFWithDraco,
  GLTFLoader,
  GLTFWriter,
  type GLTFWithBuffers
} from '@loaders.gl/gltf';
import draco3d from 'draco3d';

function createTriangleGLTF(): GLTFWithBuffers {
  const bytes = new Uint8Array(42);
  new Float32Array(bytes.buffer, 0, 9).set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  new Uint16Array(bytes.buffer, 36, 3).set([0, 1, 2]);
  return {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: bytes.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 36},
        {buffer: 0, byteOffset: 36, byteLength: 6}
      ],
      accessors: [
        {bufferView: 0, componentType: 5126, count: 3, type: 'VEC3'},
        {bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 0}, indices: 1}]}]
    },
    buffers: [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: bytes.byteLength}]
  };
}

test('compressGLTFWithDraco preserves input and adds a KHR buffer view', async () => {
  const gltf = createTriangleGLTF();
  const inputJson = JSON.stringify(gltf.json);
  const inputBytes = new Uint8Array(gltf.buffers[0].arrayBuffer).slice();
  const compressed = await compressGLTFWithDraco(gltf, {
    gltf: {draco: {enabled: true}},
    modules: {draco3d}
  });

  expect(JSON.stringify(gltf.json)).toBe(inputJson);
  expect(new Uint8Array(gltf.buffers[0].arrayBuffer)).toEqual(inputBytes);
  expect(compressed.json.extensionsUsed).toContain('KHR_draco_mesh_compression');
  expect(compressed.json.bufferViews).toHaveLength(3);
  expect(
    compressed.json.meshes?.[0].primitives?.[0].extensions?.KHR_draco_mesh_compression
  ).toMatchObject({bufferView: 2, attributes: {POSITION: 0}});
});

test('GLTFWriter Draco compression round-trips through GLTFLoader', async () => {
  const gltf = createTriangleGLTF();
  const encoded = await GLTFWriter.encode(gltf, {
    gltf: {draco: {enabled: true}},
    modules: {draco3d}
  });
  const decoded = await parse(encoded, GLTFLoader, {
    gltf: {decompressMeshes: true},
    modules: {draco3d}
  });

  expect(decoded.json.meshes?.[0].primitives?.[0].attributes?.POSITION).toBeTruthy();
  expect(decoded.json.meshes?.[0].primitives?.[0].extensions).toEqual({});
});

test('GLTFWriter rejects synchronous Draco compression', () => {
  const gltf = createTriangleGLTF();
  expect(() => GLTFWriter.encodeSync?.(gltf, {gltf: {draco: {enabled: true}}})).toThrow(
    'use encode() instead of encodeSync()'
  );
});
