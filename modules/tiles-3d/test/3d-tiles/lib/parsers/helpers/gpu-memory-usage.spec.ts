// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {coreApi, load} from '@loaders.gl/core';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles-3d';
import {GLTFLoader, _getMemoryUsageGLTF, postProcessGLTF} from '@loaders.gl/gltf';
import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';
const GLB_URL = '@loaders.gl/tiles-3d/3d-tiles/test/data/143.glb';
test('3D Tiles#getMemoryUsageGLTF', async () => {
  const gltfWithBuffers = await load(GLB_URL, GLTFLoader, {worker: false});
  const data = gltfWithBuffers;
  expect(data, 'GLTFLoader returned parsed data').toBeTruthy();
  // Raw estimates count decoded Draco arrays rather than the compressed source buffer view.
  expect(data.json.extensionsRemoved).toContain('KHR_draco_mesh_compression');
  expect(_getMemoryUsageGLTF(data), 'decoded GPU storage computed').toBe(3389445);
  expect(_getMemoryUsageGLTF(postProcessGLTF(data)), 'legacy estimate stays compatible').toBe(
    2884442
  );
});
const TEST_CASES = [
  {
    url: '@loaders.gl/tiles-3d/3d-tiles/test/data/CesiumJS/Tilesets/Tileset/tileset.json',
    type: 'scenegraph',
    gpuMemoryUsageInBytes: 7440
  },
  {
    url: '@loaders.gl/tiles-3d/3d-tiles/test/data/CesiumJS/Tilesets/TilesetPoints/tileset.json',
    type: 'pointcloud',
    gpuMemoryUsageInBytes: 15108
  },
  {
    url: '@loaders.gl/tiles-3d/3d-tiles/test/data/CesiumJS/Tilesets/TilesetEmptyRoot/tileset.json',
    type: 'empty',
    gpuMemoryUsageInBytes: 0
  }
];
test('3D Tiles#computes tile GPU memory usage', async () => {
  for (const {url, type, gpuMemoryUsageInBytes} of TEST_CASES) {
    const tilesetJson = await load(url, Tiles3DLoader);
    const tileset = new Tileset3D(new Tiles3DSource({...tilesetJson, coreApi}));
    // @ts-ignore
    tileset.root._visible = true;
    await tileset.root?.loadContent();
    const tile = tileset.root;
    expect(tile, 'Root tile is loaded').toBeTruthy();
    expect(tile?.type, 'Tile has correct type').toBe(type);
    expect(tile?.gpuMemoryUsageInBytes, 'Tile GPU memory usage computed').toBe(
      gpuMemoryUsageInBytes
    );
  }
});
