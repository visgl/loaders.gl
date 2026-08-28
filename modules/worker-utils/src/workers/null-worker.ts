// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createWorker} from '../lib/worker-api/create-worker';

createWorker(
  async data => {
    // @ts-ignore
    return data;
  },
  /** Echoes batches together with session-local state for worker protocol tests. */
  async function* processInBatches(iterator) {
    let batchIndex = 0;
    for await (const input of iterator) {
      yield {input, batchIndex};
      batchIndex++;
    }
  }
);
