import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {ArrowSourceLoader, ArrowTableSource} from '../src/arrow-source';

test('ArrowTableSource discovers schema and applies projection and limit', async () => {
  const bytes = arrow.tableToIPC(arrow.tableFromArrays({name: ['a', 'b'], value: [1, 2]}));
  const source = new ArrowTableSource(new Blob([bytes]));
  const metadata = await source.getQueryMetadata();
  expect(metadata.columns.map(column => column.name)).toEqual(['name', 'value']);
  const batches = [];
  for await (const batch of source.read({columns: ['value'], limit: 1})) batches.push(batch);
  expect(batches[0]?.length).toBe(1);
  expect(batches[0]?.data.getChild('value')?.get(0)).toBe(1);
});

test('ArrowTableSource handles zero limits and empty projections', async () => {
  const bytes = arrow.tableToIPC(arrow.tableFromArrays({name: ['a', 'b'], value: [1, 2]}));
  const source = new ArrowTableSource(new Blob([bytes]));
  const zeroLimitBatches = [];
  for await (const batch of source.read({limit: 0})) zeroLimitBatches.push(batch);
  expect(zeroLimitBatches).toHaveLength(0);
  const projectedBatches = [];
  for await (const batch of source.read({columns: []})) projectedBatches.push(batch);
  expect(projectedBatches[0]?.data.numCols).toBe(0);
  await expect(async () => {
    for await (const _batch of source.read({limit: Number.POSITIVE_INFINITY})) {
      // expected to throw before producing a batch
    }
  }).rejects.toThrow('non-negative safe integer');
});

test('ArrowTableSource forwards cancellation and reports empty input', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    new ArrowTableSource(new Blob([new Uint8Array([])])).getQueryMetadata({
      signal: controller.signal
    })
  ).rejects.toThrow();
});

test('ArrowSourceLoader exposes URL matching and construction', () => {
  expect(ArrowSourceLoader.testURL('data.arrow')).toBe(true);
  expect(ArrowSourceLoader.testURL('data.csv')).toBe(false);
  expect(ArrowSourceLoader.createDataSource(new Blob([]), {})).toBeInstanceOf(ArrowTableSource);
});
