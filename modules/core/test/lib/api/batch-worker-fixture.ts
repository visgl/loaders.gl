// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {vi} from 'vitest';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {NullWorker, isBrowser, type LoadWorker} from '@loaders.gl/core/worker-utils';

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
const waiting = [];
/** Retains startup messages while the public task runtime loads. */
const capture = event => waiting.push(event);
if (!isNode) self.addEventListener('message', capture);
(async () => {
  const {createWorker} = isNode
    ? require(${JSON.stringify(isBrowser ? '' : process.cwd() + '/modules/core/dist/worker-utils/index.cjs')})
    : await import(${JSON.stringify(isBrowser ? new URL('/modules/core/src/worker-utils/index.ts', location.href).href : '')});
  await createWorker(async value => value, async function* (inputs, options) {
    let batchIndex = 0;
    for await (const input of inputs) yield {
      input: new TextDecoder().decode(input), batchIndex: batchIndex++, worker: true, loaderId: options._workerLoaderId
    };
  });
  if (!isNode) {
    self.removeEventListener('message', capture);
    for (const event of waiting) self.dispatchEvent(new MessageEvent('message', {data: event.data}));
  }
})();
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
