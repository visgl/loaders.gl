// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLBLoader, GLBWriter, GLTFLoader} from '@loaders.gl/gltf';
import {Tiles3DLoaderWithParser} from '../src/tiles-3d-loader-with-parser';

const POSITIONS = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
const IMAGE_BYTES = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII='
  ),
  character => character.charCodeAt(0)
);

// Exercise actual buffers, image decoding, material references and legacy containers
// while forbidding another glTF/GLB metadata-loader preload during a concurrent burst.
test.each([
  'glb',
  'gltf',
  'b3dm',
  'i3dm'
] as const)('parses resource-bearing %s tiles without reopening parser imports', async format => {
  const data = createTilePayload(format);
  const fetchedUrls: string[] = [];
  const glbPreload = vi
    .spyOn(GLBLoader, 'preload')
    .mockRejectedValue(new Error('Unexpected late GLB import'));
  const gltfPreload = vi
    .spyOn(GLTFLoader, 'preload')
    .mockRejectedValue(new Error('Unexpected late glTF import'));
  try {
    const tiles = await Promise.all(
      Array.from({length: 3}, () =>
        parse(data.slice(0), Tiles3DLoaderWithParser, {
          core: {
            worker: false,
            baseUrl: `https://example.com/tiles/content.${format}`,
            fetch: async url => {
              fetchedUrls.push(url);
              if (url === 'https://example.com/tiles/positions.bin') {
                return new Response(POSITIONS.buffer.slice(0));
              }
              if (url === 'https://example.com/tiles/textures/checker.png') {
                return new Response(IMAGE_BYTES.slice(), {
                  headers: {'content-type': 'image/png'}
                });
              }
              throw new Error(`Unexpected resource ${url}`);
            }
          },
          gltf: {loadBuffers: true, loadImages: true}
        })
      )
    );
    for (const tile of tiles) {
      const primitive = tile.gltf.meshes[0].primitives[0];
      expect(Array.from(primitive.attributes.POSITION.value)).toEqual(Array.from(POSITIONS));
      expect(primitive.material).toBe(tile.gltf.materials[0]);
      expect(tile.gltf.textures[0].source).toBe(tile.gltf.images[0]);
      const image = tile.gltf.images[0].image;
      expect([image.width, image.height]).toEqual([2, 2]);
      image.close();
      if (format === 'i3dm') expect(tile.instances).toHaveLength(1);
    }
    expect(fetchedUrls.filter(url => url.endsWith('checker.png'))).toHaveLength(3);
    expect(fetchedUrls.filter(url => url.endsWith('positions.bin'))).toHaveLength(
      format === 'gltf' ? 3 : 0
    );
    expect(glbPreload).not.toHaveBeenCalled();
    expect(gltfPreload).not.toHaveBeenCalled();
  } finally {
    glbPreload.mockRestore();
    gltfPreload.mockRestore();
  }
});

/** Create a small textured triangle with external JSON buffers or embedded GLB buffers. */
function createTilePayload(format: 'glb' | 'gltf' | 'b3dm' | 'i3dm'): ArrayBuffer {
  const json = {
    asset: {version: '2.0'},
    buffers: [
      {byteLength: POSITIONS.byteLength, ...(format === 'gltf' ? {uri: 'positions.bin'} : {})}
    ],
    bufferViews: [{buffer: 0, byteOffset: 0, byteLength: POSITIONS.byteLength}],
    accessors: [{bufferView: 0, componentType: 5126, count: 3, type: 'VEC3'}],
    images: [{uri: 'textures/checker.png', mimeType: 'image/png'}],
    textures: [{source: 0}],
    materials: [{pbrMetallicRoughness: {baseColorTexture: {index: 0}}}],
    meshes: [{primitives: [{attributes: {POSITION: 0}, material: 0}]}],
    nodes: [{mesh: 0}],
    scenes: [{nodes: [0]}],
    scene: 0
  };
  if (format === 'gltf') return new TextEncoder().encode(JSON.stringify(json)).buffer;
  const binary = GLBWriter.encodeSync({json, buffers: [{arrayBuffer: POSITIONS.buffer}]});
  return format === 'glb' ? binary : wrapLegacyTile(format, binary);
}

/** Wrap a GLB in a v1 legacy tile with an aligned feature table and one i3dm instance. */
function wrapLegacyTile(format: 'b3dm' | 'i3dm', binary: ArrayBuffer): ArrayBuffer {
  const headerLength = format === 'b3dm' ? 28 : 32;
  const featureTable = JSON.stringify(
    format === 'b3dm' ? {BATCH_LENGTH: 0} : {INSTANCES_LENGTH: 1, POSITION: [0, 0, 0]}
  );
  const featureTableLength = Math.ceil((headerLength + featureTable.length) / 8) * 8 - headerLength;
  const payload = new Uint8Array(headerLength + featureTableLength + binary.byteLength);
  payload.set(new TextEncoder().encode(format));
  const header = new DataView(payload.buffer);
  header.setUint32(4, 1, true);
  header.setUint32(8, payload.byteLength, true);
  header.setUint32(12, featureTableLength, true);
  if (format === 'i3dm') header.setUint32(28, 1, true);
  payload.set(new TextEncoder().encode(featureTable.padEnd(featureTableLength)), headerLength);
  payload.set(new Uint8Array(binary), headerLength + featureTableLength);
  return payload.buffer;
}
