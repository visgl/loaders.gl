// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {GLBWriter} from '../../../../src/gltf/glb-writer';
import {parse} from '../../../../src/gltf/gltf-loader';
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

describe('MSFT_texture_dds', () => {
  test('selects and parses embedded DDS with the injected compressed texture parser', async () => {
    const ddsParser = vi.fn(data => CompressedTextureLoaderWithParser.parse(data));
    const result = await parse(makeGLB(true), {gltf: {ddsParser}}, {fetch: globalThis.fetch});
    expect(result.json.textures![0].source).toBe(1);
    expect(ddsParser).toHaveBeenCalledOnce();
    expect(result.images![1]).toMatchObject({
      compressed: true,
      mipmaps: true,
      width: 4,
      height: 4,
      data: [{textureFormat: 'bc1-rgb-unorm-webgl', data: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])}]
    });
    expect(result.json.extensionsRequired).not.toContain('MSFT_texture_dds');
  });

  test('keeps optional fallback and declaration when no parser is provided', async () => {
    const result = await parse(makeGLB(), {gltf: {loadImages: false}}, {fetch: globalThis.fetch});
    expect(result.json.textures![0].source).toBe(0);
    expect(result.json.textures![0].extensions?.MSFT_texture_dds).toEqual({source: 1});
  });

  test('fetches external DDS bytes and passes them to the injected parser', async () => {
    const document = makeDocument(true);
    document.images[1] = {
      uri: 'texture.dds',
      mimeType: 'image/vnd-ms.dds'
    } as (typeof document.images)[1];
    const fetch = vi.fn(async () => new Response(makeDDS()));
    const ddsParser = vi.fn(data => CompressedTextureLoaderWithParser.parse(data));
    const result = await parse(
      JSON.stringify(document),
      {gltf: {ddsParser, loadBuffers: false}},
      {fetch, baseUrl: '/assets/'}
    );
    expect(fetch).toHaveBeenCalledOnce();
    expect(ddsParser).toHaveBeenCalledOnce();
    expect(result.images![1]).toMatchObject({compressed: true, width: 4, height: 4});
  });

  test('retains the extension declaration when image loading is disabled', async () => {
    const ddsParser = vi.fn(data => CompressedTextureLoaderWithParser.parse(data));
    const result = await parse(
      makeGLB(),
      {gltf: {ddsParser, loadImages: false}},
      {fetch: globalThis.fetch}
    );
    expect(ddsParser).not.toHaveBeenCalled();
    expect(result.json.textures![0].extensions?.MSFT_texture_dds).toEqual({source: 1});
  });

  test('rejects required DDS without a parser before loading image resources', async () => {
    const fetch = vi.fn();
    await expect(parse(makeGLB(true), {}, {fetch})).rejects.toThrow(
      /MSFT_texture_dds needs a DDS parser/
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  test('propagates parser failures and rejects empty mip chains', async () => {
    await expect(
      parse(makeGLB(), {gltf: {ddsParser: () => []}}, {fetch: globalThis.fetch})
    ).rejects.toThrow(/parser returned no texture levels/);
    await expect(
      parse(
        makeGLB(),
        {
          gltf: {
            ddsParser: () => {
              throw new Error('unsupported DDS format');
            }
          }
        },
        {fetch: globalThis.fetch}
      )
    ).rejects.toThrow('unsupported DDS format');
  });
});
