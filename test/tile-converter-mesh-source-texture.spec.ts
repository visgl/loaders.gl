// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {mapMeshSourceTexture} from '../apps/tile-converter/src/v5/mesh-source-texture';
import {createTexturedTriangle, TEXTURE_SAMPLER} from './utils/tile-converter-texture';

let textureInfo: any;
let imageBytes: Uint8Array;

/** Parses one immutable embedded texture; mutation cases clone its postprocessed descriptor. */
beforeAll(async () => {
  imageBytes = new Uint8Array(
    await (
      await fetchFile(new URL('./data/tile-converter-texture.png', import.meta.url).href)
    ).arrayBuffer()
  );
  const gltf = postProcessGLTF(
    await parse(createTexturedTriangle(imageBytes, 'image/png'), GLTFLoader, {
      worker: false,
      gltf: {loadImages: false}
    })
  );
  textureInfo = gltf.meshes[0].primitives[0].material!.pbrMetallicRoughness!.baseColorTexture;
});

test('source texture mapping retains encoded subviews and sampling without modifying input', () => {
  const before = structuredClone(textureInfo);
  const texture = mapMeshSourceTexture(textureInfo);
  expect(texture.data).toBe(textureInfo.texture.source.bufferView.data);
  expect(texture.data.byteOffset).toBeGreaterThan(0);
  expect(texture.data).toEqual(imageBytes);
  expect(texture.mimeType).toBe('image/png');
  expect(texture.sampler).toEqual(TEXTURE_SAMPLER);
  expect(textureInfo).toEqual(before);
});

test.each([
  undefined,
  0
])('source texture mapping accepts default and explicit UV set %s', texCoord => {
  const selected = structuredClone(textureInfo);
  selected.texCoord = texCoord;
  delete selected.texture.sampler;
  expect(mapMeshSourceTexture(selected)).toEqual({data: imageBytes, mimeType: 'image/png'});
});

test('source texture mapping retains an implicit sampler when no controls are declared', () => {
  const selected = structuredClone(textureInfo);
  selected.texture.sampler = {id: 'default-sampler', parameters: {10240: 9729, 10241: 9986}};
  expect(mapMeshSourceTexture(selected)).toEqual({data: imageBytes, mimeType: 'image/png'});
});

test.each([
  [
    'UV set',
    (selected: any) => {
      selected.texCoord = 1;
    }
  ],
  [
    'texture info extension',
    (selected: any) => {
      selected.extensions = {KHR_texture_transform: {offset: [1, 0]}};
    }
  ],
  [
    'texture info control',
    (selected: any) => {
      selected.unknown = true;
    }
  ],
  [
    'missing texture',
    (selected: any) => {
      delete selected.texture;
    }
  ],
  [
    'texture control',
    (selected: any) => {
      selected.texture.unknown = true;
    }
  ],
  [
    'texture extension',
    (selected: any) => {
      selected.texture.extensions = {KHR_texture_basisu: {}};
    }
  ],
  [
    'missing image',
    (selected: any) => {
      delete selected.texture.source;
    }
  ],
  [
    'external image',
    (selected: any) => {
      selected.texture.source.uri = 'image.png';
    }
  ],
  [
    'image extension',
    (selected: any) => {
      selected.texture.source.extensions = {UNKNOWN: {}};
    }
  ],
  [
    'missing buffer view',
    (selected: any) => {
      delete selected.texture.source.bufferView;
    }
  ],
  [
    'invalid image bytes',
    (selected: any) => {
      selected.texture.source.bufferView.data = new ArrayBuffer(0);
    }
  ],
  [
    'buffer view extension',
    (selected: any) => {
      selected.texture.source.bufferView.extensions = {UNKNOWN: {}};
    }
  ],
  [
    'unsupported MIME',
    (selected: any) => {
      selected.texture.source.mimeType = 'image/webp';
    }
  ],
  [
    'missing MIME',
    (selected: any) => {
      delete selected.texture.source.mimeType;
    }
  ],
  [
    'sampler extension',
    (selected: any) => {
      selected.texture.sampler.extensions = {UNKNOWN: {}};
    }
  ],
  [
    'sampler control',
    (selected: any) => {
      selected.texture.sampler.unknown = true;
    }
  ]
])('source texture mapping rejects %s', (_name, mutate) => {
  const selected = structuredClone(textureInfo);
  mutate(selected);
  expect(() => mapMeshSourceTexture(selected)).toThrowError(
    expect.objectContaining({code: 'MESH_SOURCE_TEXTURE_UNSUPPORTED'})
  );
});

test.each([undefined, null])('source texture mapping rejects a missing descriptor %s', selected => {
  expect(() => mapMeshSourceTexture(selected as any)).toThrowError(
    expect.objectContaining({code: 'MESH_SOURCE_TEXTURE_UNSUPPORTED'})
  );
});
