// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  PMTILES_EXAMPLE_LIMITS,
  selectPMTilesExampleTiles,
  type PMTilesExampleOptions
} from './create-pmtiles';

/** Cloneable input; runtime signals and callbacks stay on the page. */
export type PMTilesWorkerRequest = {
  /** Local file/blob or absolute HTTP(S) dataset URL. */
  input: Blob | string;
  /** Bounded tile selection and payload settings. */
  options: PMTilesExampleOptions;
};

/** One complete bounded archive or a user-readable failure. */
export type PMTilesWorkerMessage =
  | {
      /** Successful completion. */
      type: 'result';
      /** Immutable archive, cloned without copying its bytes into page JavaScript. */
      archive: Blob;
    }
  | {
      /** Failed conversion. */
      type: 'error';
      /** User-readable failure. */
      message: string;
    };

/** Runs one export off the page thread; cancellation also interrupts synchronous computation. */
export async function createPMTilesArchiveInWorker(
  input: Blob | string,
  options: PMTilesExampleOptions,
  signal: AbortSignal
): Promise<Blob> {
  signal.throwIfAborted();
  selectPMTilesExampleTiles(options.bounds, options.zoom);
  const worker = new Worker(new URL('./pmtiles-worker.ts', import.meta.url), {type: 'module'});
  return new Promise((resolve, reject) => {
    let settled = false;
    /** Releases computation and listeners on every completion path. */
    function finish(error?: unknown, archive?: Blob): void {
      if (settled) return;
      settled = true;
      signal.removeEventListener('abort', cancel);
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
      if (archive) resolve(archive);
      else reject(error);
    }
    /** Terminates the worker even while a parser or encoder is executing synchronously. */
    function cancel(): void {
      finish(signal.reason);
    }
    signal.addEventListener('abort', cancel, {once: true});
    worker.onmessage = (event: MessageEvent<PMTilesWorkerMessage>) => {
      if (settled) return;
      const message = event.data;
      if (
        message?.type === 'result' &&
        message.archive instanceof Blob &&
        message.archive.size > 0 &&
        message.archive.size <= PMTILES_EXAMPLE_LIMITS.outputBytes &&
        message.archive.type === 'application/vnd.pmtiles'
      )
        finish(undefined, message.archive);
      else if (message?.type === 'error' && typeof message.message === 'string')
        finish(new Error(message.message));
      else finish(new Error('Invalid or over-budget PMTiles worker result.'));
    };
    worker.onerror = event => {
      event.preventDefault();
      finish(new Error(event.message || 'PMTiles worker failed to start or run.'));
    };
    worker.onmessageerror = () => finish(new Error('Could not read the PMTiles worker result.'));
    if (signal.aborted) {
      cancel();
      return;
    }
    try {
      worker.postMessage({input, options} satisfies PMTilesWorkerRequest);
    } catch (error) {
      finish(error);
    }
  });
}
