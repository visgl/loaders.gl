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

test('NDJSONTableSource applies residual predicates before projection and limit', async () => {
  const source = new NDJSONTableSource(
    new Blob(['{"name":"a","value":1}\n{"name":"b","value":2}\n'])
  );
  const batches = [];
  for await (const batch of source.read({predicate: {op: '=', args: [{property: 'name'}, 'b']}}))
    batches.push(batch);
  expect(batches.flatMap(batch => batch.data)).toEqual([{name: 'b', value: 2}]);
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

test('NDJSONTableSource truncates a multi-row batch at the global limit', async () => {
  const source = new NDJSONTableSource(new Blob(['{"name":"a"}\n{"name":"b"}\n']), {
    batchSize: 2
  });
  const batches = [];
  for await (const batch of source.read({limit: 1})) batches.push(batch);
  expect(batches).toHaveLength(1);
  expect(batches[0]?.length).toBe(1);
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

test('NDJSONTableSource rejects a source with no discoverable batch', async () => {
  const source = new NDJSONTableSource(new Blob([]));
  (source as unknown as {parseBatches: () => AsyncIterable<unknown>}).parseBatches =
    async function* () {};
  await expect(source.getQueryMetadata()).rejects.toThrow('source is empty');
});

test('NDJSONTableSource reports failed URL responses', async () => {
  const source = new NDJSONTableSource('data.jsonl');
  source.fetch = async () => new Response(null, {status: 503});
  await expect(source.getQueryMetadata()).rejects.toThrow('status 503');
});
