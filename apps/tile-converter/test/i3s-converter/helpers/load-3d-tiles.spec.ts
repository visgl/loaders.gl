import test from 'tape-promise/tape';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {load} from '@loaders.gl/core';
import {
  loadNestedTileset,
  loadTile3DContent
} from '../../../src/i3s-converter/helpers/load-3d-tiles';

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Batched/BatchedColors/tileset.json';
const NESTED_TILESET_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset.json';

test('tile-converter(i3s)#loadNestedTileset', async (t) => {
  const simpleTileset = await load(TILESET_URL, Tiles3DLoader, {});
  await loadNestedTileset(simpleTileset, simpleTileset.root, {});
  t.equal(simpleTileset.root.children.length, 0);

  const nestedTileset = await load(NESTED_TILESET_URL, Tiles3DLoader, {});
  t.equal(nestedTileset.root.children.length, 0);
  await loadNestedTileset(nestedTileset, nestedTileset.root, {});
  t.equal(nestedTileset.root.children.length, 1);
});

test('tile-converter(i3s)#loadTile3DContent', async (t) => {
  const simpleTileset = await load(TILESET_URL, Tiles3DLoader, {});
  const content = await loadTile3DContent(simpleTileset, simpleTileset.root, {});
  t.ok(content?.gltf);

  const bufferContent = await loadTile3DContent(simpleTileset, simpleTileset.root, {
    ['3d-tiles']: {loadGLTF: false}
  });
  t.notOk(bufferContent?.gltf);
  t.ok(bufferContent?.gltfArrayBuffer);

  const nestedTileset = await load(NESTED_TILESET_URL, Tiles3DLoader, {});
  const nestetContent = await loadTile3DContent(nestedTileset, nestedTileset.root, {});
  t.notOk(nestetContent);
});
