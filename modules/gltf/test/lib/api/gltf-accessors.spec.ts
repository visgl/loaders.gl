// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  getGLTFAccessor,
  getGLTFAccessorValue,
  setGLTFAccessorValue,
  GLTFIterator,
  GLTFScenegraph,
  GLTFWriter,
  GLTFLoader,
  createExtStructuralMetadata
} from '@loaders.gl/gltf';
import {parse} from '@loaders.gl/core';
import type {GLTFWithBuffers} from '@loaders.gl/gltf';

/** Author an accessor over an explicitly bounded borrowed byte range. */
function createAccessor(values: Float32Array): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: values.byteLength}],
      bufferViews: [{buffer: 0, byteLength: values.byteLength}],
      accessors: [{bufferView: 0, componentType: 5126, type: 'VEC2', count: values.length / 2}]
    },
    buffers: [
      {
        arrayBuffer: values.buffer as ArrayBuffer,
        byteOffset: values.byteOffset,
        byteLength: values.byteLength
      }
    ]
  };
}

test('glTF accessor helpers borrow packed subviews and preserve JSON references', () => {
  const storage = new Float32Array([99, 1, 2, 3, 4, 99]);
  const gltf = createAccessor(storage.subarray(1, 5));
  const before = structuredClone(gltf.json);
  const values = getGLTFAccessorValue(gltf, 0);
  expect(values).toEqual(new Float32Array([1, 2, 3, 4]));
  expect(values.buffer).toBe(storage.buffer);
  expect(values.byteOffset).toBe(4);
  expect(gltf.json).toEqual(before);
  expect(getGLTFAccessor(gltf, gltf.json.accessors![0])).toBe(gltf.json.accessors![0]);
  expect(() => getGLTFAccessor(gltf, 9)).toThrow();
});

test('glTF accessor helpers materialize interleaved and unaligned values', () => {
  const gltf = createAccessor(new Float32Array([1, 2, 99, 3, 4, 99]));
  gltf.json.accessors![0].count = 2;
  gltf.json.bufferViews![0].byteStride = 12;
  expect(getGLTFAccessorValue(gltf, 0)).toEqual(new Float32Array([1, 2, 3, 4]));
  const bytes = new Uint8Array(17);
  bytes.set(new Uint8Array(new Float32Array([1, 2, 3, 4]).buffer), 1);
  const unaligned = createAccessor(new Float32Array(4));
  unaligned.buffers[0] = {arrayBuffer: bytes.buffer, byteOffset: 1, byteLength: 16};
  expect(getGLTFAccessorValue(unaligned, 0)).toEqual(new Float32Array([1, 2, 3, 4]));
});

test('glTF sparse and implicit-zero reads are shared by iterator and scenegraph', () => {
  const gltf: GLTFWithBuffers = {
    json: {
      asset: {version: '2.0'},
      bufferViews: [
        {buffer: 0, byteLength: 1},
        {buffer: 0, byteOffset: 4, byteLength: 8}
      ],
      accessors: [
        {
          componentType: 5126,
          type: 'VEC2',
          count: 3,
          sparse: {count: 1, indices: {bufferView: 0, componentType: 5121}, values: {bufferView: 1}}
        }
      ]
    },
    buffers: [{arrayBuffer: new ArrayBuffer(12), byteOffset: 0, byteLength: 12}]
  };
  new Uint8Array(gltf.buffers[0].arrayBuffer)[0] = 1;
  new Float32Array(gltf.buffers[0].arrayBuffer, 4).set([7, 8]);
  const before = structuredClone(gltf);
  expect(getGLTFAccessorValue(gltf, 0)).toEqual(new Float32Array([0, 0, 7, 8, 0, 0]));
  expect(new GLTFIterator(gltf).getTypedArrayForAccessor(0)).toEqual(getGLTFAccessorValue(gltf, 0));
  expect(new GLTFScenegraph(gltf).getTypedArrayForAccessor(0)).toEqual(
    getGLTFAccessorValue(gltf, 0)
  );
  expect(gltf).toEqual(before);
  delete gltf.json.accessors![0].sparse;
  expect(getGLTFAccessorValue(gltf, 0)).toEqual(new Float32Array(6));
});

