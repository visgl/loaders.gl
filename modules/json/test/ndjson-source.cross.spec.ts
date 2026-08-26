import {expect, test} from 'vitest';
import {NDJSONTableSource} from '../src/ndjson-source';

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
