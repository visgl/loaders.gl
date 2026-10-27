// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {expect, test} from 'vitest';
import {parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {BATCH_WORKER_SOURCE, createBatchTestLoader} from './batch-worker-fixture';

test('generic loader batches use an explicitly enabled Node worker', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'loaders-batch-worker-'));
  try {
    const workerPath = join(directory, 'worker.cjs');
    writeFileSync(workerPath, BATCH_WORKER_SOURCE);
    const {loader, parseInBatches: mainParser} = createBatchTestLoader();
    const batches = await parseInBatches([new TextEncoder().encode('node')], loader, {
      core: {worker: true, _nodeWorkers: true, workerInBatches: true},
      [loader.id]: {workerUrl: pathToFileURL(workerPath).href}
    });
    const results = [];
    for await (const batch of batches) results.push(batch);
    expect(results).toEqual([{input: 'node', batchIndex: 0, worker: true, loaderId: loader.id}]);
    expect(mainParser).not.toHaveBeenCalled();
  } finally {
    WorkerFarm.getWorkerFarm().destroy();
    rmSync(directory, {recursive: true, force: true});
  }
});
