// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {load} from '@loaders.gl/core';
import {JSONLoader} from '@loaders.gl/json';
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

test('TileJSONLoader#tippecanoe', async (t) => {
  let metadata = await load(TIPPECANOE_TILEJSON, TileJSONLoader);
  const expected = await load(TIPPECANOE_EXPECTED, JSONLoader);
  t.deepEqual(metadata, expected, 'Tippecanoe TileJSON loaded correctly');

  const fields = metadata.layers?.[0]?.fields || [];
  const indexedFieldNames = fields.filter((field) => field.name.includes('|'));
  t.equal(indexedFieldNames.length, 0, 'Indexed tilestats attributes are skipped');
  t.equal(metadata.layers?.[0]?.minZoom, 0, 'Vector layer minZoom is merged');
  t.equal(metadata.layers?.[0]?.dominantGeometry, 'LineString', 'Tilestats geometry is merged');

  const attributesField = fields.find((field) => field.name === 'rwdb_rr_id');
  t.equal(attributesField?.values?.length, 100, '100 unique values');

  metadata = await load(TIPPECANOE_TILEJSON, TileJSONLoader, {tilejson: {maxValues: 10}});
  const limitedField = metadata.layers?.[0]?.fields?.find((field) => field.name === 'rwdb_rr_id');
  t.equal(limitedField?.values?.length, 10, 'maxValue clips unique values');
  t.deepEqual(
    limitedField?.values,
    attributesField?.values?.slice(0, 10),
    'maxValue truncates values'
  );

  t.end();
});
