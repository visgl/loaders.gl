// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {mapMeshSourceTexture} from '../apps/tile-converter/src/v5/mesh-source-texture';
import {
  createTexturedTriangle,
  createImageDataUri,
  TEXTURE_SAMPLER
} from './utils/tile-converter-texture';

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
      selected.extensions = {UNKNOWN: {}};
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

test.each([
  {},
  {offset: [0.25, -0.5]},
  {rotation: Math.PI / 2, scale: [0.5, -1]},
  {
    offset: [0, 1],
    rotation: 0,
    scale: [0, 2],
    texCoord: 0,
    extensions: {},
    extras: {label: 'source'}
  }
])('source texture mapping preserves UV transform controls %j', transform => {
  const selected = structuredClone(textureInfo);
  selected.extensions = {KHR_texture_transform: transform};
  const before = structuredClone(selected);
  expect(mapMeshSourceTexture(selected).transform).toEqual({
    offset: 'offset' in transform ? transform.offset : undefined,
    rotation: 'rotation' in transform ? transform.rotation : undefined,
    scale: 'scale' in transform ? transform.scale : undefined
  });
  expect(selected).toEqual(before);
});

test.each([
  undefined,
  null,
  false,
  1,
  [],
  {texCoord: 1},
  {texCoord: null},
  {unknown: true},
  {extensions: {UNKNOWN: {}}}
])('source texture mapping rejects unmapped UV transform %j', transform => {
  const selected = structuredClone(textureInfo);
  selected.extensions = {KHR_texture_transform: transform};
  expect(() => mapMeshSourceTexture(selected)).toThrowError(
    expect.objectContaining({code: 'MESH_SOURCE_TEXTURE_UNSUPPORTED'})
  );
});

test.each([
  undefined,
  'image/png'
])('source texture mapping decodes inline PNG bytes with declared mimeType=%s', mimeType => {
  const selected = structuredClone(textureInfo);
  selected.texture.source = {uri: createImageDataUri(imageBytes, 'image/png'), mimeType};
  const before = structuredClone(selected);
  expect(mapMeshSourceTexture(selected)).toMatchObject({data: imageBytes, mimeType: 'image/png'});
  expect(selected).toEqual(before);
});

test.each([
  {uri: 1},
  {uri: 'image.png'},
  {uri: 'https://example.invalid/image.png'},
  {uri: 'data:image/webp;base64,AA=='},
  {uri: 'data:image/png,%89PNG'},
  {uri: 'data:image/png;base64,'},
  {uri: 'data:image/png;base64,AA$='},
  {uri: 'data:image/png;base64,A'},
  {uri: 'data:image/png;base64,AA==', mimeType: 'image/jpeg'}
])('source texture mapping rejects unsupported inline image %j', image => {
  const selected = structuredClone(textureInfo);
  selected.texture.source = image;
  expect(() => mapMeshSourceTexture(selected)).toThrowError(
    expect.objectContaining({code: 'MESH_SOURCE_TEXTURE_UNSUPPORTED'})
  );
});
