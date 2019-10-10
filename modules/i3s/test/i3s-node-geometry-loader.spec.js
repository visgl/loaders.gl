import test from 'tape-promise/tape';
import {parse, fetchFile} from '@loaders.gl/core';
import {I3SNodeGeometryLoader} from '@loaders.gl/i3s';
import {DracoLoader} from '@loaders.gl/draco';

const TILE_WITH_DRACO_URL = '@loaders.gl/i3s/test/data/...';

test('I3SNodeGeometryLoader#Tile with GLB w/ Draco bufferviews', async t => {
  const response = await fetchFile(TILE_WITH_DRACO_URL);
  const tile = await parse(response, [I3SNodeGeometryLoader, DracoLoader]);
  t.ok(tile);
  t.end();
});
