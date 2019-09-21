// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/*
import test from 'tape-promise/tape';
import {parse, fetchFile, registerLoaders} from '@loaders.gl/core';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';
import {DracoLoader} from '@loaders.gl/draco';

registerLoaders([DracoLoader]);

const TILE_B3DM_WITH_DRACO_URL = '@loaders.gl/3d-tiles/test/data/143.b3dm';

test('Tile3DLoader#Draco embedded offset corner case', async t => {
  const response = await fetchFile(TILE_B3DM_WITH_DRACO_URL);
  const tile = await parse(response, Tile3DLoader, {gltf: {parserVersion: 1}, DracoLoader, decompress: true});
  t.ok(tile);

  const response2 = await fetchFile(TILE_B3DM_WITH_DRACO_URL);
  const tile2 = await parse(response2, Tile3DLoader, {gltf: {parserVersion: 2}});
  t.ok(tile2);
  t.end();
});
*/
