// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {parse, preload} from '@loaders.gl/core';
import {GLBLoader, GLBWriter, GLTFLoader} from '@loaders.gl/gltf';
import {Tiles3DLoader} from '../src/tiles-3d-loader';

/** Creates a tiny legacy tile around the same GLB used by the modern content case. */
function createBatchedTile(binary: ArrayBuffer): ArrayBuffer {
  const featureTable = new TextEncoder().encode('{"BATCH_LENGTH":0}   ');
  const featureTableLength = Math.ceil((28 + featureTable.length) / 8) * 8 - 28;
  const tile = new ArrayBuffer(28 + featureTableLength + binary.byteLength);
  const bytes = new Uint8Array(tile);
  bytes.set(new TextEncoder().encode('b3dm'));
  const header = new DataView(tile);
  header.setUint32(4, 1, true);
  header.setUint32(8, tile.byteLength, true);
  header.setUint32(12, featureTableLength, true);
  bytes.fill(32, 28, 28 + featureTableLength);
  bytes.set(featureTable, 28);
  bytes.set(new Uint8Array(binary), 28 + featureTableLength);
  return tile;
}

test('prepares GLB, JSON glTF and legacy tile dependencies before a content burst', async () => {
  const json = {
    asset: {version: '2.0', generator: 'subloader-test'},
    scenes: [{nodes: []}],
    scene: 0,
    buffers: [{byteLength: 4, uri: 'data:application/octet-stream;base64,AAAAAA=='}]
  };
  const binary = GLBWriter.encodeSync({json});
  const prepared = await preload(Tiles3DLoader);
  const gltfPreload = vi
    .spyOn(GLTFLoader, 'preload')
    .mockRejectedValue(new Error('late glTF import'));
  const glbPreload = vi.spyOn(GLBLoader, 'preload').mockRejectedValue(new Error('late GLB import'));
  try {
    const tiles = await Promise.all(
      [
        binary,
        new TextEncoder().encode(JSON.stringify(json)).buffer,
        createBatchedTile(binary)
      ].map(data => parse(data, prepared, {core: {worker: false}}))
    );
    for (const tile of tiles) {
      expect(tile.shape).toBe('tile3d');
      expect(tile.gltf.asset.generator).toBe('subloader-test');
      expect(tile.gltf.buffers[0].arrayBuffer.byteLength).toBe(4);
    }
    expect(gltfPreload).not.toHaveBeenCalled();
    expect(glbPreload).not.toHaveBeenCalled();
  } finally {
    gltfPreload.mockRestore();
    glbPreload.mockRestore();
  }
});

test('uses a caller-specific glTF override with forwarded glTF options', async () => {
  const implementation = await preload(GLTFLoader);
  const parseGltf = vi.fn(implementation.parse);
  const custom = {...implementation, parse: parseGltf};
  const prepared = await preload(Tiles3DLoader, {
    '3d-tiles': {subloaders: {GLTFLoader: custom}},
    gltf: {loadImages: false}
  });
  const json = {asset: {version: '2.0'}, scenes: [{nodes: []}], scene: 0};
  const tile = await parse(new TextEncoder().encode(JSON.stringify(json)).buffer, prepared);
  expect(tile.shape).toBe('tile3d');
  expect(parseGltf).toHaveBeenCalledTimes(1);
  expect(parseGltf.mock.calls[0][1]?.gltf?.loadImages).toBe(false);
  expect(Tiles3DLoader.subloaders.GLTFLoader).toBe(GLTFLoader);
});
