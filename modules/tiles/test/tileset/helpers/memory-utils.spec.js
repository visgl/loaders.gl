import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {Tileset3D} from '@loaders.gl/tiles';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {getGltfMemoryUsage} from '../../../src/tileset/helpers/memory-utils';

const GLB_URL = '@loaders.gl/3d-tiles/test/data/143.glb';
test('Tileset3D#getGltfMemoryUsage', async (t) => {
  const data = await load(GLB_URL, GLTFLoader);
  t.ok(data, 'GLTFLoader returned parsed data');
  t.equal(getGltfMemoryUsage(data), 2192381, 'GLTF memory usage computed');
  t.end();
});

const TEST_CASES = [
  {
    url: '@loaders.gl/3d-tiles/test/data/Tilesets/Tileset/tileset.json',
    type: 'scenegraph',
    gpuMemoryUsageInBytes: 7440
  },
  {
    url: '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetPoints/tileset.json',
    type: 'pointcloud',
    gpuMemoryUsageInBytes: 15108
  },
  {
    url: '@loaders.gl/3d-tiles/test/data/Tilesets/TilesetEmptyRoot/tileset.json',
    type: 'empty',
    gpuMemoryUsageInBytes: 0
  }
];
test('Tileset3D#computes tiles gpu memory usage', async (t) => {
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
