// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import test from 'tape-promise/tape';

import {GeoJSONLoader, JSONWriter} from '@loaders.gl/json';
import {encodeTableAsText} from '@loaders.gl/core';
import {convertTableToArrow} from '@loaders.gl/schema-utils';
import {emptyTable, tableWithData} from '@loaders.gl/schema-utils/test/shared-utils';

test('JSONWriter#encodeTableAsText - empty table', async t => {
  const encodedText = await encodeTableAsText(emptyTable, JSONWriter);
  t.equal(encodedText, '[]', 'got expected output');

  t.end();
});

test('JSONWriter#encodeTableAsText - data table, row objects', async t => {
  const encodedText = await encodeTableAsText(tableWithData, JSONWriter);
  t.equal(
    encodedText,
    '[{"id":"a","val":1,"lat":10.1,"lng":-10.1},{"id":"b","val":2,"lat":20.2,"lng":-20.2},{"id":"c","val":3,"lat":30.3,"lng":-30.3}]',
    'got expected output'
  );

  t.end();
});

test('JSONWriter#encodeTableAsText - data table, row objects (explicit)', async t => {
  const encodedText = await encodeTableAsText(tableWithData, JSONWriter, {
    json: {shape: 'object-row-table'}
  });
  t.equal(
    encodedText,
    '[{"id":"a","val":1,"lat":10.1,"lng":-10.1},{"id":"b","val":2,"lat":20.2,"lng":-20.2},{"id":"c","val":3,"lat":30.3,"lng":-30.3}]',
    'got expected output'
  );

  t.end();
});

test('JSONWriter#encodeTableAsText - data table, row arrays', async t => {
  const encodedText = await encodeTableAsText(tableWithData, JSONWriter, {
    json: {shape: 'array-row-table'}
  });
  t.equal(
    encodedText,
    '[["a",1,10.1,-10.1],["b",2,20.2,-20.2],["c",3,30.3,-30.3]]',
    'got expected output'
  );

  t.end();
});

test('JSONWriter#encodeTableAsText - arrow table input, row objects', async t => {
  const arrowTable = {
    shape: 'arrow-table' as const,
    schema: tableWithData.schema,
    data: convertTableToArrow(tableWithData)
  };

  const encodedText = await encodeTableAsText(arrowTable, JSONWriter);
  t.equal(
    encodedText,
    '[{"id":"a","val":1,"lat":10.1,"lng":-10.1},{"id":"b","val":2,"lat":20.2,"lng":-20.2},{"id":"c","val":3,"lat":30.3,"lng":-30.3}]',
    'got expected output'
  );

  t.end();
});

test('JSONWriter#encodeTableAsText - arrow table input, explicit arrow shape', async t => {
  const arrowTable = {
    shape: 'arrow-table' as const,
    schema: tableWithData.schema,
    data: convertTableToArrow(tableWithData)
  };

  const encodedText = await encodeTableAsText(arrowTable, JSONWriter, {
    json: {shape: 'arrow-table'}
  });
  t.equal(
    encodedText,
    '[{"id":"a","val":1,"lat":10.1,"lng":-10.1},{"id":"b","val":2,"lat":20.2,"lng":-20.2},{"id":"c","val":3,"lat":30.3,"lng":-30.3}]',
    'got expected output'
  );

  t.end();
});

test('JSONWriter#encodeTableAsText - GeoArrow WKB arrow table input', async t => {
  const arrowTable = GeoJSONLoader.parseTextSync?.(
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
      geojson: {shape: 'arrow-table'}
    }
  );

  const encodedText = await encodeTableAsText(arrowTable, JSONWriter);
  t.equal(
    encodedText,
    '[{"name":"A","geometry":{"type":"Point","coordinates":[1,2]}}]',
    'got expected GeoJSON geometry output'
  );

  t.end();
});

test('JSONWriter#encodeTableAsText - GeoArrow WKB decoding can be disabled', async t => {
  const arrowTable = GeoJSONLoader.parseTextSync?.(
    JSON.stringify([
      {
        type: 'Feature',
        geometry: {type: 'Point', coordinates: [1, 2]},
        properties: {name: 'A'}
      }
    ]),
    {
      geojson: {shape: 'arrow-table'}
    }
  );

  const encodedText = await encodeTableAsText(arrowTable, JSONWriter, {
    json: {geoarrow: 'none'}
  });
  t.ok(encodedText.includes('"name":"A"'), 'preserves non-geometry columns');
  t.ok(encodedText.includes('"geometry"'), 'preserves raw geometry column');
  t.notOk(encodedText.includes('"type":"Point"'), 'does not decode WKB to GeoJSON geometry');

  t.end();
});

test.skip('JSONWriter#encodeTableAsText - data table, wrapper', async t => {
  const encodedText = await encodeTableAsText(tableWithData, JSONWriter, {
    json: {shape: 'array-row-table', wrapper: table => ({wrapped: true, table})}
  });
  t.equal(
    encodedText,
    '{"wrapped":true,"table":[["a",1,10.1,-10.1],["b",2,20.2,-20.2],["c",3,30.3,-30.3]]}',
    'got expected output'
  );

  t.end();
});
