// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Schema, Field, Utf8, Binary} from 'apache-arrow';
import {load, parse} from '@loaders.gl/core';
import {GeoJSONLoader, ParquetLoader} from '@loaders.gl/tables';

test.each(['tables'])('GeoJSON worker transport remains executable under %s', async owner => {
  const workerUrl = new URL(`/modules/${owner}/dist/geojson-worker.js`, window.location.origin)
    .href;
  const input = new TextEncoder().encode(
    JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {type: 'Point', coordinates: [1, 2]},
          properties: {label: 'grouped'}
        }
      ]
    })
  ).buffer;
  const table = await parse(input, GeoJSONLoader, {
    core: {worker: true, reuseWorkers: false},
    geojson: {workerUrl, shape: 'arrow'},
    json: {
      schema: new Schema(
        [
          new Field('label', new Utf8(), true, new Map([['meaning', 'name']])),
          new Field('geometry', new Binary(), true)
        ],
        new Map([['origin', 'worker-test']])
      )
    }
  });
  expect(table).not.toHaveProperty('shape');
  expect(table.numRows).toBe(1);
  expect(table.getChild('label')?.get(0)).toBe('grouped');
  expect(table.schema.metadata.get('origin')).toBe('worker-test');
  expect(table.schema.fields[0].metadata.get('meaning')).toBe('name');
});

test.each(['tables'])('Parquet worker assets remain executable under %s', async owner => {
  const workerUrl = new URL(`/modules/${owner}/dist/parquet-worker.js`, window.location.origin)
    .href;
  const table = await load(
    '@loaders.gl/tables/parquet/test/data/apache/good/alltypes_dictionary.parquet',
    ParquetLoader,
    {
      core: {worker: true, reuseWorkers: false},
      parquet: {workerUrl, shape: 'arrow'}
    }
  );
  expect(table.shape).toBe('arrow-table');
  expect(table.numRows).toBe(2);
  expect(table.getChild('id')?.get(0)).toBeTypeOf('number');
});

test('canonical Parquet WASM export resolves to an emitted binary', async () => {
  const response = await fetch('/modules/tables/dist/parquet/parquet_wasm_bg.wasm');
  expect(response.ok).toBe(true);
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect([...bytes.slice(0, 4)]).toEqual([0, 97, 115, 109]);
});

test('GeoJSON worker preserves binary geometry typed arrays', async () => {
  const input = JSON.stringify({
    type: 'FeatureCollection',
    features: [
      {type: 'Feature', geometry: {type: 'Point', coordinates: [1, 2]}, properties: {id: 7}}
    ]
  });
  const options = {geojson: {shape: 'binary-feature-collection' as const}};
  const expected = await parse(input, GeoJSONLoader, {...options, core: {worker: false}});
  const actual = await parse(input, GeoJSONLoader, {...options, core: {worker: true}});
  expect(actual).toEqual(expected);
  expect(ArrayBuffer.isView(actual.points.positions.value)).toBe(true);
});