test('glTF accessor replacement updates writer-visible storage without mutating borrowed bytes', async () => {
  const source = new Float32Array([1, 2, 3, 4]);
  const gltf = createAccessor(source);
  gltf.json.accessors!.push({...gltf.json.accessors![0]});
  const replacement = new Uint16Array([99, 5, 6, 7, 8, 99]).subarray(1, 5);
  setGLTFAccessorValue(gltf, 0, replacement);
  expect(getGLTFAccessorValue(gltf, 0)).toEqual(replacement);
  expect(source).toEqual(new Float32Array([1, 2, 3, 4]));
  expect(gltf.json.accessors![0].componentType).toBe(5123);
  expect(gltf.json.accessors![0].bufferView).toBe(1);
  const encoded = GLTFWriter.encodeSync!(gltf);
  const decoded = await parse(encoded, GLTFLoader, {
    core: {worker: false},
    gltf: {loadImages: false}
  });
  expect(getGLTFAccessorValue(decoded, 0)).toEqual(replacement);
  expect(getGLTFAccessorValue(decoded, 1)).toEqual(source);
  expect(getGLTFAccessorValue(gltf, 0)).toEqual(replacement);
  expect(source).toEqual(new Float32Array([1, 2, 3, 4]));
  expect(() => setGLTFAccessorValue(gltf, 0, new Float32Array(3))).toThrow();
});

test('glTF accessor reads reject storage outside the borrowed range', () => {
  const gltf = createAccessor(new Float32Array(8).subarray(0, 4));
  gltf.json.bufferViews![0].byteLength = 24;
  expect(() => getGLTFAccessorValue(gltf, 0)).toThrow();
  gltf.json.bufferViews![0].byteLength = 16;
  gltf.json.accessors![0].byteOffset = -4;
  expect(() => getGLTFAccessorValue(gltf, 0)).toThrow();
});

test('glTF accessor replacement appends after unloaded buffer definitions and clears overrides', () => {
  const decoded = new Float32Array([1, 2, 3, 4]);
  const accessor = {
    componentType: 5126,
    type: 'MAT2',
    count: 1,
    value: decoded,
    sparse: {count: 0, indices: {bufferView: 0, componentType: 5121}, values: {bufferView: 0}}
  };
  const gltf: GLTFWithBuffers = {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: 4, uri: 'unloaded.bin'}],
      accessors: [accessor]
    },
    buffers: []
  };
  setGLTFAccessorValue(gltf, accessor, new Float32Array([5, 6, 7, 8]));
  expect(gltf.json.bufferViews![0].buffer).toBe(1);
  expect(gltf.json.buffers![0].uri).toBe('unloaded.bin');
  expect(accessor).not.toHaveProperty('sparse');
  expect(accessor).not.toHaveProperty('value');
  expect(getGLTFAccessorValue(gltf, accessor)).toEqual(new Float32Array([5, 6, 7, 8]));
});

test('glTF decoder arrays remain borrowed unless sparse replacements require a copy', () => {
  const value = new Uint16Array([1, 2, 3]);
  const gltf: GLTFWithBuffers = {
    json: {
      asset: {version: '2.0'},
      accessors: [{componentType: 5123, type: 'SCALAR', count: 3, value} as any]
    },
    buffers: []
  };
  expect(getGLTFAccessorValue(gltf, {componentType: 5123, type: 'SCALAR', count: 3, value})).toBe(
    value
  );
  expect(getGLTFAccessorValue(gltf, 0)).toBe(value);
  gltf.json.accessors![0].count = 2;
  expect(() => getGLTFAccessorValue(gltf, 0)).toThrow();
});

