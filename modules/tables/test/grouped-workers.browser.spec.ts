// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, parse} from '@loaders.gl/core';
import {ExcelLoader, GeoJSONLoader, ParquetLoader} from '@loaders.gl/tables';

const WORKSHEET_URL = '@loaders.gl/tables/excel/test/data/zipcodes-small.xlsx';

test.each(['tables'])('Excel worker assets remain executable under %s', async owner => {
  const workerUrl = new URL(`/modules/${owner}/dist/excel-worker.js`, window.location.origin).href;
  const table = await load(WORKSHEET_URL, ExcelLoader, {
    core: {worker: true, reuseWorkers: false},
    excel: {workerUrl, shape: 'arrow-table'}
  });
  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows).toBe(12);
  expect(table.data.getChild('zip_code')?.get(0)).toBeTruthy();
});

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
    geojson: {workerUrl, shape: 'arrow-table'}
  });
  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows).toBe(1);
  expect(table.data.getChild('label')?.get(0)).toBe('grouped');
});

test.each(['tables'])('Parquet worker assets remain executable under %s', async owner => {
  const workerUrl = new URL(`/modules/${owner}/dist/parquet-worker.js`, window.location.origin)
    .href;
  const table = await load(
    '@loaders.gl/tables/parquet/test/data/apache/good/alltypes_dictionary.parquet',
    ParquetLoader,
    {
      core: {worker: true, reuseWorkers: false},
      parquet: {workerUrl, shape: 'arrow-table'}
    }
  );
  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows).toBe(2);
  expect(table.data.getChild('id')?.get(0)).toBeTypeOf('number');
});

test('canonical Parquet WASM export resolves to an emitted binary', async () => {
  const response = await fetch('/modules/tables/dist/parquet/parquet_wasm_bg.wasm');
  expect(response.ok).toBe(true);
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect([...bytes.slice(0, 4)]).toEqual([0, 97, 115, 109]);
});
