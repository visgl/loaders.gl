// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';

import {load} from '@loaders.gl/core';
import {TileJSONLoader} from '@loaders.gl/mvt';

import {TILEJSONS} from './data/tilejson/tilejson';

const TIPPECANOE_TILEJSON = '@loaders.gl/mvt/test/data/tilejson/tippecanoe.tilejson';
// const TIPPECANOE_EXPECTED = '@loaders.gl/mvt/test/data/tilejson/tippecanoe.expected.json';

test('TileJSONLoader#loader conformance', () => {
  validateLoader(t, TileJSONLoader, 'TileJSONLoader');
  
});

test('TileJSONLoader#load', async () => {
  for (const tileJSON of TILEJSONS) {
    const metadata = await load(tileJSON.url, TileJSONLoader);
    expect(metadata.layers).toBeTruthy();
    // TODO - actually check results, add tilejsons with fields
    // expect(metadata).toEqual(parsedMetadata);
    // console.error(JSON.stringify(metadata, null, 2));
  }
  
});

test('TileJSONLoader#tippecanoe', async () => {
  // let metadata = await load(TIPPECANOE_TILEJSON, TileJSONLoader);
  // const expected = await load(TIPPECANOE_EXPECTED, JSONLoader);
  // expect(metadata, 'Tippecanoe TileJSON loaded correctly').toEqual(expected);

  let metadata = await load(TIPPECANOE_TILEJSON, TileJSONLoader);
  expect(metadata.layers?.[0]?.fields?.[10]?.values?.length, '100 unique values').toBe(100);

  metadata = await load(TIPPECANOE_TILEJSON, TileJSONLoader, {tilejson: {maxValues: 10}});
  expect(metadata.layers?.[0]?.fields?.[10]?.values?.length, 'maxValue clips unique values').toBe(10);

  
});
