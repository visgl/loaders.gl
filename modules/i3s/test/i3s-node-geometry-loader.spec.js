// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import test from 'tape-promise/tape';
import {parse, fetchFile} from '@loaders.gl/core';
import {I3STileLoader} from '@loaders.gl/i3s';
import {DracoLoader} from '@loaders.gl/draco';

const TILE_WITH_DRACO_URL = '@loaders.gl/i3s/test/data/...';

test('I3STileLoader#Tile with GLB w/ Draco bufferviews', async t => {
  const response = await fetchFile(TILE_WITH_DRACO_URL);
  const tile = await parse(response, [I3STileLoader, DracoLoader]);
  t.ok(tile);
  t.end();
});
