// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, parse} from '@loaders.gl/core';
import {GZipFflateCompressor} from '@loaders.gl/compression/gzip-compressor-fflate';
import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {SPZLoader} from '@loaders.gl/splats';

/** Creates a glTF document with a one-splat SPZ v2 payload. */
function makeGLTF(): string {
  const payload = new Uint8Array(16 + 9 + 1 + 3 + 3 + 3);
  const header = new DataView(payload.buffer);
  header.setUint32(0, 0x5053474e, true);
  header.setUint32(4, 2, true);
  header.setUint32(8, 1, true);
  header.setUint8(13, 12);
  payload[16] = 0;
  payload[17] = 16; // x = 1
  payload[25] = 255;
  payload.set([128, 128, 128], 26);
  payload.set([160, 160, 160], 29);
  const compressed = new Uint8Array(new GZipFflateCompressor().compressSync(payload.buffer));
  const uri = `data:application/octet-stream;base64,${btoa(String.fromCharCode(...compressed))}`;
  return JSON.stringify({
    asset: {version: '2.0'},
    extensionsUsed: ['KHR_gaussian_splatting', 'KHR_gaussian_splatting_compression_spz_2'],
    buffers: [{uri, byteLength: compressed.length}],
    bufferViews: [{buffer: 0, byteLength: compressed.length}],
    meshes: [
      {
        primitives: [
          {
            mode: 0,
            attributes: {},
            extensions: {
              KHR_gaussian_splatting: {
                kernel: 'ellipse',
                colorSpace: 'lin_rec709_display',
                extensions: {
                  KHR_gaussian_splatting_compression_spz_2: {bufferView: 0}
                }
              }
            }
          }
        ]
      }
    ]
  });
}

test('GLTFLoader decodes embedded SPZ using an extra loader and glTF coordinates', async () => {
  const gltf = await parse(makeGLTF(), [GLTFLoader, SPZLoader], {
    core: {mimeType: 'model/gltf+json'},
    splats: {sourceCoordinateSystem: 'RUB', targetCoordinateSystem: 'RUB'}
  });
  const descriptor = gltf.gaussianSplatPrimitives?.[0];
  const table = descriptor?.decoded as typeof SPZLoader.dataType;
  expect(table.numRows).toBe(1);
  expect(Array.from(table.getChild('POSITION')?.get(0)?.toArray() || [])).toEqual([-1, 0, -0]);
  expect(descriptor?.compressedBytes?.length).toBeGreaterThan(0);
});

test('GLTFLoader decodes a legacy SPZ2 primitive with an explicit color space', async () => {
  const json = JSON.parse(makeGLTF());
  const sourceExtension = json.meshes[0].primitives[0].extensions.KHR_gaussian_splatting;
  delete sourceExtension.kernel;
  delete sourceExtension.colorSpace;
  const gltf = await parse(JSON.stringify(json), [GLTFLoader, SPZLoader], {
    core: {mimeType: 'model/gltf+json'},
    gltf: {legacyGaussianSplatColorSpace: 'srgb_rec709_display'}
  });
  const descriptor = gltf.gaussianSplatPrimitives?.[0];
  const table = descriptor?.decoded as typeof SPZLoader.dataType;
  expect(table.numRows).toBe(1);
  expect(descriptor?.extension).toMatchObject({
    kernel: 'ellipse',
    colorSpace: 'srgb_rec709_display'
  });
  expect(gltf.json.meshes?.[0].primitives[0].extensions?.KHR_gaussian_splatting).toEqual(
    sourceExtension
  );
});

test('GLTFLoader preserves compressed data without an extra loader', async () => {
  const gltf = await parse(makeGLTF(), GLTFLoader);
  expect(gltf.gaussianSplatPrimitives?.[0].compressedBytes?.length).toBeGreaterThan(0);
  expect(gltf.gaussianSplatPrimitives?.[0].decoded).toBeUndefined();
});

test('GLTFLoader propagates an injected SPZ parser failure', async () => {
  const failingLoader = {
    ...SPZLoader,
    preload: async () => ({
      ...SPZLoader,
      parse: async () => {
        throw new Error('SPZ parse failed');
      }
    })
  };
  await expect(
    parse(makeGLTF(), [GLTFLoader, failingLoader], {
      core: {mimeType: 'model/gltf+json'}
    })
  ).rejects.toThrow('SPZ parse failed');
});

test('GLTFLoader requires loaded buffers to decode with an injected SPZ loader', async () => {
  await expect(
    parse(makeGLTF(), [GLTFLoader, SPZLoader], {
      core: {mimeType: 'model/gltf+json'},
      gltf: {loadBuffers: false}
    })
  ).rejects.toThrow('not loaded for SPZ2 decoding');
});

test('load propagates the extra SPZ loader through the glTF loader context', async () => {
  const url = `data:model/gltf+json;base64,${btoa(makeGLTF())}`;
  const gltf = await load(url, [GLTFLoader, SPZLoader], {
    core: {mimeType: 'model/gltf+json'}
  });
  const table = gltf.gaussianSplatPrimitives?.[0].decoded as typeof SPZLoader.dataType;
  expect(table.numRows).toBe(1);
});
