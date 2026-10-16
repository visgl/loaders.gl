// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createPMTilesExampleArchive} from './create-pmtiles';
import type {PMTilesWorkerMessage, PMTilesWorkerRequest} from './pmtiles-worker-client';

/** Dedicated one-shot worker; its owner terminates it on completion or cancellation. */
const workerScope = globalThis as unknown as {
  /** Accepts one cloneable conversion request. */
  onmessage: ((event: MessageEvent<PMTilesWorkerRequest | {type: 'finish'}>) => void) | null;
  /** Publishes an immutable Blob or a serialized failure. */
  postMessage(message: PMTilesWorkerMessage): void;
};

/** Tracks the one permitted conversion independently from subsequent Finish messages. */
let started = false;
/** Cooperative finish retains all fully produced tiles. */
let finishRequested = false;

workerScope.onmessage = async event => {
  if ('type' in event.data && event.data.type === 'finish') {
    finishRequested = true;
    return;
  }
  if (started || !('input' in event.data)) return;
  started = true;
  try {
    const {input, options} = event.data;
    const archive = await createPMTilesExampleArchive(
      input,
      options,
      new AbortController().signal,
      {
        onProgress: progress => workerScope.postMessage({type: 'progress', progress}),
        shouldFinish: () => finishRequested
      }
    );
    workerScope.postMessage({type: 'result', archive});
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
