// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {GLTFIterator} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

describe('GLTFIterator', () => {
  test('iterates raw collections with stable Proxy metadata without mutation', () => {
    const gltf = makeGLTF();
    const jsonBeforeIteration = JSON.stringify(gltf.json);
    const iterator = new GLTFIterator(gltf);

    const [mesh] = Array.from(iterator.meshes);
    const [primitive] = Array.from(mesh.primitives);

    expect(mesh._proxy.gltf).toBe(gltf);
    expect(mesh._proxy.type).toBe('mesh');
    expect(mesh._proxy.index).toBe(0);
    expect(mesh._proxy.raw).toBe(gltf.json.meshes?.[0]);
    expect(mesh._proxy.path).toBe('meshes[0]');
    expect(primitive._proxy.type).toBe('primitive');
    expect(primitive._proxy.index).toBe(0);
    expect(primitive._proxy.parent).toBe(mesh);
    expect(primitive._proxy.raw).toBe(gltf.json.meshes?.[0].primitives[0]);
    expect(mesh.name).toBe('triangle');
    expect(Object.keys(mesh)).toEqual(Object.keys(gltf.json.meshes![0]));
    expect(JSON.stringify(mesh)).toBe(JSON.stringify(gltf.json.meshes![0]));
    expect(JSON.stringify(gltf.json)).toBe(jsonBeforeIteration);
  });

  test('forwards ordinary raw properties and keeps reference assignment explicit', () => {
    const gltf = makeGLTF();
    const iterator = new GLTFIterator(gltf);
    const [mesh] = Array.from(iterator.meshes);
    const [node] = Array.from(iterator.nodes);

    mesh.name = 'renamed';
    expect(gltf.json.meshes![0].name).toBe('renamed');
    expect(Reflect.set(node, 'mesh', 1)).toBe(false);
    expect(gltf.json.nodes![0].mesh).toBe(0);
    node._proxy.raw.mesh = 1;
    expect(gltf.json.nodes![0].mesh).toBe(1);
  });

  test('resolves and caches standard references lazily', () => {
    const gltf = makeGLTF();
    const iterator = new GLTFIterator(gltf);
    const [node] = Array.from(iterator.nodes);
    const [mesh] = Array.from(iterator.meshes);
    const [primitive] = Array.from(mesh.primitives);
    const [animation] = Array.from(iterator.animations);
    const [channel] = Array.from(animation.channels);
    const [animationSampler] = Array.from(animation.samplers);
    const [material] = Array.from(iterator.materials);
    const [textureInfo] = Array.from(material.textures);

    expect(node.mesh).toBe(mesh);
    expect(Array.from(iterator.meshes)[0]).toBe(mesh);
    expect(Array.from(iterator.scene!.nodes)[0]).toBe(node);
    expect(Array.from(node.children)).toEqual([]);
    expect(node.camera).toBe(Array.from(iterator.cameras)[0]);
    expect(node.skin).toBe(Array.from(iterator.skins)[0]);
    expect(node.externalAsset).toBe(Array.from(iterator.externalAssets)[0]);
    expect(primitive.attributes.get('POSITION')).toBe(Array.from(iterator.accessors)[0]);
    expect(primitive.indices).toBe(Array.from(iterator.accessors)[1]);
    expect(primitive.material).toBe(material);
    expect(channel.sampler).toBe(animationSampler);
    expect(channel.target.node).toBe(node);
    expect(animationSampler.input).toBe(Array.from(iterator.accessors)[0]);
    expect(animationSampler.output).toBe(Array.from(iterator.accessors)[1]);
    expect(material.baseColorTexture).toBe(textureInfo);
    expect(Array.from(iterator.accessors)[0].type).toBe('VEC3');
    expect(Array.from(iterator.cameras)[0].type).toBe('perspective');
    expect(textureInfo.index).toBe(0);
    expect(textureInfo.texture).toBe(Array.from(iterator.textures)[0]);
    expect(Array.from(iterator.textures)[0].source).toBe(Array.from(iterator.images)[0]);
    expect(Array.from(iterator.textures)[0].sampler).toBe(Array.from(iterator.samplers)[0]);
    expect(Array.from(iterator.skins)[0].inverseBindMatrices).toBe(
      Array.from(iterator.accessors)[1]
    );
    expect(Array.from(iterator.skins)[0].skeleton).toBe(node);
    expect(Array.from(iterator.skins)[0].joints.next().value).toBe(node);
    expect(iterator.thumbnail).toBe(Array.from(iterator.images)[0]);
  });

  test('exposes loaded resource companions', () => {
    const gltf = makeGLTF();
    const iterator = new GLTFIterator(gltf);

    expect(Array.from(iterator.buffers)[0].loadedBuffer).toBe(gltf.buffers[0]);
    expect(Array.from(iterator.bufferViews)[0].buffer).toBe(Array.from(iterator.buffers)[0]);
    expect(Array.from(iterator.bufferViews)[0].loadedBufferView).toEqual(
      new Uint8Array(gltf.buffers[0].arrayBuffer)
    );
    expect(Array.from(iterator.images)[0].loadedImage).toBe(gltf.images?.[0]);
    expect(Array.from(iterator.files)[0].loadedFile).toBe(gltf.files?.[0]);
    expect(Array.from(iterator.files)[0].bufferView).toBe(Array.from(iterator.bufferViews)[0]);
    expect(Array.from(iterator.externalAssets)[0].file).toBe(Array.from(iterator.files)[0]);
    expect(Array.from(iterator.externalAssets)[0].loadedAsset).toBeNull();
  });

  test('distinguishes absent optional links from invalid present references', () => {
    const gltf = makeGLTF();
    delete gltf.json.nodes?.[0].camera;
    gltf.json.nodes![0].mesh = 99;
    const iterator = new GLTFIterator(gltf);
    const [node] = Array.from(iterator.nodes);

    expect(node.camera).toBeUndefined();
    expect(() => node.mesh).toThrow(
      'Invalid glTF reference at nodes[0].mesh: mesh index 99 is out of range'
    );
  });
});

