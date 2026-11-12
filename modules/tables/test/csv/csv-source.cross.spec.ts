import {expect, test} from 'vitest';
import {createDataSourceSync, load, preload} from '@loaders.gl/core';
import {CSVLoader, CSVTableSource} from '@loaders.gl/tables/csv';

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
