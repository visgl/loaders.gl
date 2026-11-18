// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {RecordBatch, Table, tableFromArrays} from 'apache-arrow';
import {GeoJSONLoaderWithParser} from '../../src/json/geojson-loader';
import {JSONTableLoaderWithParser} from '../../src/json/json-table-loader';
import {CSVLoaderWithParser} from '../../src/csv/csv-loader';
import {
  serializeGeoJSONWorkerResult,
  deserializeGeoJSONWorkerResult
} from '../../src/json/lib/geojson-worker-transport';

const featureCollection = {
  type: 'FeatureCollection',
  features: [{type: 'Feature', geometry: {type: 'Point', coordinates: [1, 2]}, properties: {id: 7}}]
};
const bytes = new TextEncoder().encode(JSON.stringify(featureCollection));

test('GeoJSON explicit binary and feature outputs preserve streaming values', async () => {
  const options = {geojson: {shape: 'binary-feature-collection' as const}, core: {batchSize: 1}};
  const full = await GeoJSONLoaderWithParser.parse(bytes.buffer, options);
  const batches = [];
  for await (const batch of GeoJSONLoaderWithParser.parseInBatches([bytes], options))
    batches.push(batch);
  expect(batches).toHaveLength(1);
  expect(batches[0].data).toEqual(full);
  expect(Array.from(full.points.positions.value)).toEqual([1, 2]);

  const rows = [];
  for await (const batch of GeoJSONLoaderWithParser.parseInBatches([bytes], {
    geojson: {shape: 'geojson-table'}
  }))
    rows.push(...batch.data);
  expect(rows).toEqual(featureCollection.features);
});

test('GeoJSON native transport distinguishes batches, tables, and binary geometry', () => {
  const table = tableFromArrays({id: new Int32Array([7])});
  const batch = new RecordBatch(
    table.schema,
    table.batches[0].data,
    new Map([['jsonpath', '$.features']])
  );
  for (const value of [table, batch]) {
    const restored = deserializeGeoJSONWorkerResult(
      structuredClone(serializeGeoJSONWorkerResult(value))
    );
    expect(restored).toBeInstanceOf(value instanceof Table ? Table : RecordBatch);
    expect(restored.getChild('id').get(0)).toBe(7);
    if (restored instanceof RecordBatch)
      expect(restored.metadata.get('jsonpath')).toBe('$.features');
  }
  const binary = GeoJSONLoaderWithParser.parseTextSync(JSON.stringify(featureCollection), {
    geojson: {shape: 'binary-feature-collection'}
  });
  expect(serializeGeoJSONWorkerResult(binary)).toBe(binary);
  expect(deserializeGeoJSONWorkerResult(binary)).toBe(binary);
});

test.each([
  {loader: CSVLoaderWithParser, options: {csv: {shape: 'arrow-table'}}},
  {loader: JSONTableLoaderWithParser, options: {json: {shape: 'arrow-table'}}},
  {loader: GeoJSONLoaderWithParser, options: {geojson: {shape: 'arrow-table'}}}
])('$loader.id rejects the removed wrapper shape on direct parser entry points', ({
  loader,
  options
}) => {
  expect(() => loader.parseTextSync('', options as any)).toThrow('native Arrow');
  expect(() => loader.parseInBatches([], options as any)).toThrow('native Arrow');
});
