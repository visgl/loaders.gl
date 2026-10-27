// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {vi} from 'vitest';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {NullWorker, type LoadWorker} from '@loaders.gl/core/worker-utils';

/** Observable output from a real worker or its main-thread fallback. */
export type BatchWorkerResult = {
  /** Decoded input fragment. */
  input: string;
  /** State retained across input fragments. */
  batchIndex: number;
  /** Distinguishes worker execution from the fallback parser. */
  worker: boolean;
  /** Loader selected by the calling API. */
  loaderId: string;
};

/** Small portable worker used to verify routing without a format codec or external assets. */
export const BATCH_WORKER_SOURCE = `
const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);
const port = isNode ? require('node:worker_threads').parentPort : self;
let batchIndex = 0;
let loaderId;
/** Sends one protocol message. */
function post(type, payload = {}) { port.postMessage({source: 'loaders.gl', type, payload}); }
/** Retains parser state while respecting demand for input and output. */
function handleMessage({type, payload}) {
  switch (type) {
    case 'process-in-batches':
      batchIndex = 0;
      loaderId = payload.options._workerLoaderId;
      post('input-request');
      break;
    case 'input-batch':
      post('output-batch', {result: {
        input: new TextDecoder().decode(payload.input), batchIndex: batchIndex++, worker: true, loaderId
      }});
      break;
    case 'output-ack': post('input-request'); break;
    case 'input-done': post('done'); break;
  }
}
if (isNode) port.on('message', handleMessage);
else port.onmessage = event => handleMessage(event.data);
`;

/** Creates a loader whose fallback is distinguishable from its worker implementation. */
export function createBatchTestLoader(loadWorker?: LoadWorker) {
  const parseInBatches = vi.fn(async function* parseMainThreadBatches(
    input:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>
  ) {
    let batchIndex = 0;
    for await (const batch of input) {
      yield {
        input: new TextDecoder().decode(batch),
        batchIndex: batchIndex++,
        worker: false,
        loaderId: 'generic-batch'
      };
    }
  });
  const loader = {
    id: 'generic-batch',
    name: 'Generic batch',
    module: 'core',
    version: NullWorker.version,
    extensions: ['batch'],
    mimeTypes: ['application/x-batch'],
    dataType: null as unknown,
    batchType: null as unknown as BatchWorkerResult,
    worker: true,
    workerInBatches: true,
    loadWorker,
    options: {},
    parse: async () => null,
    parseInBatches
  } satisfies LoaderWithParser<unknown, BatchWorkerResult>;
  return {loader, parseInBatches};
}
