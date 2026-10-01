// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLBLoader, GLBWriter, GLTFLoader} from '@loaders.gl/gltf';
import {Tiles3DLoaderWithParser} from '../src/tiles-3d-loader-with-parser';

// Once the 3D Tiles implementation is loaded, a burst of tile payloads must be
// decodable without returning to asynchronous module loading for each payload.
test.each([
  'glb',
  'gltf'
])('parses a burst of %s tiles without reopening parser imports', async format => {
  const json = {
    asset: {version: '2.0', generator: 'streaming-regression'},
    scenes: [{nodes: []}],
    scene: 0
  };
  const data =
    format === 'glb'
      ? GLBWriter.encodeSync({json})
      : new TextEncoder().encode(JSON.stringify(json)).buffer;
  const glbPreload = vi
    .spyOn(GLBLoader, 'preload')
    .mockRejectedValue(new Error('Unexpected late GLB import'));
  const gltfPreload = vi
    .spyOn(GLTFLoader, 'preload')
    .mockRejectedValue(new Error('Unexpected late glTF import'));
  try {
    const tiles = await Promise.all(
      Array.from({length: 3}, () =>
        parse(data.slice(0), Tiles3DLoaderWithParser, {core: {worker: false}})
      )
    );
    for (const tile of tiles) {
      expect(tile.shape).toBe('tile3d');
      expect(tile.gltf.asset.generator).toBe('streaming-regression');
      expect(tile.gltf.scenes).toHaveLength(1);
    }
    expect(glbPreload).not.toHaveBeenCalled();
    expect(gltfPreload).not.toHaveBeenCalled();
  } finally {
    glbPreload.mockRestore();
    gltfPreload.mockRestore();
  }
});
