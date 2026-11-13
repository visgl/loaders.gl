// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {JSONWriter} from '@loaders.gl/tables/json/index';
import {GeoJSONLoader as BundledGeoJSONLoader} from '@loaders.gl/tables/json/bundled';
import {encodeTableAsText} from '@loaders.gl/core';
import {convertTableToArrow} from '@loaders.gl/core/schema-utils';
import {emptyTable, tableWithData} from '@loaders.gl/core/schema-utils/test/shared-utils';
test('JSONWriter#encodeTableAsText - empty table', async () => {
  const encodedText = await encodeTableAsText(emptyTable, JSONWriter);
  expect(encodedText, 'got expected output').toBe('[]');
});
test('JSONWriter#encodeTableAsText - data table, row objects', async () => {
  const encodedText = await encodeTableAsText(tableWithData, JSONWriter);
  expect(encodedText, 'got expected output').toBe(
    '[{"id":"a","val":1,"lat":10.1,"lng":-10.1},{"id":"b","val":2,"lat":20.2,"lng":-20.2},{"id":"c","val":3,"lat":30.3,"lng":-30.3}]'
  );
});
test('JSONWriter#encodeTableAsText - data table, row objects (explicit)', async () => {
  const encodedText = await encodeTableAsText(tableWithData, JSONWriter, {
    json: {shape: 'object-row-table'}
  });
  expect(encodedText, 'got expected output').toBe(
    '[{"id":"a","val":1,"lat":10.1,"lng":-10.1},{"id":"b","val":2,"lat":20.2,"lng":-20.2},{"id":"c","val":3,"lat":30.3,"lng":-30.3}]'
  );
});
test('JSONWriter#encodeTableAsText - data table, row arrays', async () => {
  const encodedText = await encodeTableAsText(tableWithData, JSONWriter, {
    json: {shape: 'array-row-table'}
  });
  expect(encodedText, 'got expected output').toBe(
    '[["a",1,10.1,-10.1],["b",2,20.2,-20.2],["c",3,30.3,-30.3]]'
  );
});
test('JSONWriter#encodeTableAsText - arrow table input, row objects', async () => {
  const arrowTable = convertTableToArrow(tableWithData);
  const encodedText = await encodeTableAsText(arrowTable, JSONWriter);
  expect(encodedText, 'got expected output').toBe(
    '[{"id":"a","val":1,"lat":10.1,"lng":-10.1},{"id":"b","val":2,"lat":20.2,"lng":-20.2},{"id":"c","val":3,"lat":30.3,"lng":-30.3}]'
  );
});
test('JSONWriter writes native Arrow as row arrays when requested', async () => {
  const table = convertTableToArrow(tableWithData);
  const text = await encodeTableAsText(table, JSONWriter, {json: {shape: 'array-row-table'}});
  expect(JSON.parse(text)).toEqual([
    ['a', 1, 10.1, -10.1],
    ['b', 2, 20.2, -20.2],
    ['c', 3, 30.3, -30.3]
  ]);
});
test('JSONWriter#encodeTableAsText - GeoArrow WKB arrow table input', async () => {
  const result = BundledGeoJSONLoader.parseTextSync?.(
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [1, 2]},
          properties: {name: 'A'}
        }
      ]
    }),
    {
      geojson: {shape: 'arrow'}
    }
  );
  if ('shape' in result) throw new Error('Expected Arrow output');
  const encodedText = await encodeTableAsText(result, JSONWriter);
  expect(encodedText, 'got expected GeoJSON geometry output').toBe(
    '[{"name":"A","geometry":{"type":"Point","coordinates":[1,2]}}]'
  );
});
test('JSONWriter#encodeTableAsText - GeoArrow WKB decoding can be disabled', async () => {
  const result = BundledGeoJSONLoader.parseTextSync?.(
    JSON.stringify([
      {
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [1, 2]},
        properties: {name: 'A'}
      }
    ]),
    {
      geojson: {shape: 'arrow'}
    }
  );
  if ('shape' in result) throw new Error('Expected Arrow output');
  const encodedText = await encodeTableAsText(result, JSONWriter, {
    json: {geoarrow: 'none'}
  });
  expect(encodedText.includes('"name":"A"'), 'preserves non-geometry columns').toBeTruthy();
  expect(encodedText.includes('"geometry"'), 'preserves raw geometry column').toBeTruthy();
  expect(
    encodedText.includes('"type":"Point"'),
    'does not decode WKB to GeoJSON geometry'
  ).toBeFalsy();
});
test.skip('JSONWriter#encodeTableAsText - data table, wrapper', async () => {
  const encodedText = await encodeTableAsText(tableWithData, JSONWriter, {
    json: {shape: 'array-row-table', wrapper: table => ({wrapped: true, table})}
  });
  expect(encodedText, 'got expected output').toBe(
    '{"wrapped":true,"table":[["a",1,10.1,-10.1],["b",2,20.2,-20.2],["c",3,30.3,-30.3]]}'
  );
});
