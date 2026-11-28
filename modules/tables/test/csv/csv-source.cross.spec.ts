import {expect, test} from 'vitest';
import {createDataSourceSync, load, preload} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables/csv';
import {CSVTableSource} from '@loaders.gl/tables/csv/bundled';

test('CSVTableSource discovers schema and applies projection and limit', async () => {
  const source = new CSVTableSource(new Blob(['name,value\na,1\nb,2\n']));
  const metadata = await source.getQueryMetadata();
  expect(metadata.execution).toEqual({status: 'supported', method: 'read'});
  expect(metadata.columns.map(column => column.name)).toEqual(['name', 'value']);
  const batches = [];
  for await (const batch of source.read({columns: ['value'], limit: 1})) batches.push(batch);
  expect(batches[0]?.length).toBe(1);
  expect(batches[0]?.data).toEqual([{value: 1}]);
});

test('CSVTableSource applies residual predicates before projection and limit', async () => {
  const source = new CSVTableSource(new Blob(['name,value\na,1\nb,2\nc,3\n']));
  const batches = [];
  for await (const batch of source.read({predicate: {op: '>', args: [{property: 'value'}, 1]}}))
    batches.push(batch);
  expect(batches.flatMap(batch => batch.data)).toEqual([
    {name: 'b', value: 2},
    {name: 'c', value: 3}
  ]);
});

test('CSVTableSource rejects invalid limits and forwards aborts', async () => {
  const source = new CSVTableSource(new Blob(['a\n1\n']));
  await expect(async () => {
    for await (const _batch of source.read({limit: Number.NaN})) {
      // expected to throw before producing a batch
    }
  }).rejects.toThrow('non-negative safe integer');
  const controller = new AbortController();
  controller.abort();
  await expect(source.getQueryMetadata({signal: controller.signal})).rejects.toThrow();
});

test('CSVTableSource handles zero limits and empty projections', async () => {
  const source = new CSVTableSource(new Blob(['name,value\na,1\nb,2\n']));
  const zeroLimitBatches = [];
  for await (const batch of source.read({limit: 0})) zeroLimitBatches.push(batch);
  expect(zeroLimitBatches).toHaveLength(0);
  const projectedBatches = [];
  for await (const batch of source.read({columns: []})) projectedBatches.push(batch);
  expect(projectedBatches[0]?.data).toEqual([{}, {}]);
});

test('CSVLoader parses data and creates a source after preload', async () => {
  expect(CSVLoader.testURL('data.csv')).toBe(true);
  expect(CSVLoader.testURL('data.txt')).toBe(false);
  const data = new Blob(['a\n1\n']);
  expect(() => createDataSourceSync(data, CSVLoader)).toThrow('preload');
  await preload(CSVLoader);
  const table = await load('https://example.test/data.csv', CSVLoader, {
    core: {fetch: async () => new Response(data), worker: false}
  });
  expect(table.numRows).toBe(1);
  const source = createDataSourceSync(data, CSVLoader);
  expect(source).toBeInstanceOf(CSVTableSource);
  expect((await source.getQueryMetadata()).columns).toHaveLength(1);
});

test.each([
  'first-batch',
  'full',
  undefined
] as const)('CSV source agrees on metadata and data schema for %s inference', async schemaInference => {
  const input = new Blob(['value\n1\nlater\n']);
  const source = new CSVTableSource(input, {
    core: {batchSize: 1},
    csv: {header: true, schemaInference}
  });
  const metadata = await source.getQueryMetadata();
  const expected = schemaInference === 'full' ? 'utf8' : 'float64';
  expect(metadata.schema?.fields[0].type).toBe(expected);
  expect(metadata.capabilities.table?.streaming).toBe(schemaInference !== 'full');
  const values = [];
  for await (const batch of source.read()) {
    expect(batch.schema?.fields[0].type).toBe(expected);
    values.push(...batch.data);
  }
  expect(values).toEqual([{value: 1}, {value: 'later'}]);
});

test('CSVSource projects predicate dependencies before applying the row window', async () => {
  const source = new CSVTableSource(new Blob(['value,name,unused\n1,a,x\n2,b,y\n3,c,z\n']), {
    core: {batchSize: 1}
  });
  const batches = await Array.fromAsync(
    source.read({
      columns: ['name'],
      predicate: {op: '>', args: [{property: 'value'}, 1]},
      offset: 1,
      limit: 1
    })
  );
  expect(batches.flatMap(batch => batch.data)).toEqual([{name: 'c'}]);
  expect(batches.at(-1)?.schema?.fields.map(field => field.name)).toEqual(['name']);
});

test('CSVSource stops pulling CSV bytes when the requested row window is complete', async () => {
  let pulls = 0;
  let cancelled = false;
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        pulls++;
        controller.enqueue(encoder.encode(pulls === 1 ? 'name,value\na,1\n' : 'b,2\n'));
      },
      cancel() {
        cancelled = true;
      }
    },
    {highWaterMark: 0}
  );
  const source = new CSVTableSource('https://example.test/input.csv', {
    core: {batchSize: 1, fetch: async () => new Response(stream)}
  });

  const batches = await Array.fromAsync(source.read({columns: ['value'], limit: 1}));
  expect(batches.flatMap(batch => batch.data)).toEqual([{value: 1}]);
  expect(pulls).toBe(1);
  expect(cancelled).toBe(true);
});
