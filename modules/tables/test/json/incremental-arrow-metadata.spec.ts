// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table as ArrowTable, RecordBatch} from 'apache-arrow';
import {makeArrowTableFromBatches} from '@loaders.gl/core/schema-utils';
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
  const options = {geojson: {shape: 'arrow' as const}, core: {batchSize: 1}};
  const batches = [];
  for await (const batch of GeoJSONLoaderWithParser.parseInBatches(chunks(parts), options))
    batches.push(batch);
  const firstMetadata = JSON.stringify([
    Array.from(batches[0].schema.metadata),
    batches[0].schema.fields.map(field => Array.from(field.metadata))
  ]);
  expect(batches.at(-1)!.numRows).toBe(0);
  expect(batches.map(batch => batch.metadata.get('jsonpath'))).toEqual([
    '$.features',
    '$.features'
  ]);
  const table = await makeArrowTableFromBatches(batches);
  const full = GeoJSONLoaderWithParser.parseTextSync(parts.join(''), options) as ArrowTable;
  expect(table?.schema?.metadata.get('loaders.gl.containerJson')).toBe(
    full.schema?.metadata.get('loaders.gl.containerJson')
  );
  expect(table?.schema?.fields.find(field => field.name === 'geometry')?.metadata).toEqual(
    full.schema?.fields.find(field => field.name === 'geometry')?.metadata
  );
  expect(
    JSON.stringify([
      Array.from(batches[0].schema.metadata),
      batches[0].schema.fields.map(field => Array.from(field.metadata))
    ])
  ).toBe(firstMetadata);
  expect(table?.numRows).toBe(1);
});

test('JSON Arrow streaming retains a trailing container without emitting legacy envelopes', async () => {
  const parts = ['{"rows":[{"value":1}', '],"title":', '"final"}'];
  const options = {json: {shape: 'arrow' as const}, core: {batchSize: 1}};
  const batches = [];
  for await (const batch of JSONTableLoaderWithParser.parseInBatches(chunks(parts), options))
    batches.push(batch);
  expect(batches.every(batch => batch instanceof RecordBatch)).toBe(true);
  expect(batches.at(-1)!.numRows).toBe(0);
  const table = await makeArrowTableFromBatches(batches as any);
  const full = JSONTableLoaderWithParser.parseTextSync(parts.join(''), options);
  expect(table?.schema?.metadata).toEqual(full.schema?.metadata);
  expect(table?.numRows).toBe(1);
});

test('Empty JSON Arrow input preserves an explicit schema', async () => {
  const options = {
    json: {
      shape: 'arrow' as const,
      schema: {
        fields: [{name: 'value', type: 'float64' as const, nullable: true}],
        metadata: {declared: 'yes'}
      }
    }
  };
  const batches = [];
  for await (const batch of JSONTableLoaderWithParser.parseInBatches(chunks(['[]']), options))
    batches.push(batch);
  const table = await makeArrowTableFromBatches(batches as any);
  expect(table?.schema?.metadata.get('declared')).toBe('yes');
  expect(table?.numRows).toBe(0);
});

test('Fast JSON Arrow writes scalar fields directly across chunk and field-order boundaries', async () => {
  const parts = [
    '{"label":"prefix","rows":[{"id":1,"name":"o',
    'ne"},{"name":"tw\\u006f","id":2},{"id":3,"name":null}],"tail":true}'
  ];
  const options = {
    json: {
      shape: 'arrow' as const,
      jsonpaths: ['$.rows'],
      schema: {
        fields: [
          {name: 'id', type: 'float64' as const, nullable: false},
          {name: 'name', type: 'utf8' as const, nullable: true}
        ],
        metadata: {}
      }
    },
    core: {batchSize: 2}
  };
  const batches: RecordBatch[] = [];
  for await (const batch of JSONTableLoaderWithParser.parseInBatches(chunks(parts), options)) {
    if (!(batch instanceof RecordBatch)) throw new Error('Expected a native Arrow record batch');
    batches.push(batch);
  }
  expect(batches.map(batch => batch.numRows)).toEqual([2, 1]);
  const table = await makeArrowTableFromBatches(batches);
  expect(Array.from(table!.getChild('id')!)).toEqual([1, 2, 3]);
  expect(Array.from(table!.getChild('name')!)).toEqual(['one', 'two', null]);
  expect(JSON.parse(table!.schema.metadata.get('loaders.gl.containerJson')!)).toEqual({
    label: 'prefix',
    rows: [],
    tail: true
  });
});

test('Fast JSON Arrow infers ordered columns from the whole first batch', async () => {
  const parts = ['[{"2":2,"1":1},{"1":3,"2":4,"label":"later"},', '{"1":5,"2":6,"label":"last"}]'];
  const options = {
    json: {shape: 'arrow' as const},
    core: {batchSize: 2}
  };
  const batches: RecordBatch[] = [];
  for await (const batch of JSONTableLoaderWithParser.parseInBatches(chunks(parts), options)) {
    if (!(batch instanceof RecordBatch)) throw new Error('Expected a native Arrow record batch');
    batches.push(batch);
  }
  expect(batches.map(batch => batch.numRows)).toEqual([2, 1]);
  const table = await makeArrowTableFromBatches(batches);
  expect(table!.schema.fields.map(field => field.name)).toEqual(['1', '2', 'label']);
  expect(Array.from(table!.getChild('1')!)).toEqual([1, 3, 5]);
  expect(Array.from(table!.getChild('2')!)).toEqual([2, 4, 6]);
  expect(Array.from(table!.getChild('label')!)).toEqual([null, 'later', 'last']);
});

test('full schema inference applies later JSON fields to all streaming batches', async () => {
  const input = chunks(['[{"id":1},', '{"id":2,"label":"late"}]']);
  const batches: RecordBatch[] = [];
  for await (const batch of JSONTableLoaderWithParser.parseInBatches(input, {
    core: {batchSize: 1},
    json: {schemaInference: 'full'}
  })) {
    if (batch instanceof RecordBatch && batch.numRows) batches.push(batch);
  }
  expect(batches.map(batch => batch.schema.names)).toEqual([
    ['id', 'label'],
    ['id', 'label']
  ]);
  expect(batches.map(batch => batch.getChild('label')?.get(0))).toEqual([null, 'late']);
});

test('whole-file JSON can opt into the streaming schema sample', () => {
  const input = '[{"id":1},{"id":2,"label":"late"}]';
  const wholeFile = JSONTableLoaderWithParser.parseTextSync(input);
  expect(wholeFile.schema?.fields.map(field => field.name)).toEqual(['id', 'label']);
  const sampled = JSONTableLoaderWithParser.parseTextSync(input, {
    core: {batchSize: 1},
    json: {schemaInference: 'first-batch', arrowConversion: {onExtraField: 'drop'}}
  });
  expect(sampled.schema?.fields.map(field => field.name)).toEqual(['id']);
});
