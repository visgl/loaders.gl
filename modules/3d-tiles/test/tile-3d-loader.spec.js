// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {parse, fetchFile} from '@loaders.gl/core';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';
import {DracoLoader} from '@loaders.gl/draco';

const TILE_B3DM_WITH_DRACO_URL = '@loaders.gl/3d-tiles/test/data/143.b3dm';

test('Tile3DLoader#Tile with GLB w/ Draco bufferviews', async t => {
  let response = await fetchFile(TILE_B3DM_WITH_DRACO_URL);
  let tile = await parse(response, [Tile3DLoader, DracoLoader], {gltf: {parserVersion: 2}});
  t.ok(tile);

  // DEPRECATED
  response = await fetchFile(TILE_B3DM_WITH_DRACO_URL);
  tile = await parse(response, [Tile3DLoader, DracoLoader], {
    gltf: {parserVersion: 1, DracoLoader, decompress: true},
    DracoLoader
  });
  t.ok(tile);

  t.end();
});
