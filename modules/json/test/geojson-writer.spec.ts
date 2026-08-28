// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GeoJSONWriter} from '@loaders.gl/json';
import {encodeTableAsText, encodeTableInBatches} from '@loaders.gl/core';
import {tableWithNullGeometryColumn} from '@loaders.gl/schema-utils/test/shared-utils';
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
test('GeoJSONWriter#encode', async () => {
  const table = tableWithNullGeometryColumn;
  const encodedText = await encodeTableAsText(table, GeoJSONWriter);
  expect(encodedText, 'GeoJSONWriter encoded table correctly').toBe(EXPECTED_GEOJSON);
});
test('GeoJSONWriter#encodeTableInBatches', async () => {
  const textDecoder = new TextDecoder();
  const table = tableWithNullGeometryColumn;
  const encodedBatches = encodeTableInBatches(table, GeoJSONWriter);
  let geojsonText = '';
  for await (const arrayBuffer of encodedBatches) {
    geojsonText += textDecoder.decode(arrayBuffer);
  }
  expect(geojsonText, 'GeoJSONWriter encoded table correctly').toBe(EXPECTED_GEOJSON);
});
