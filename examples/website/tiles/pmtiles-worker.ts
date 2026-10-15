// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createPMTilesExampleArchive} from './create-pmtiles';
import type {PMTilesWorkerMessage, PMTilesWorkerRequest} from './pmtiles-worker-client';

/** Dedicated one-shot worker; its owner terminates it on completion or cancellation. */
const workerScope = globalThis as unknown as {
  /** Accepts one cloneable conversion request. */
  onmessage: ((event: MessageEvent<PMTilesWorkerRequest>) => void) | null;
  /** Publishes an immutable Blob or a serialized failure. */
  postMessage(message: PMTilesWorkerMessage): void;
};

workerScope.onmessage = async event => {
  workerScope.onmessage = null;
  try {
    const {input, options} = event.data;
    const archive = await createPMTilesExampleArchive(input, options, new AbortController().signal);
    workerScope.postMessage({type: 'result', archive});
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
