// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createDataSource, createDataSourceSync, load, preload} from '@loaders.gl/core';
import {query} from '@loaders.gl/core/query/sql';
import {CSVLoader} from '@loaders.gl/tables/csv';
import {CSVTableSource} from '@loaders.gl/tables/csv/bundled';
import {JSONLoader, JSONTableLoader} from '@loaders.gl/tables/json';
import {JSONTableSource} from '@loaders.gl/tables/json/bundled';

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
  expect(metadata.capabilities.table).toMatchObject({
    projection: 'pushdown+residual',
    streaming: true
  });

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

test('JSON table source streams declared columns and cancels input at the limit', async () => {
  const encoder = new TextEncoder();
  const chunks = ['[[1,2],', '[3,4]]'];
  const pull = vi.fn((controller: ReadableStreamDefaultController<Uint8Array>) => {
    const chunk = chunks.shift();
    if (chunk === undefined) controller.close();
    else controller.enqueue(encoder.encode(chunk));
  });
  const cancel = vi.fn();
  const fetch = vi.fn(
    async () => new Response(new ReadableStream({pull, cancel}, {highWaterMark: 0}))
  );
  const source = new JSONTableSource('https://example.test/points.json', {
    core: {fetch},
    json: {
      schema: {
        fields: [
          {name: 'longitude', type: 'float64', nullable: false},
          {name: 'latitude', type: 'float64', nullable: false}
        ],
        metadata: {}
      }
    }
  });

  const metadata = await source.getQueryMetadata();
  expect(metadata.capabilities.table).toMatchObject({
    projection: 'pushdown+residual',
    predicate: 'pushdown+residual',
    limit: 'pushdown',
    streaming: true
  });
  expect(metadata.columns.map(column => column.name)).toEqual(['longitude', 'latitude']);
  expect(fetch).not.toHaveBeenCalled();

  const rows = [];
  for await (const batch of source.read({columns: ['latitude'], limit: 1})) {
    rows.push(...batch.toArray().map(row => row.toJSON()));
  }
  expect(rows).toEqual([{latitude: 2}]);
  expect(pull).toHaveBeenCalledTimes(1);
  expect(cancel).toHaveBeenCalledTimes(1);
});

test('JSON table source pushes scalar predicates before Arrow construction', async () => {
  const source = new JSONTableSource(
    new Blob([
      '[{"label":false,"value":null,"ignored":{"nested":[1,{"a":true}]}},{"label":"match","value":2,"ignored": true }]'
    ]),
    {
      json: {
        schema: {
          fields: [
            {name: 'label', type: 'utf8', nullable: false},
            {name: 'value', type: 'float64', nullable: true},
            {name: 'ignored', type: 'bool', nullable: false}
          ],
          metadata: {}
        }
      }
    }
  );
  const rows = [];
  for await (const batch of source.read({
    columns: ['label'],
    predicate: {op: '>=', args: [{property: 'value'}, 2]},
    limit: 1
  })) {
    rows.push(...batch.toArray().map(row => row.toJSON()));
  }
  expect(rows).toEqual([{label: 'match'}]);
});

test('JSON table source keeps predicate fields for late inference and residual filtering', async () => {
  const data = new Blob(['[{"label":"a"},{"label":"b","value":2},{"label":"c","value":0}]']);
  for (const predicate of [
    {op: '>=', args: [{property: 'value'}, 2]},
    {op: 'not', args: [{op: '<', args: [{property: 'value'}, 2]}]}
  ] as const) {
    const rows = [];
    for await (const batch of new JSONTableSource(data).read({columns: ['label'], predicate})) {
      rows.push(...batch.toArray().map(row => row.toJSON()));
    }
    expect(rows).toEqual([{label: 'b'}]);
  }
});

test('JSON table source still validates the syntax of skipped fields', async () => {
  const source = new JSONTableSource(new Blob(['[{"id":1,"ignored":{"nested":[1,]}}]']));
  await expect(
    source
      .read({columns: ['id']})
      [Symbol.asyncIterator]()
      .next()
  ).rejects.toThrow(SyntaxError);
});

