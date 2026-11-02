// SPDX-License-Identifier: MIT
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {expect, test} from 'vitest';
import {
  NullWorker,
  processOnWorker,
  processOnWorkerInBatches,
  destroyWorkerTasks
} from '@loaders.gl/core/worker-utils';

test('Node module targets run atomic callbacks and streaming through the public task protocol', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'loader-tasks-'));
  const filename = join(directory, 'worker.cjs');
  writeFileSync(
    filename,
    `
    const {createWorker} = require(${JSON.stringify(resolve('modules/core/dist/worker-utils/index.cjs'))});
    createWorker(
      (input, options, context, jobContext) => context.process(input, options, jobContext),
      async function* (inputs) {for await (const input of inputs) yield input;}
    );
  `
  );
  const worker = {...NullWorker, worker: pathToFileURL(filename).href};
  try {
    await expect(
      processOnWorker(
        worker,
        'node',
        {marker: 3},
        {
          process: async (input, options, _context, jobContext) => ({
            input,
            marker: options.marker,
            jobContext
          })
        },
        {source: 'node'}
      )
    ).resolves.toEqual({input: 'node', marker: 3, jobContext: {source: 'node'}});
    const shared = new Uint8Array(new SharedArrayBuffer(1));
    shared[0] = 5;
    const sharedResult = await processOnWorker(
      worker,
      shared,
      {inputOwnership: 'share'},
      {process: async value => value}
    );
    expect(sharedResult).toBeInstanceOf(Uint8Array);
    sharedResult[0] = 8;
    expect(shared[0]).toBe(8);

    const results = [];
    for await (const result of processOnWorkerInBatches(worker, [1, 2])) results.push(result);
    expect(results).toEqual([1, 2]);
  } finally {
    await destroyWorkerTasks();
    rmSync(directory, {recursive: true, force: true});
  }
});
