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
