// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {load, parse} from '@loaders.gl/core';
import {encodeArrayBufferToBase64} from '@loaders.gl/core/loader-utils';
import {CompressedTextureLoader} from '@loaders.gl/images';
import {GLBWriter} from '../../../../src/gltf/glb-writer';
import {GLTFLoaderWithParser} from '../../../../src/gltf/gltf-loader';
import {GLTFLoader} from '../../../../src/gltf/gltf-loader-types';
import {CompressedTextureLoaderWithParser} from '../../../../../images/src/compressed-texture-loader';

/** One 4x4 DXT1 DDS level with a valid header. */
function makeDDS(): ArrayBuffer {
  const data = new ArrayBuffer(136);
  const header = new DataView(data);
  header.setUint32(0, 0x20534444, true);
  header.setUint32(4, 124, true);
  header.setUint32(12, 4, true);
  header.setUint32(16, 4, true);
  header.setUint32(80, 4, true);
  header.setUint32(84, 0x31545844, true);
  new Uint8Array(data, 128).set([1, 2, 3, 4, 5, 6, 7, 8]);
  return data;
}

/** A texture with a regular fallback and an optional embedded DDS alternative. */
function makeDocument(required = false) {
  return {
    asset: {version: '2.0'},
    extensionsUsed: ['MSFT_texture_dds'],
    extensionsRequired: required ? ['MSFT_texture_dds'] : [],
    buffers: [{byteLength: 136}],
    bufferViews: [{buffer: 0, byteOffset: 0, byteLength: 136}],
    images: [{uri: 'fallback.png'}, {bufferView: 0, mimeType: 'image/vnd-ms.dds'}],
    textures: [{source: 0, extensions: {MSFT_texture_dds: {source: 1}}}]
  };
}

/** Embed the DDS payload in a standard GLB buffer. */
function makeGLB(required = false) {
  return GLBWriter.encodeSync({
    type: 'glTF',
    version: 2,
    header: {byteOffset: 0, byteLength: 0, hasBinChunk: true},
    json: makeDocument(required),
    jsonChunkIndex: 0,
    binChunks: [{chunkIndex: 1, byteOffset: 0, byteLength: 136, arrayBuffer: makeDDS()}]
  });
}

/** A DDS-capable parser passed alongside the glTF loader. */
function makeDDSLoader() {
  const parseDDS = vi.fn(CompressedTextureLoaderWithParser.parse);
  return {...CompressedTextureLoaderWithParser, worker: false, parse: parseDDS};
}

describe('MSFT_texture_dds', () => {
  test('parses embedded DDS using the extra loader passed to parse', async () => {
    const ddsLoader = makeDDSLoader();
    const result = await parse(makeGLB(true), [GLTFLoaderWithParser, ddsLoader], {
      core: {worker: false}
    });
    expect(result.json.textures![0].source).toBe(1);
    expect(ddsLoader.parse).toHaveBeenCalledOnce();
    expect(result.images![1]).toMatchObject({
      compressed: true,
      mipmaps: true,
      width: 4,
      height: 4,
      data: [{textureFormat: 'bc1-rgb-unorm-webgl', data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])}]
    });
    expect(result.json.extensionsRequired).not.toContain('MSFT_texture_dds');
  });

  test('propagates an extra DDS loader through load', async () => {
    const ddsLoader = makeDDSLoader();
    const dataUrl = `data:model/gltf-binary;base64,${encodeArrayBufferToBase64(makeGLB(true))}`;
    const result = await load(dataUrl, [GLTFLoaderWithParser, ddsLoader], {core: {worker: false}});
    expect(result.images![1]).toMatchObject({compressed: true, width: 4, height: 4});
    expect(ddsLoader.parse).toHaveBeenCalledOnce();
  });

  test('supports the metadata-only compressed texture loader through preload', async () => {
    const result = await parse(makeGLB(true), [GLTFLoader, CompressedTextureLoader], {
      core: {worker: false}
    });
    expect(result.images![1]).toMatchObject({compressed: true, width: 4, height: 4});
  });

  test('keeps optional fallback and declaration when no parser is provided', async () => {
    const result = await parse(makeGLB(), [GLTFLoaderWithParser], {gltf: {loadImages: false}});
    expect(result.json.textures![0].source).toBe(0);
    expect(result.json.textures![0].extensions?.MSFT_texture_dds).toEqual({source: 1});
  });

  test('fetches external DDS bytes using the extra loader', async () => {
    const document = makeDocument(true);
    document.images[1] = {
      uri: 'texture.dds',
      mimeType: 'image/vnd-ms.dds'
    } as (typeof document.images)[1];
    const fetch = vi.fn(async () => new Response(makeDDS()));
    const ddsLoader = makeDDSLoader();
    const result = await parse(
      new Response(JSON.stringify(document), {headers: {'content-type': 'model/gltf+json'}}),
      [GLTFLoaderWithParser, ddsLoader],
      {core: {fetch, baseUrl: '/assets/', worker: false}, gltf: {loadBuffers: false}}
    );
    expect(fetch).toHaveBeenCalledOnce();
    expect(ddsLoader.parse).toHaveBeenCalledOnce();
    expect(result.images![1]).toMatchObject({compressed: true, width: 4, height: 4});
  });

  test('retains the extension declaration when image loading is disabled', async () => {
    const ddsLoader = makeDDSLoader();
    const result = await parse(makeGLB(), [GLTFLoaderWithParser, ddsLoader], {
      gltf: {loadImages: false}
    });
    expect(ddsLoader.parse).not.toHaveBeenCalled();
    expect(result.json.textures![0].extensions?.MSFT_texture_dds).toEqual({source: 1});
  });

  test('rejects required DDS without a parser before loading image resources', async () => {
    const fetch = vi.fn();
    await expect(parse(makeGLB(true), [GLTFLoaderWithParser], {core: {fetch}})).rejects.toThrow(
      /MSFT_texture_dds needs a DDS parser/
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  test('propagates parser failures and rejects empty mip chains', async () => {
    const emptyLoader = {...makeDDSLoader(), parse: async () => []};
    await expect(
      parse(makeGLB(), [GLTFLoaderWithParser, emptyLoader], {core: {worker: false}})
    ).rejects.toThrow(/parser returned no texture levels/);
    const failingLoader = {
      ...makeDDSLoader(),
      parse: async () => {
        throw new Error('unsupported DDS format');
      }
    };
    await expect(
      parse(makeGLB(), [GLTFLoaderWithParser, failingLoader], {core: {worker: false}})
    ).rejects.toThrow('unsupported DDS format');
  });
});
