// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {parse, fetchFile, registerLoaders} from '@loaders.gl/core';
// import {Tile3DLoader} from '@loaders.gl/3d-tiles';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoLoader} from '@loaders.gl/draco';

registerLoaders([DracoLoader]);

const TILE_B3DM_WITH_DRACO_URL = '@loaders.gl/3d-tiles/test/data/143.b3dm';

test('GLTFLoader#Draco embedded offset corner case', async t => {
  let response = await fetchFile(TILE_B3DM_WITH_DRACO_URL);
  let tile = await parse(response, GLTFLoader, {gltf: {parserVersion: 1}});
  t.ok(tile);

  response = await fetchFile(TILE_B3DM_WITH_DRACO_URL);
  tile = await parse(response, GLTFLoader, {gltf: {parserVersion: 2}});
  t.ok(tile);
  t.end();
});
