// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {ArrowTable} from '@loaders.gl/core/schema';
import {makeTableFromBatches} from '@loaders.gl/core/schema-utils';
import {GeoJSONLoaderWithParser} from '../../src/json/geojson-loader';
import {JSONTableLoaderWithParser} from '../../src/json/json-table-loader';

/** Emits separate chunks so container metadata is discovered after data rows. */
async function* chunks(parts: string[]) {
  for (const part of parts) yield new TextEncoder().encode(part);
}

test('GeoJSON final Arrow batch refines trailing CRS and container metadata', async () => {
  const parts = [
    '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[1,2]},"properties":{"value":1}}',
    '],"crs":{"type":"name","properties":{"name":"EPSG:4326"}},"title":"final"}'
  ];
  const options = {geojson: {shape: 'arrow-table' as const}, core: {batchSize: 1}};
  const batches = [];
  for await (const batch of GeoJSONLoaderWithParser.parseInBatches(chunks(parts), options))
    batches.push(batch);
  const firstMetadata = JSON.stringify(batches[0].schema);
  expect(batches.at(-1)!.length).toBe(0);
  const table = await makeTableFromBatches(batches);
  const full = GeoJSONLoaderWithParser.parseTextSync(parts.join(''), options) as ArrowTable;
  expect(table?.schema?.metadata?.['loaders.gl.containerJson']).toBe(
    full.schema?.metadata?.['loaders.gl.containerJson']
  );
  expect(table?.schema?.fields.find(field => field.name === 'geometry')?.metadata).toEqual(
    full.schema?.fields.find(field => field.name === 'geometry')?.metadata
  );
  expect(JSON.stringify(batches[0].schema)).toBe(firstMetadata);
  expect(table?.shape === 'arrow-table' && table.data.numRows).toBe(1);
});

test('JSON Arrow streaming retains a trailing container without emitting legacy envelopes', async () => {
  const parts = ['{"rows":[{"value":1}', '],"title":"final"}'];
  const options = {json: {shape: 'arrow-table' as const}, core: {batchSize: 1}};
  const batches = [];
  for await (const batch of JSONTableLoaderWithParser.parseInBatches(chunks(parts), options))
    batches.push(batch);
  expect(batches.every(batch => batch.shape === 'arrow-table')).toBe(true);
  expect(batches.at(-1)!.length).toBe(0);
  const table = await makeTableFromBatches(batches as any);
  const full = JSONTableLoaderWithParser.parseTextSync(parts.join(''), options);
  expect(table?.schema?.metadata).toEqual(full.schema?.metadata);
  expect(table?.shape === 'arrow-table' && table.data.numRows).toBe(1);
});

test('Empty JSON Arrow input preserves an explicit schema', async () => {
  const options = {
    json: {
      shape: 'arrow-table' as const,
      schema: {
        fields: [{name: 'value', type: 'float64' as const, nullable: true}],
        metadata: {declared: 'yes'}
      }
    }
  };
  const batches = [];
  for await (const batch of JSONTableLoaderWithParser.parseInBatches(chunks(['[]']), options))
    batches.push(batch);
  const table = await makeTableFromBatches(batches as any);
  expect(table?.schema?.metadata?.declared).toBe('yes');
  expect(table?.shape === 'arrow-table' && table.data.numRows).toBe(0);
});
