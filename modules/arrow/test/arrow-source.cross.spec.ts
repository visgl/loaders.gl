import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {ArrowTableSource} from '../src/arrow-source';

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
