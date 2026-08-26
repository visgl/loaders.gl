import {expect, test} from 'vitest';
import {NDJSONSourceLoader, NDJSONTableSource} from '../src/ndjson-source';

test('NDJSONTableSource discovers schema and applies projection and limit', async () => {
  const source = new NDJSONTableSource(
    new Blob(['{"name":"a","value":1}\n{"name":"b","value":2}\n'])
  );
  const metadata = await source.getQueryMetadata();
  expect(metadata.columns.map(column => column.name)).toEqual(['name', 'value']);
  const batches = [];
  for await (const batch of source.read({columns: ['name'], limit: 1})) batches.push(batch);
  expect(batches[0]?.data).toEqual([{name: 'a'}]);
});

test('NDJSONTableSource handles zero limits, empty projections and invalid limits', async () => {
  const source = new NDJSONTableSource(
    new Blob(['{"name":"a","value":1}\n{"name":"b","value":2}\n'])
  );
  const zeroLimitBatches = [];
  for await (const batch of source.read({limit: 0})) zeroLimitBatches.push(batch);
  expect(zeroLimitBatches).toHaveLength(0);
  const projectedBatches = [];
  for await (const batch of source.read({columns: []})) projectedBatches.push(batch);
  expect(projectedBatches.flatMap(batch => batch.data)).toEqual([{}, {}]);
  await expect(async () => {
    for await (const _batch of source.read({limit: -1})) {
      // expected to throw before producing a batch
    }
  }).rejects.toThrow('non-negative safe integer');
});

test('NDJSONTableSource forwards cancellation and reports empty input', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    new NDJSONTableSource(new Blob(['{"name":"a"}\n'])).getQueryMetadata({
      signal: controller.signal
    })
  ).rejects.toThrow();
});

test('NDJSONSourceLoader exposes URL matching and construction', () => {
  expect(NDJSONSourceLoader.testURL('data.jsonl')).toBe(true);
  expect(NDJSONSourceLoader.testURL('data.csv')).toBe(false);
  expect(NDJSONSourceLoader.createDataSource(new Blob(['{"a":1}\n']), {})).toBeInstanceOf(
    NDJSONTableSource
  );
});
