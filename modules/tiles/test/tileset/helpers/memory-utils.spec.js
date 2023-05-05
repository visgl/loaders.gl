import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {GLTFLoader} from '@loaders.gl/gltf';
import {Tileset3D} from '@loaders.gl/tiles';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';

import {getGltfMemoryUsage} from '../../../src/tileset/helpers/memory-utils';

const GLB_URL = '@loaders.gl/3d-tiles/test/data/143.glb';
test('Tiles#getGltfMemoryUsage', async (t) => {
  const data = await load(GLB_URL, GLTFLoader);
  t.ok(data, 'GLTFLoader returned parsed data');
  t.equal(getGltfMemoryUsage(data), 2192381, 'GLTF memory usage computed');
  t.end();
});

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/Tilesets/Tileset/tileset.json';
test('Tileset3D#loads tiles in tileset', async (t) => {
  const tilesetJson = await load(TILESET_URL, Tiles3DLoader);
  const tileset = new Tileset3D(tilesetJson);
  // @ts-ignore
  tileset.root._visible = true;
  await tileset.root?.loadContent();

  const tile = tileset.root;
  t.ok(tile);
  t.equals(tile.type, 'scenegraph', 'Correct tile type');
  t.equals(tile.gpuMemoryUsageInBytes, 7440, 'Tile GPU memory usage computed');
  t.end();
});
