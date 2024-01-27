// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
// import type {TileJSON} from '@loaders.gl/mvt';
import {TileJSONLoader, getSchemasFromTileJSON} from '@loaders.gl/mvt';

import {TILEJSONS_WITH_TILESTATS} from '../data/tilejson/tilejson';

// const TIPPECANOE_TILEJSON = '@loaders.gl/mvt/test/data/tilejson/tippecanoe.tilejson';
// const TIPPECANOE_EXPECTED = '@loaders.gl/mvt/test/data/tilejson/tippecanoe.expected.json';

test('getSchemasFromTileJSON#tilejson', async (t) => {
  for (const tileJSON of TILEJSONS_WITH_TILESTATS) {
    const metadata = await load(tileJSON.url, TileJSONLoader);
    const schemas = getSchemasFromTileJSON(metadata);
    t.ok(schemas);
    console.warn(JSON.stringify(schemas, null, 2));
    // TODO - actually check results, add tilejsons with fields
    // t.deepEqual(metadata, parsedMetadata);
    // console.error(JSON.stringify(metadata, null, 2));
  }
  t.end();
});
