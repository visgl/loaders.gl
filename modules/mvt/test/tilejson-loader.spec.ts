// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {load, JSONLoader} from '@loaders.gl/core';
import {TileJSONLoader} from '@loaders.gl/mvt';

import {TILEJSONS} from './data/tilejson/tilejson';

const TIPPECANOE_TILEJSON = '@loaders.gl/mvt/test/data/tilejson/tippecanoe.tilejson';
const TIPPECANOE_EXPECTED = '@loaders.gl/mvt/test/data/tilejson/tippecanoe.expected.json';

test('TileJSONLoader#loader conformance', (t) => {
  validateLoader(t, TileJSONLoader, 'TileJSONLoader');
  t.end();
});

test('TileJSONLoader#load', async (t) => {
  for (const tileJSON of TILEJSONS) {
    const metadata = await load(tileJSON.url, TileJSONLoader);
    t.ok(metadata.layers);
    // TODO - actually check results, add tilejsons with fields
    // t.deepEqual(metadata, parsedMetadata);
    // console.error(JSON.stringify(metadata, null, 2));
  }
  t.end();
});

test.only('TileJSONLoader#tippecanoe', async (t) => {
  // let metadata = await load(TIPPECANOE_TILEJSON, TileJSONLoader);
  // const expected = await load(TIPPECANOE_EXPECTED, JSONLoader);
  // t.deepEqual(metadata, expected, 'Tippecanoe TileJSON loaded correctly');

  let metadata = await load(TIPPECANOE_TILEJSON, TileJSONLoader);
  t.equal(metadata.layers[0].fields[10].values.length, 100, '100 unique values');

  metadata = await load(TIPPECANOE_TILEJSON, TileJSONLoader, {tilejson: {maxValues: 10}});
  t.equal(metadata.layers[0].fields[10].values.length, 10, 'maxValue clips unique values');

  t.end();
});
