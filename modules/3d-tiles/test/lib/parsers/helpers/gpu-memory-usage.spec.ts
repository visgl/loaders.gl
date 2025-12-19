// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {GLTFLoader, _getMemoryUsageGLTF, postProcessGLTF} from '@loaders.gl/gltf';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';

const GLB_URL = '@loaders.gl/3d-tiles/test/data/143.glb';
test('3D Tiles#getMemoryUsageGLTF', async (t) => {
  const gltfWithBuffers = await load(GLB_URL, GLTFLoader);
  const data = postProcessGLTF(gltfWithBuffers);
  t.ok(data, 'GLTFLoader returned parsed data');
  t.equal(_getMemoryUsageGLTF(data), 2884442, 'GLTF memory usage computed');
  t.end();
});

const TEST_CASES = [
  {
    url: '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/Tileset/tileset.json',
    type: 'scenegraph',
    gpuMemoryUsageInBytes: 7440
  },
  {
    url: '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetPoints/tileset.json',
    type: 'pointcloud',
    gpuMemoryUsageInBytes: 15108
  },
  {
    url: '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetEmptyRoot/tileset.json',
    type: 'empty',
    gpuMemoryUsageInBytes: 0
  }
];

test('3D Tiles#computes tile GPU memory usage', async (t) => {
  for (const {url, type, gpuMemoryUsageInBytes} of TEST_CASES) {
    const tilesetJson = await load(url, Tiles3DLoader);
    const tileset = new Tileset3D(tilesetJson);
    // @ts-ignore
    tileset.root._visible = true;
    await tileset.root?.loadContent();

    const tile = tileset.root;
    t.ok(tile, 'Root tile is loaded');
    t.equals(tile?.type, type, 'Tile has correct type');
    t.equals(tile?.gpuMemoryUsageInBytes, gpuMemoryUsageInBytes, 'Tile GPU memory usage computed');
  }
  t.end();
});
