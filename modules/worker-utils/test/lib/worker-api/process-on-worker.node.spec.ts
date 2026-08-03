// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {processOnWorker} from '@loaders.gl/worker-utils';

const TestWorker = {
  id: 'context-test',
  name: 'context-test',
  module: 'worker-utils',
  version: 'latest',
  worker: true,
  options: {}
};

const testWorkerSource = `
const {parentPort} = require('worker_threads');

let jobContext;

parentPort.on('message', message => {
  const {type, payload} = message;

  if (type === 'process' && payload.id === undefined) {
    jobContext = payload.context;
    parentPort.postMessage({
      source: 'loaders.gl',
      type: 'process',
      payload: {
        id: 1,
        input: payload.input,
        options: {workerOption: payload.options.workerOption},
        context: {workerContext: jobContext.loaderContext}
      }
    });
    return;
  }

  if (type === 'done' && payload.id === 1) {
    parentPort.postMessage({
      source: 'loaders.gl',
      type: 'done',
      payload: {result: payload.result}
    });
  }
});
`;

const AbortWorker = {
  id: 'abort-test',
  name: 'abort-test',
  module: 'worker-utils',
  version: 'latest',
  worker: true,
  options: {}
};

const abortWorkerSource = `
const {parentPort} = require('worker_threads');

parentPort.on('message', message => {
  const {type, payload} = message;
  if (type === 'process') {
    setTimeout(() => parentPort.postMessage({
      source: 'loaders.gl',
      type: 'done',
      payload: {result: payload.input}
    }), payload.options.delay);
  }
});
`;

test('processOnWorker#jobContext', async t => {
  const result = await processOnWorker(
    TestWorker,
    'abc',
    {
      worker: true,
      source: testWorkerSource,
      workerOption: 'worker-option',
      loaderContext: 'option-context'
    },
    {
      process: async (input, options, _workerContext, jobContext) => ({
        input,
        options,
        jobContext
      })
    },
    {
      loaderContext: 'job-context'
    }
  );

  t.deepEqual(
    result,
    {
      input: 'abc',
      options: {workerOption: 'worker-option'},
      jobContext: {workerContext: 'job-context'}
    },
    'job context is transferred separately from options'
  );
  t.end();
});

test('processOnWorker#AbortSignal terminates and replaces an active worker', async t => {
  const abortController = new AbortController();
  const abortedResult = processOnWorker(AbortWorker, 'aborted', {
    worker: true,
    source: abortWorkerSource,
    delay: 1_000,
    signal: abortController.signal
  });
  setTimeout(() => abortController.abort(), 10);

  let abortError: unknown;
  try {
    await abortedResult;
  } catch (error) {
    abortError = error;
  }
  t.equal((abortError as Error | undefined)?.name, 'AbortError', 'rejects with an abort error');
  const nextResult = await processOnWorker(AbortWorker, 'replacement', {
    worker: true,
    source: abortWorkerSource,
    delay: 0
  });
  t.equal(nextResult, 'replacement', 'the pool starts a replacement worker after cancellation');
  t.end();
});