test.each([
  ['MAT2', new Uint8Array([1, 2, 3, 4]), 8],
  ['MAT3', new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), 12],
  ['MAT3', new Uint16Array([1, 2, 3, 4, 5, 6, 7, 8, 9]), 24]
] as const)('glTF replacement pads %s matrix columns for reading and writer round trips', async (type, value, byteLength) => {
  const gltf: GLTFWithBuffers = {
    json: {asset: {version: '2.0'}, accessors: [{type, componentType: 5126, count: 2}]},
    buffers: []
  };
  const values =
    value instanceof Uint8Array
      ? new Uint8Array([...value, ...value])
      : new Uint16Array([...value, ...value]);
  const original = values.slice();
  setGLTFAccessorValue(gltf, 0, values);
  expect(gltf.json.bufferViews![0].byteLength).toBe(byteLength * 2);
  expect(getGLTFAccessorValue(gltf, 0)).toEqual(values);
  const encoded = GLTFWriter.encodeSync!(gltf);
  const decoded = await parse(encoded, GLTFLoader, {
    core: {worker: false},
    gltf: {loadImages: false}
  });
  expect(getGLTFAccessorValue(decoded, 0)).toEqual(values);
  expect(values).toEqual(original);
});

test('glTF packing retains loaded buffers alongside builder additions and repeated replacements', async () => {
  const original = new Float32Array([1, 2, 3, 4]);
  const gltf = createAccessor(original);
  gltf.json.accessors!.push({...gltf.json.accessors![0]});
  setGLTFAccessorValue(gltf, 0, new Uint8Array([5, 6, 7, 8]));
  const replacement = new Float64Array([9.25, 10.5, 11.75, 12]);
  setGLTFAccessorValue(gltf, 0, replacement);
  const builder = new GLTFScenegraph(gltf);
  const viewIndex = builder.addBufferView(new Uint8Array([20, 21, 22]));
  builder.createBinaryChunk();
  expect(builder.getTypedArrayForBufferView(viewIndex)).toEqual(new Uint8Array([20, 21, 22]));
  expect(getGLTFAccessorValue(builder.gltf, 0)).toEqual(replacement);
  expect(getGLTFAccessorValue(builder.gltf, 1)).toEqual(original);
  const decoded = await parse(GLTFWriter.encodeSync!(builder.gltf), GLTFLoader, {
    core: {worker: false},
    gltf: {loadImages: false}
  });
  expect(getGLTFAccessorValue(decoded, 0)).toEqual(replacement);
  expect(getGLTFAccessorValue(decoded, 1)).toEqual(original);
  builder.createBinaryChunk();
  expect(getGLTFAccessorValue(builder.gltf, 0)).toEqual(replacement);
});

test.each([
  'EXT_meshopt_compression',
  'KHR_meshopt_compression'
])('glTF packing remaps %s byte ranges with their loaded buffer', name => {
  const gltf = createAccessor(new Float32Array([1, 2, 3, 4]));
  setGLTFAccessorValue(gltf, 0, new Uint8Array([5, 6, 7, 8]));
  const replacementView = gltf.json.accessors![0].bufferView!;
  const extension = {buffer: 1, byteOffset: 2, byteLength: 1};
  gltf.json.bufferViews![0].extensions = {[name]: extension};
  const builder = new GLTFScenegraph(gltf);
  builder.createBinaryChunk();
  expect(extension.buffer).toBe(0);
  expect(extension.byteOffset).toBe(builder.json.bufferViews![replacementView].byteOffset! + 2);
  expect(new Uint8Array(builder.gltf.binary!, extension.byteOffset, 1)).toEqual(
    new Uint8Array([7])
  );
});

test('glTF replacement values survive metadata extension encoding without duplicating its buffers', async () => {
  const gltf = createAccessor(new Float32Array([1, 2, 3, 4]));
  const scenegraph = new GLTFScenegraph(gltf);
  createExtStructuralMetadata(scenegraph, [
    {name: 'label', elementType: 'STRING', values: ['first', 'second']}
  ]);
  const replacement = new Float32Array([5, 6, 7, 8]);
  setGLTFAccessorValue(scenegraph.gltf, 0, replacement);
  const decoded = await parse(GLTFWriter.encodeSync!(scenegraph.gltf), GLTFLoader, {
    core: {worker: false},
    gltf: {loadImages: false}
  });
  expect(getGLTFAccessorValue(decoded, 0)).toEqual(replacement);
  const metadata = new GLTFScenegraph(decoded).getExtension('EXT_structural_metadata');
  expect(metadata.propertyTables[0].properties.label.data).toEqual(['first', 'second']);
});
