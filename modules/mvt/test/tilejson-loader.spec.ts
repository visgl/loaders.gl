import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {load} from '@loaders.gl/core';
import {TileJSONLoader} from '@loaders.gl/mvt';

import {TILEJSONS} from './data/tilejson/tilejson';

test('TileJSONLoader#loader conformance', (t) => {
  validateLoader(t, TileJSONLoader, 'TileJSONLoader');
  t.end();
});

test.only('TileJSONLoader#load', async (t) => {
  for (const tileJSON of TILEJSONS) {
    const metadata = await load(tileJSON.url, TileJSONLoader);
    t.ok(metadata.layers);
    // TODO - actually check results, add tilejsons with fields
    // t.deepEqual(metadata, parsedMetadata);
    // console.error(JSON.stringify(metadata, null, 2));
  }
  t.end();
});
