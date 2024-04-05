import test from 'tape-promise/tape';
import {Tiles3DLoader, Tiles3DTileJSONPostprocessed} from '@loaders.gl/3d-tiles';
import {load} from '@loaders.gl/core';
import {traverseDatasetWith} from '../../../src/i3s-converter/helpers/tileset-traversal';
import {loadNestedTileset} from '../../../src/i3s-converter/helpers/load-3d-tiles';

const NESTED_TILESET_URL =
  '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/TilesetOfTilesets/tileset.json';

test('tile-converter(i3s)#traverseDatasetWith', async (t) => {
  const nestedTileset = await load(NESTED_TILESET_URL, Tiles3DLoader, {});
  const AUTH_TOKEN = 'AUTH_TOKEN';
  const processTileCallback = async (
    tile: Tiles3DTileJSONPostprocessed,
    props: {token: string}
  ): Promise<{token: string}> => {
    if (tile.type === 'json') {
      await loadNestedTileset(nestedTileset, tile, {});
      return {token: props.token};
    }
    t.ok(tile);
    t.equal(props.token, AUTH_TOKEN);
    return {token: props.token};
  };
  const postprocessTileCallback = async (processResults, traversalProps) => {
    t.equal(traversalProps.token, AUTH_TOKEN);
    for (const result of processResults) {
      t.equal(result.token, AUTH_TOKEN);
    }
  };
  await traverseDatasetWith({
    tile: nestedTileset.root,
    traversalProps: {token: AUTH_TOKEN},
    processTile: processTileCallback,
    postprocessTile: postprocessTileCallback
  });
  t.end();
});

test('tile-converter(i3s)#traverseDatasetWith - maxDepth', async (t) => {
  const nestedTileset = await load(NESTED_TILESET_URL, Tiles3DLoader, {});
  let processCalls = 0;
  const processTileCallback = async (tile: Tiles3DTileJSONPostprocessed): Promise<undefined> => {
    if (tile.type === 'json') {
      await loadNestedTileset(nestedTileset, tile, {});
      return;
    }
    processCalls++;
  };
  await traverseDatasetWith({
    tile: nestedTileset.root,
    traversalProps: undefined,
    processTile: processTileCallback
  });
  t.equal(processCalls, 5);

  processCalls = 0;
  await traverseDatasetWith({
    tile: nestedTileset.root,
    traversalProps: undefined,
    processTile: processTileCallback,
    maxDepth: 2
  });
  t.equal(processCalls, 4);
  t.end();
});
