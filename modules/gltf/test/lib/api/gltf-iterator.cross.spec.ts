// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {GLTFIterator} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

describe('GLTFIterator', () => {
  test('iterates raw collections with stable metadata without mutation', () => {
    const gltf = makeGLTF();
    const jsonBeforeIteration = JSON.stringify(gltf.json);
    const iterator = new GLTFIterator(gltf);

    const [mesh] = Array.from(iterator.meshes);
    const [primitive] = Array.from(iterator.getReferences(mesh).primitives);

    expect(mesh).toBe(gltf.json.meshes?.[0]);
    expect(iterator.getMetadata(mesh)).toEqual({
      gltf,
      type: 'mesh',
      index: 0,
      parent: undefined,
      path: 'meshes[0]'
    });
    expect(iterator.getMetadata(primitive)).toEqual({
      gltf,
      type: 'primitive',
      index: 0,
      parent: mesh,
      path: 'meshes[0].primitives[0]'
    });
    expect(primitive).toBe(gltf.json.meshes?.[0].primitives[0]);
    expect(JSON.stringify(gltf.json)).toBe(jsonBeforeIteration);
  });

  test('keeps raw fields and reference navigation separate', () => {
    const gltf = makeGLTF();
    const iterator = new GLTFIterator(gltf);
    const [mesh] = Array.from(iterator.meshes);
    const [node] = Array.from(iterator.nodes);

    expect(node.mesh).toBe(0);
    expect(iterator.getReferences(node).mesh).toBe(mesh);
    expect(iterator.getReferences(node)).toBe(iterator.getReferences(node));
  });

  test('maps raw indices to loaded buffer and image companions', () => {
    const gltf = makeGLTF();
    const iterator = new GLTFIterator(gltf);
    const [bufferView] = Array.from(iterator.bufferViews);
    const [image] = Array.from(iterator.images);

    expect(iterator.getLoadedBufferView(bufferView)).toBeInstanceOf(Uint8Array);
    expect(iterator.getTypedArrayForBufferView(0)).toBeInstanceOf(Uint8Array);
    expect(iterator.getTypedArrayForAccessor(0)).toBeInstanceOf(Float32Array);
    expect(iterator.getLoadedImage(image)).toBe(gltf.images?.[0]);
  });

  test('resolves and caches standard references lazily', () => {
    const gltf = makeGLTF();
    const iterator = new GLTFIterator(gltf);
    const [node] = Array.from(iterator.nodes);
    const [mesh] = Array.from(iterator.meshes);
    const [primitive] = Array.from(iterator.getReferences(mesh).primitives);
    const [animation] = Array.from(iterator.animations);
    const [channel] = Array.from(iterator.getReferences(animation).channels);
    const [animationSampler] = Array.from(iterator.getReferences(animation).samplers);
    const [material] = Array.from(iterator.materials);
    const [textureInfo] = Array.from(iterator.getReferences(material).textures);

    expect(iterator.getReferences(node).mesh).toBe(mesh);
    expect(Array.from(iterator.meshes)[0]).toBe(mesh);
    expect(iterator.getReferences(iterator.scene!).nodes.next().value).toBe(node);
    expect(Array.from(iterator.getReferences(node).children)).toEqual([]);
    expect(iterator.getReferences(node).camera).toBe(Array.from(iterator.cameras)[0]);
    expect(iterator.getReferences(node).skin).toBe(Array.from(iterator.skins)[0]);
    expect(iterator.getReferences(node).externalAsset).toBe(Array.from(iterator.externalAssets)[0]);
    expect(iterator.getReferences(primitive).attributes.get('POSITION')).toBe(
      Array.from(iterator.accessors)[0]
    );
    expect(iterator.getReferences(primitive).indices).toBe(Array.from(iterator.accessors)[1]);
    expect(iterator.getReferences(primitive).material).toBe(material);
    expect(iterator.getReferences(channel).sampler).toBe(animationSampler);
    expect(iterator.getReferences(iterator.getReferences(channel).target).node).toBe(node);
    expect(iterator.getReferences(animationSampler).input).toBe(Array.from(iterator.accessors)[0]);
    expect(iterator.getReferences(animationSampler).output).toBe(Array.from(iterator.accessors)[1]);
    expect(iterator.getReferences(material).baseColorTexture).toBe(textureInfo);
    expect(Array.from(iterator.accessors)[0].type).toBe('VEC3');
    expect(Array.from(iterator.cameras)[0].type).toBe('perspective');
    expect(textureInfo.index).toBe(0);
    expect(iterator.getReferences(textureInfo).texture).toBe(Array.from(iterator.textures)[0]);
    expect(iterator.getReferences(Array.from(iterator.textures)[0]).source).toBe(
      Array.from(iterator.images)[0]
    );
    expect(iterator.getReferences(Array.from(iterator.textures)[0]).sampler).toBe(
      Array.from(iterator.samplers)[0]
    );
    expect(iterator.getReferences(Array.from(iterator.skins)[0]).inverseBindMatrices).toBe(
      Array.from(iterator.accessors)[1]
    );
    expect(iterator.getReferences(Array.from(iterator.skins)[0]).skeleton).toBe(node);
    expect(iterator.getReferences(Array.from(iterator.skins)[0]).joints.next().value).toBe(node);
    expect(iterator.thumbnail).toBe(Array.from(iterator.images)[0]);
  });

  test('exposes loaded resource companions', () => {
    const gltf = makeGLTF();
    const iterator = new GLTFIterator(gltf);

    expect(iterator.getLoadedBuffer(Array.from(iterator.buffers)[0])).toBe(gltf.buffers[0]);
    expect(iterator.getReferences(Array.from(iterator.bufferViews)[0]).buffer).toBe(
      Array.from(iterator.buffers)[0]
    );
    expect(iterator.getLoadedBufferView(Array.from(iterator.bufferViews)[0])).toEqual(
      new Uint8Array(gltf.buffers[0].arrayBuffer)
    );
    expect(iterator.getLoadedImage(Array.from(iterator.images)[0])).toBe(gltf.images?.[0]);
    expect(iterator.getLoadedFile(Array.from(iterator.files)[0])).toBe(gltf.files?.[0]);
    expect(iterator.getReferences(Array.from(iterator.files)[0]).bufferView).toBe(
      Array.from(iterator.bufferViews)[0]
    );
    expect(iterator.getReferences(Array.from(iterator.externalAssets)[0]).file).toBe(
      Array.from(iterator.files)[0]
    );
    expect(iterator.getLoadedExternalAsset(Array.from(iterator.externalAssets)[0])).toBeNull();
  });

  test('manages object and root extension declarations in place', () => {
    const gltf = makeGLTF();
    const iterator = new GLTFIterator(gltf);
    const [mesh] = Array.from(iterator.meshes);

    expect(iterator.getExtension(mesh, 'EXT_mesh_test')).toBeUndefined();
    iterator.setExtension(mesh, 'EXT_mesh_test', {enabled: true});
    iterator.setExtension(mesh, 'EXT_mesh_test', {enabled: false});
    expect(iterator.getExtension(mesh, 'EXT_mesh_test')).toEqual({enabled: false});
    expect(gltf.json.extensionsUsed).toEqual(['EXT_mesh_test']);

    iterator.removeExtension(mesh, 'EXT_mesh_test');
    iterator.removeExtension(mesh, 'EXT_mesh_test');
    expect(iterator.getExtension(mesh, 'EXT_mesh_test')).toBeUndefined();
    expect(
      (gltf.json as typeof gltf.json & {extensionsRemoved?: string[]}).extensionsRemoved
    ).toEqual(['EXT_mesh_test']);

    iterator.setExtension('EXT_root_test', {version: 1}, true);
    iterator.setExtension('EXT_optional_test', {version: 2});
    iterator.registerRequiredExtension('EXT_root_test');
    expect(iterator.hasExtension('EXT_root_test')).toBe(true);
    expect(iterator.hasExtension('EXT_optional_test')).toBe(true);
    expect(iterator.hasExtension('EXT_missing')).toBe(false);
    expect(iterator.isExtensionRequired('EXT_root_test')).toBe(true);
    expect(iterator.isExtensionRequired('EXT_optional_test')).toBe(false);
    expect(iterator.getExtension('EXT_root_test')).toEqual({version: 1});

    iterator.removeExtension('EXT_root_test');
    iterator.removeExtension('EXT_missing');
    expect(iterator.getExtension('EXT_root_test')).toBeUndefined();
    expect(gltf.json.extensionsUsed).toEqual(['EXT_mesh_test', 'EXT_optional_test']);
    expect(gltf.json.extensionsRequired).toEqual([]);
  });

  test('adds binary resources and exposes their typed views', () => {
    const gltf = makeGLTF();
    const iterator = new GLTFIterator(gltf);
    const source = new Uint8Array([99, 10, 20, 30, 99]).subarray(1, 4);

    const bufferIndex = iterator.addBuffer(source);
    const bufferViewIndex = iterator.addBufferView(bufferIndex, source.byteLength, 0);
    const accessorIndex = iterator.addAccessor(bufferViewIndex, {
      size: 3,
      componentType: 5121,
      count: 1,
      min: [10, 20, 30],
      max: [10, 20, 30]
    });

    expect(
      iterator.getLoadedBuffer(Array.from(iterator.buffers)[bufferIndex])?.arrayBuffer
    ).toEqual(new Uint8Array([10, 20, 30]).buffer);
    expect(iterator.getTypedArrayForBufferView(bufferViewIndex)).toEqual(
      new Uint8Array([10, 20, 30])
    );
    expect(iterator.getTypedArrayForAccessor(accessorIndex)).toEqual(new Uint8Array([10, 20, 30]));
    expect(gltf.json.accessors?.[accessorIndex]).toMatchObject({
      bufferView: bufferViewIndex,
      type: 'VEC3',
      componentType: 5121,
      count: 1,
      min: [10, 20, 30],
      max: [10, 20, 30]
    });
    expect(iterator.getTypedArrayForImageData(0)).toEqual(
      new Uint8Array(gltf.buffers[0].arrayBuffer)
    );
  });

  test('covers all standard relationship facades and optional variants', () => {
    const gltf = makeGLTF();
    gltf.json.accessors?.push({componentType: 5126, count: 1, type: 'SCALAR'});
    gltf.json.materials![0] = {
      pbrMetallicRoughness: {
        baseColorTexture: {index: 0},
        metallicRoughnessTexture: {index: 0}
      },
      normalTexture: {index: 0},
      occlusionTexture: {index: 0},
      emissiveTexture: {index: 0}
    };
    gltf.json.meshes![0].primitives[0].targets = [{NORMAL: 0}];
    gltf.json.nodes![0].children = [0];
    const iterator = new GLTFIterator(gltf);
    const [accessorWithoutBufferView] = Array.from(iterator.accessors).slice(-1);
    const [animation] = Array.from(iterator.animations);
    const [mesh] = Array.from(iterator.meshes);
    const [primitive] = Array.from(iterator.getReferences(mesh).primitives);
    const [material] = Array.from(iterator.materials);
    const materialReferences = iterator.getReferences(material);

    expect(iterator.getReferences(accessorWithoutBufferView).bufferView).toBeUndefined();
    expect(Array.from(iterator.getReferences(animation).channels)).toHaveLength(1);
    expect(Array.from(iterator.getReferences(animation).samplers)).toHaveLength(1);
    expect(iterator.getReferences(Array.from(iterator.bufferViews)[0]).buffer).toBe(
      Array.from(iterator.buffers)[0]
    );
    expect(iterator.getReferences(Array.from(iterator.files)[0]).bufferView).toBe(
      Array.from(iterator.bufferViews)[0]
    );
    expect(iterator.getReferences(Array.from(iterator.images)[0]).bufferView).toBe(
      Array.from(iterator.bufferViews)[0]
    );
    expect(iterator.getReferences(Array.from(iterator.externalAssets)[0]).file).toBe(
      Array.from(iterator.files)[0]
    );
    expect(iterator.getMetadata(materialReferences.metallicRoughnessTexture!).index).toBe(1);
    expect(iterator.getMetadata(materialReferences.normalTexture!).index).toBe(2);
    expect(iterator.getMetadata(materialReferences.occlusionTexture!).index).toBe(3);
    expect(iterator.getMetadata(materialReferences.emissiveTexture!).index).toBe(4);
    expect(Array.from(materialReferences.textures)).toHaveLength(5);
    expect(iterator.getReferences(primitive).targets[0].get('NORMAL')).toBe(
      Array.from(iterator.accessors)[0]
    );
    expect(Array.from(iterator.getReferences(Array.from(iterator.nodes)[0]).children)).toEqual([
      Array.from(iterator.nodes)[0]
    ]);
  });

  test('reports invalid animation-local references when resolved', () => {
    const gltf = makeGLTF();
    gltf.json.animations![0].channels[0].sampler = 9;
    const iterator = new GLTFIterator(gltf);
    const [animation] = Array.from(iterator.animations);
    const [channel] = Array.from(iterator.getReferences(animation).channels);

    expect(() => iterator.getReferences(channel).sampler).toThrow(
      'Invalid glTF reference at animations[0].channels[0].sampler: animation sampler index 9 is out of range'
    );
  });

  test('handles unresolved loaded data and initially absent bookkeeping arrays', () => {
    const gltf = makeGLTF();
    gltf.buffers = [];
    const iterator = new GLTFIterator(gltf);
    const [animation] = Array.from(iterator.animations);
    const [channel] = Array.from(iterator.getReferences(animation).channels);
    const samplerResolvedFromChannel = iterator.getReferences(channel).sampler;

    expect(samplerResolvedFromChannel).toBe(
      Array.from(iterator.getReferences(animation).samplers)[0]
    );
    expect(iterator.getLoadedBufferView(Array.from(iterator.bufferViews)[0])).toBeUndefined();
    expect(Array.from(iterator.scenes)).toHaveLength(1);

    delete gltf.json.extensionsUsed;
    delete gltf.json.extensionsRequired;
    iterator.removeExtension('EXT_absent');
    expect(gltf.json.extensionsUsed).toBeUndefined();
    expect(gltf.json.extensionsRequired).toBeUndefined();
  });

  test('distinguishes absent optional links from invalid present references', () => {
    const gltf = makeGLTF();
    delete gltf.json.nodes?.[0].camera;
    gltf.json.nodes![0].mesh = 99;
    const iterator = new GLTFIterator(gltf);
    const [node] = Array.from(iterator.nodes);

    expect(iterator.getReferences(node).camera).toBeUndefined();
    expect(() => iterator.getReferences(node).mesh).toThrow(
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
