// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createDataSource, createDataSourceSync, load, preload} from '@loaders.gl/core';
import {query} from '@loaders.gl/core/scan';
import {CSVLoader, CSVTableSource} from '@loaders.gl/tables/csv';
import {JSONLoader, JSONTableLoader, JSONTableSource} from '@loaders.gl/tables/json';

test('JSON table source queries inferred array columns from a URL', async () => {
  expect(JSONTableLoader.options.json.shape).toBe('arrow');
  const fetch = vi.fn(async () => new Response('[[-73.98,40.73,2],[-74,40.7,1]]'));
  const result = await query(
    {
      select: [
        {as: 'longitude', column: 'column1'},
        {as: 'latitude', column: 'column2'}
      ],
      where: {op: '=', args: [{property: 'column3'}, 1]},
      limit: 1
    },
    {
      source: 'https://example.test/points.json',
      loaders: JSONTableLoader,
      core: {fetch}
    }
  );

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(result.schema.fields.map(field => field.name)).toEqual(['longitude', 'latitude']);
  expect(result.get(0)?.toJSON()).toEqual({longitude: -74, latitude: 40.7});
  expect(result.numRows).toBe(1);
});

test('JSONTableLoader parses data and creates a source after preload', async () => {
  const data = new Blob(['[{"value":1}]']);
  await preload(JSONTableLoader);
  const table = await load('https://example.test/data.json', JSONTableLoader, {
    core: {fetch: async () => new Response(data), worker: false}
  });
  expect(table.numRows).toBe(1);
  const source = createDataSourceSync(data, JSONTableLoader);
  expect(source).toBeInstanceOf(JSONTableSource);
  expect((await source.getQueryMetadata()).columns).toHaveLength(1);
});

test('JSON table source projects Blob rows and observes cancellation', async () => {
  const source = new JSONTableSource(new Blob(['[{"name":"a","value":1},{"name":"b","value":2}]']));
  const metadata = await source.getQueryMetadata();
  expect(metadata.capabilities.table).toMatchObject({projection: 'residual', streaming: false});

  const batches = [];
  for await (const batch of source.read({
    columns: ['name'],
    predicate: {op: '=', args: [{property: 'value'}, 2]},
    limit: 1
  })) {
    batches.push(batch);
  }
  const [batch] = batches;
  expect(batch.get(0)?.toJSON()).toEqual({name: 'b'});
  expect(batch.numRows).toBe(1);
});

test('JSONTableLoader source matching preserves parser order for JSON URLs', async () => {
  const fetch = vi.fn(
    async () => new Response('[{"value":1}]', {headers: {'Content-Type': 'application/json'}})
  );
  const data = await load('https://example.test/data.json', [JSONLoader, JSONTableLoader], {
    core: {fetch, worker: false}
  });
  expect(data).toEqual([{value: 1}]);
});

test('JSONTableLoader does not auto-select a GeoJSON URL as a table source', async () => {
  const fetch = vi.fn();
  await expect(
    createDataSource('https://example.test/features.geojson', [JSONTableLoader, CSVLoader], {
      core: {fetch}
    })
  ).rejects.toThrow('No explicit source loader matches the input');
  expect(fetch).not.toHaveBeenCalled();
});

test.each([
  new Blob(['[{"value":1}]'], {type: 'application/json'}),
  new File(['[{"value":1}]'], 'rows.json')
])('JSONTableLoader selects a JSON Blob or File among multiple source loaders', async input => {
  const source = await createDataSource(input, [CSVLoader, JSONTableLoader]);
  expect(source).toBeInstanceOf(JSONTableSource);
});

test('createDataSource prefers the explicit MIME type to a JSON filename', async () => {
  const input = new File(['value\n1'], 'rows.json');
  const source = await createDataSource(input, [JSONTableLoader, CSVLoader], {
    core: {mimeType: 'text/csv'}
  });
  expect(source).toBeInstanceOf(CSVTableSource);
});