/** Create a compact glTF containing every supported top-level collection and common references. */
function makeGLTF(): GLTFWithBuffers {
  const arrayBuffer = new ArrayBuffer(16);
  return {
    json: {
      asset: {version: '2.0', thumbnail: 0},
      accessors: [
        {bufferView: 0, componentType: 5126, count: 1, type: 'VEC3'},
        {bufferView: 0, componentType: 5123, count: 1, type: 'SCALAR'}
      ],
      animations: [
        {
          channels: [{sampler: 0, target: {node: 0, path: 'translation'}}],
          samplers: [{input: 0, output: 1}]
        }
      ],
      buffers: [{byteLength: arrayBuffer.byteLength}],
      bufferViews: [{buffer: 0, byteLength: arrayBuffer.byteLength}],
      cameras: [{type: 'perspective', perspective: {yfov: 1, znear: 0.1}}],
      files: [{bufferView: 0, mimeType: 'model/gltf-binary', name: 'child.glb'}],
      externalAssets: [{file: 0}],
      images: [{bufferView: 0, mimeType: 'image/png'}],
      materials: [{pbrMetallicRoughness: {baseColorTexture: {index: 0}}}],
      meshes: [
        {
          name: 'triangle',
          primitives: [{attributes: {POSITION: 0}, indices: 1, material: 0}]
        }
      ],
      nodes: [{camera: 0, mesh: 0, skin: 0, externalAsset: 0}],
      samplers: [{}],
      scene: 0,
      scenes: [{nodes: [0]}],
      skins: [{inverseBindMatrices: 1, skeleton: 0, joints: [0]}],
      textures: [{sampler: 0, source: 0}]
    },
    buffers: [{arrayBuffer, byteOffset: 0, byteLength: arrayBuffer.byteLength}],
    images: [{compressed: true, mipmaps: false, width: 1, height: 1, data: new Uint8Array()}],
    files: [
      {
        arrayBuffer,
        byteOffset: 0,
        byteLength: arrayBuffer.byteLength,
        mimeType: 'model/gltf-binary',
        name: 'child.glb'
      }
    ],
    externalAssets: [null]
  };
}
