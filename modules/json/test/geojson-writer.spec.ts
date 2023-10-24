// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

/* global TextDecoder */
import test from 'tape-promise/tape';

import {_GeoJSONWriter} from '@loaders.gl/json';
import {encodeTableAsText, encodeTableInBatches} from '@loaders.gl/core';
import {tableWithNullGeometryColumn} from '@loaders.gl/schema/test/shared-utils';

const EXPECTED_GEOJSON = `\
{
"type": "FeatureCollection",
"features":
[
{"type":"Feature","geometry":{"type":"Point","coordinates":[[0,0],[1,1]]},"properties":{"population":100,"growing":true,"city":"tableville"}},
{"type":"Feature","geometry":{"type":"Point","coordinates":[[2,2],[3,3]]},"properties":{"population":200,"growing":false,"city":"row city"}},
{"type":"Feature","geometry":null,"properties":{"population":0,"growing":false,"city":"nulltown"}}
]
}`;

test('GeoJSONWriter#encode', async (t) => {
  const table = tableWithNullGeometryColumn;
  const encodedText = await encodeTableAsText(table, _GeoJSONWriter);
  t.equal(encodedText, EXPECTED_GEOJSON, 'GeoJSONWriter encoded table correctly');
  t.end();
});

test('GeoJSONWriter#encodeTableInBatches', async (t) => {
  const textDecoder = new TextDecoder();
  const table = tableWithNullGeometryColumn;
  const encodedBatches = encodeTableInBatches(table, _GeoJSONWriter);
  let geojsonText = '';
  for await (const arrayBuffer of encodedBatches) {
    geojsonText += textDecoder.decode(arrayBuffer);
  }
  t.equal(geojsonText, EXPECTED_GEOJSON, 'GeoJSONWriter encoded table correctly');
  t.end();
});
