// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Table} from 'apache-arrow';
import {parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {NDJSONLoader} from '@loaders.gl/tables/json';
import {NDJSONLoaderWithParser} from '@loaders.gl/tables/json/ndjson-loader';

afterEach(() => WorkerFarm.getWorkerFarm().destroy());

test('NDJSON batches use the packaged CommonJS worker with explicit Node opt-in', async () => {
  const mainParser = vi.fn(NDJSONLoaderWithParser.parseInBatches);
  const loader = {
    ...NDJSONLoader,
    preload: async () => ({...NDJSONLoaderWithParser, parseInBatches: mainParser})
  };
  const batches = await parseInBatches([new TextEncoder().encode('{"id":1}\n')], loader, {
    core: {worker: true, _nodeWorkers: true, _workerType: 'classic', batchSize: 1}
  });
  const results = [];
  for await (const batch of batches) results.push(batch);
  expect(mainParser).not.toHaveBeenCalled();
  expect(results).toHaveLength(1);
  expect(results[0].data).toBeInstanceOf(Table);
  expect(results[0].data.getChild('id')?.get(0)).toBe(1);
});
