import {expect, test} from 'vitest';
import {CSVSourceLoader, CSVTableSource} from '../src/csv-source';

test('CSVTableSource discovers schema and applies projection and limit', async () => {
  const source = new CSVTableSource(new Blob(['name,value\na,1\nb,2\n']));
  const metadata = await source.getQueryMetadata();
  expect(metadata.columns.map(column => column.name)).toEqual(['name', 'value']);
  const batches = [];
  for await (const batch of source.read({columns: ['value'], limit: 1})) batches.push(batch);
  expect(batches[0]?.length).toBe(1);
  expect(batches[0]?.data).toEqual([{value: 1}]);
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

test('CSVSourceLoader exposes URL matching and construction', () => {
  expect(CSVSourceLoader.testURL('data.csv')).toBe(true);
  expect(CSVSourceLoader.testURL('data.txt')).toBe(false);
  expect(CSVSourceLoader.createDataSource(new Blob(['a\n1\n']), {})).toBeInstanceOf(CSVTableSource);
});
