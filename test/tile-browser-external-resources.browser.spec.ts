// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {DataViewReadableFile} from '@loaders.gl/zip';
import {
  inspectConversionInput,
  convertSelectedContents
} from '../examples/website/i3s-slpk/src/convert-tileset';
import {createInput} from './utils/tile-browser-conversion';

let png: Uint8Array;
beforeAll(async () => {
  png = new Uint8Array(
    await (
      await fetchFile(new URL('./data/tile-converter-texture.png', import.meta.url).href)
    ).arrayBuffer()
  );
});
/** Tiny GLB whose vertex buffer and PNG image are relative external dependencies. */
function createExternalGlb() {
  const json = {
    asset: {version: '2.0'},
    buffers: [{uri: 'geometry.bin', byteLength: 60}],
    bufferViews: [
      {buffer: 0, byteOffset: 0, byteLength: 36},
      {buffer: 0, byteOffset: 36, byteLength: 24}
    ],
    accessors: [
      {bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0]},
      {bufferView: 1, componentType: 5126, count: 3, type: 'VEC2'}
    ],
    images: [{uri: 'image.png'}],
    textures: [{source: 0}],
    materials: [{pbrMetallicRoughness: {baseColorTexture: {index: 0}}}],
    meshes: [{primitives: [{attributes: {POSITION: 0, TEXCOORD_0: 1}, mode: 4, material: 0}]}],
    nodes: [{mesh: 0}],
    scenes: [{nodes: [0]}],
    scene: 0
  };
  const bytes = new TextEncoder().encode(JSON.stringify(json));
  const paddedLength = Math.ceil(bytes.length / 4) * 4;
  const output = new Uint8Array(20 + paddedLength);
  const view = new DataView(output.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, output.length, true);
  view.setUint32(12, paddedLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  output.fill(32, 20);
  output.set(bytes, 20);
  return output.buffer;
}

test.each([
  '3tz',
  'slpk'
] as const)('browser %s conversion resolves external buffers and images and keeps multiple placements', async format => {
  const {fetcher, controller} = createInput(false, false, 'Y', true);
  const inspection = await inspectConversionInput(
    'https://example.invalid/data/tileset.json',
    controller.signal,
    fetcher
  );
  inspection.tileset.root.children![1].content!.uri = 'other/sibling.glb';
  (inspection.resources[2] as {uri: string}).uri = 'other/sibling.glb';
  fetcher.mockImplementation(async input => {
    const url = String(input);
    if (url.endsWith('selected.glb') || url.endsWith('sibling.glb'))
      return new Response(createExternalGlb());
    if (url.endsWith('geometry.bin'))
      return new Response(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1]));
    if (url.endsWith('image.png')) return new Response(png);
    throw new Error(`Unexpected resource ${url}`);
  });
  const result = await convertSelectedContents(
    inspection,
    [inspection.resources[1].resourceId, inspection.resources[2].resourceId],
    format,
    controller.signal,
    () => {},
    fetcher
  );
  expect(result.file.name).toBe(`selected-meshes.${format}`);
  expect(result.report.outputResources).toBe(2);
  expect(
    fetcher.mock.calls.some(
      ([input]) => String(input) === 'https://example.invalid/data/geometry.bin'
    )
  ).toBe(true);
  expect(
    fetcher.mock.calls.some(([input]) => String(input) === 'https://example.invalid/data/image.png')
  ).toBe(true);
  for (const dependency of ['geometry.bin', 'image.png'])
    expect(
      fetcher.mock.calls.some(
        ([input]) => String(input) === `https://example.invalid/data/other/${dependency}`
      )
    ).toBe(true);
  const file = new DataViewReadableFile(new DataView(await result.file.arrayBuffer()));
  if (format === '3tz') {
    const archive = new Tiles3DArchive(file);
    try {
      const gltf = postProcessGLTF(
        await parse(await archive.getFile('meshes/1.glb'), GLTFLoader, {
          core: {worker: false},
          gltf: {loadImages: false}
        })
      );
      expect(
        gltf.meshes[0].primitives[0].material!.pbrMetallicRoughness!.baseColorTexture!.texture
          .source!.bufferView!.data
      ).toEqual(png);
    } finally {
      await archive.file.close();
    }
  } else {
    const archive = await parseSLPKArchive(file);
    try {
      const texture = await archive.getFile('nodes/2/textures/0', 'http');
      expect(new Uint8Array(texture)).toEqual(png);
      const layer = JSON.parse(new TextDecoder().decode(await archive.getFile('', 'http')));
      expect(layer.textureSetDefinitions).toHaveLength(2);
    } finally {
      await file.close();
    }
  }
});

test('a failed external image aborts conversion without exposing a partial archive', async () => {
  const {fetcher, controller} = createInput();
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  fetcher.mockImplementation(async input =>
    String(input).endsWith('selected.glb')
      ? new Response(createExternalGlb())
      : String(input).endsWith('geometry.bin')
        ? new Response(new Float32Array(15))
        : new Response('missing', {status: 404})
  );
  await expect(
    convertSelectedContents(
      inspection,
      [inspection.resources[1].resourceId],
      '3tz',
      controller.signal,
      () => {},
      fetcher
    )
  ).rejects.toMatchObject({code: 'BROWSER_SOURCE_FETCH_FAILED'});
});
