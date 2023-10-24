// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc.

import test from 'tape-promise/tape';

import {JSONWriter} from '@loaders.gl/json';
import {encodeTableAsText} from '@loaders.gl/core';
import {emptyTable, tableWithData} from '@loaders.gl/schema/test/shared-utils';

test('JSONWriter#encodeTableAsText - empty table', async (t) => {
  const encodedText = await encodeTableAsText(emptyTable, JSONWriter);
  t.equal(encodedText, '[]', 'got expected output');

  t.end();
});

test('JSONWriter#encodeTableAsText - data table, row objects', async (t) => {
  const encodedText = await encodeTableAsText(tableWithData, JSONWriter);
  t.equal(
    encodedText,
    '[{"id":"a","val":1,"lat":10.1,"lng":-10.1},{"id":"b","val":2,"lat":20.2,"lng":-20.2},{"id":"c","val":3,"lat":30.3,"lng":-30.3}]',
    'got expected output'
  );

  t.end();
});

test('JSONWriter#encodeTableAsText - data table, row objects (explicit)', async (t) => {
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

test('JSONWriter#encodeTableAsText - data table, row arrays', async (t) => {
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

test.skip('JSONWriter#encodeTableAsText - data table, wrapper', async (t) => {
  const encodedText = await encodeTableAsText(tableWithData, JSONWriter, {
    json: {shape: 'array-row-table', wrapper: (table) => ({wrapped: true, table})}
  });
  t.equal(
    encodedText,
    '{"wrapped":true,"table":[["a",1,10.1,-10.1],["b",2,20.2,-20.2],["c",3,30.3,-30.3]]}',
    'got expected output'
  );

  t.end();
});