test.each([
  'full',
  'first-batch',
  undefined
] as const)('JSON table source uses %s inference for projected columns', async schemaInference => {
  const data = Array.from({length: 1025}, (_, id) =>
    id < 1024 ? {id, ignored: true} : {id, late: 5, ignored: {a: 1}}
  );
  const source = new JSONTableSource(new Blob([JSON.stringify(data)]), {
    json: {schemaInference}
  });
  let rowCount = 0;
  const names = new Set<string>();
  let late: unknown;
  for await (const batch of source.read({columns: ['id', 'late']})) {
    rowCount += batch.numRows;
    for (const name of batch.schema.names) names.add(name);
    if (batch.numRows) late = batch.getChild('late')?.get(batch.numRows - 1);
  }
  expect(rowCount).toBe(1025);
  expect([...names]).toEqual(schemaInference === 'full' ? ['id', 'late'] : ['id']);
  expect(late).toBe(schemaInference === 'full' ? 5 : undefined);
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

test('JSON source default inference returns schema before EOF and cancels the metadata read', async () => {
  const pull = vi.fn((controller: ReadableStreamDefaultController<Uint8Array>) => {
    controller.enqueue(new TextEncoder().encode('[{"id":1},'));
  });
  const cancel = vi.fn();
  const fetch = vi.fn(
    async () => new Response(new ReadableStream({pull, cancel}, {highWaterMark: 0}))
  );
  const source = new JSONTableSource('https://example.test/rows.json', {
    core: {fetch, batchSize: 1}
  });
  const metadata = await source.getQueryMetadata();
  expect(metadata.columns.map(column => column.name)).toEqual(['id']);
  expect(pull).toHaveBeenCalledTimes(1);
  expect(cancel).toHaveBeenCalledTimes(1);
});

test.each([
  'first-batch',
  'full'
] as const)('JSON source respects row-array paths in %s inference', async schemaInference => {
  const data = new Blob(['{"other":[{"unrelated":0}],"rows":[{"id":1}]}']);
  const options = {json: {schemaInference, jsonpaths: ['$.rows']}};
  const source = new JSONTableSource(data, options);
  const metadata = await source.getQueryMetadata();
  expect(metadata.columns.map(column => column.name)).toEqual(['id']);
  const rows = [];
  for await (const batch of new JSONTableSource(data, options).read({columns: ['id']})) {
    rows.push(...batch.toArray().map(row => row.toJSON()));
  }
  expect(rows).toEqual([{id: 1}]);
});

test.each([
  {property: 'other'},
  {parameter: 'threshold'}
])('JSON source sends non-literal predicate operands to the residual executor', async operand => {
  const source = new JSONTableSource(new Blob(['[{"value":1,"other":false}]']), {
    json: {
      schema: {
        fields: [
          {name: 'value', type: 'float64', nullable: false},
          {name: 'other', type: 'utf8', nullable: false}
        ],
        metadata: {}
      }
    }
  });
  // The residual path constructs and validates the Arrow row before comparing operands.
  await expect(
    source
      .read({
        predicate: {op: '=', args: [{property: 'value'}, operand]}
      })
      [Symbol.asyncIterator]()
      .next()
  ).rejects.toThrow('incompatible Arrow field at other');
});

test('JSON source streaming inference selects data after a serialized table schema', async () => {
  const input = JSON.stringify({
    shape: 'object-row-table',
    schema: {fields: [{name: 'id', type: 'float64'}], metadata: {source: 'fixture'}},
    data: [{id: 7}]
  });
  const source = new JSONTableSource(new Blob([input]));
  const metadata = await source.getQueryMetadata();
  expect(metadata.columns.map(column => column.name)).toEqual(['id']);
  expect(metadata.schema.metadata.source).toBe('fixture');
  const rows = [];
  for await (const batch of source.read()) rows.push(...batch.toArray().map(row => row.toJSON()));
  expect(rows).toEqual([{id: 7}]);
});
