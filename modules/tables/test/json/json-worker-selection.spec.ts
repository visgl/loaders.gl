// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {selectJSONWorkerLoader} from '../../src/json/lib/select-json-worker-loader';

const encoder = new TextEncoder();

test('JSON shared worker selects the requested loader', () => {
  expect(selectJSONWorkerLoader({}).id).toBe('json');
  expect(selectJSONWorkerLoader({_workerLoaderId: 'json'}).id).toBe('json');
  expect(selectJSONWorkerLoader({_workerLoaderId: 'json-table'}).id).toBe('json-table');
  expect(selectJSONWorkerLoader({_workerLoaderId: 'ndjson'}).id).toBe('ndjson');
  expect(() => selectJSONWorkerLoader({_workerLoaderId: 'csv'})).toThrow(
    'does not support loader csv'
  );
});

test('JSON shared worker reports progress along the row-offset path', async () => {
  const loader = selectJSONWorkerLoader({_workerLoaderId: 'json-table'});
  const reportProgress = vi.fn();
  const input = [encoder.encode('[{"id":1},{"id":2}]')];
  const options = {
    core: {batchSize: 1},
    json: {shape: 'object-row-table', workerRowOffsets: true, jsonpaths: ['$']}
  };
  const batches = await Array.fromAsync(
    loader.parseInBatches!(input, options, {reportProgress} as never)
  );
  expect(batches.map(batch => batch.transport)).toEqual(['json-row-offsets', 'json-row-offsets']);
  expect(reportProgress.mock.calls.map(([progress]) => progress.completed)).toEqual([0, 1, 2]);
});

test.each([
  {core: {}, json: {shape: 'object-row-table'}},
  {core: {metadata: true}, json: {shape: 'object-row-table', workerRowOffsets: true}},
  {core: {}, json: {shape: 'array-row-table', workerRowOffsets: true}}
])('JSON shared worker uses the standard parser for %j', async options => {
  const loader = selectJSONWorkerLoader({_workerLoaderId: 'json-table'});
  const input = [encoder.encode('[{"id":1}]')];
  const batches = await Array.fromAsync(loader.parseInBatches!(input, options));
  expect(batches.length).toBeGreaterThan(0);
  expect(batches[0].transport).toBeUndefined();
});
