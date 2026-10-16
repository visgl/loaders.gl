// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  PMTILES_EXAMPLE_LIMITS,
  selectPMTilesExampleTiles,
  type PMTilesExampleProgress,
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
      /** Actual stage, source bytes and tile counters. */
      type: 'progress';
      /** Cloneable snapshot from the worker. */
      progress: PMTilesExampleProgress;
    }
  | {
      /** Failed conversion. */
      type: 'error';
      /** User-readable failure. */
      message: string;
    };

/** Page-owned callbacks and a separate signal for emitting partial work. */
export type PMTilesWorkerControls = {
  /** Receives conversion stage and measured counters. */
  onProgress?: (progress: PMTilesExampleProgress) => void;
  /** Requests packaging at the next tile boundary; does not cancel the worker. */
  finishSignal?: AbortSignal;
};

/** Runs one export off the page thread; cancellation also interrupts synchronous computation. */
export async function createPMTilesArchiveInWorker(
  input: Blob | string,
  options: PMTilesExampleOptions,
  signal: AbortSignal,
  controls: PMTilesWorkerControls = {}
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
      controls.finishSignal?.removeEventListener('abort', requestFinish);
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
    /** Keeps the worker alive to serialize completed tiles into a valid archive. */
    function requestFinish(): void {
      if (settled) return;
      try {
        worker.postMessage({type: 'finish'});
      } catch (error) {
        finish(error);
      }
    }
    signal.addEventListener('abort', cancel, {once: true});
    controls.finishSignal?.addEventListener('abort', requestFinish, {once: true});
    worker.onmessage = (event: MessageEvent<PMTilesWorkerMessage>) => {
      if (settled) return;
      const message = event.data;
      if (message?.type === 'progress') {
        if (!validateProgress(message.progress)) {
          finish(new Error('Invalid PMTiles worker progress.'));
          return;
        }
        try {
          controls.onProgress?.(message.progress);
        } catch (error) {
          finish(error);
        }
        return;
      }
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
      if (controls.finishSignal?.aborted) requestFinish();
    } catch (error) {
      finish(error);
    }
  });
}

/** Rejects malformed snapshots before they become UI state. */
function validateProgress(progress: PMTilesExampleProgress): boolean {
  return Boolean(
    progress &&
      ['reading', 'parsing', 'tiles', 'packaging', 'complete'].includes(progress.phase) &&
      Number.isSafeInteger(progress.totalTiles) &&
      progress.totalTiles > 0 &&
      progress.totalTiles <= PMTILES_EXAMPLE_LIMITS.tiles &&
      Number.isSafeInteger(progress.completedTiles) &&
      progress.completedTiles >= 0 &&
      progress.completedTiles <= progress.totalTiles &&
      (progress.bytesRead === null ||
        (Number.isSafeInteger(progress.bytesRead) && progress.bytesRead >= 0)) &&
      Number.isSafeInteger(progress.outputBytes) &&
      progress.outputBytes >= 0 &&
      progress.outputBytes <= PMTILES_EXAMPLE_LIMITS.outputBytes &&
      (progress.currentTile === undefined || typeof progress.currentTile === 'string')
  );
}
