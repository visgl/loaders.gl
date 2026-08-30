import {expect, test} from 'vitest';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {load} from '@loaders.gl/core';
import {
  loadNestedTileset,
  loadTile3DContent
} from '../../../src/i3s-converter/helpers/load-3d-tiles';
const TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedColors/tileset.json';
const NESTED_TILESET_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset.json';
test('tile-converter(i3s)#loadNestedTileset', async () => {
  const simpleTileset = await load(TILESET_URL, Tiles3DLoader, {});
  await loadNestedTileset(simpleTileset, simpleTileset.root, {});
  expect(simpleTileset.root.children.length).toBe(0);
  const nestedTileset = await load(NESTED_TILESET_URL, Tiles3DLoader, {});
  expect(nestedTileset.root.children.length).toBe(0);
  await loadNestedTileset(nestedTileset, nestedTileset.root, {});
  expect(nestedTileset.root.children.length).toBe(1);
});
test('tile-converter(i3s)#loadTile3DContent', async () => {
  const simpleTileset = await load(TILESET_URL, Tiles3DLoader, {});
  const content = await loadTile3DContent(simpleTileset, simpleTileset.root, {});
  expect(content?.gltf).toBeTruthy();
  const bufferContent = await loadTile3DContent(simpleTileset, simpleTileset.root, {
    ['3d-tiles']: {loadGLTF: false}
  });
  expect(bufferContent?.gltf).toBeFalsy();
  expect(bufferContent?.gltfArrayBuffer).toBeTruthy();
  const nestedTileset = await load(NESTED_TILESET_URL, Tiles3DLoader, {});
  const nestetContent = await loadTile3DContent(nestedTileset, nestedTileset.root, {});
  expect(nestetContent).toBeFalsy();
});
