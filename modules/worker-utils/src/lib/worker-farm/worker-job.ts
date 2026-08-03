// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WorkerMessageType, WorkerMessagePayload} from '../../types';
import WorkerThread from './worker-thread';

/**
 * Represents one Job handled by a WorkerPool or WorkerFarm
 */
export default class WorkerJob {
  readonly name: string;
  readonly workerThread: WorkerThread;
  isRunning: boolean = true;
  /** Promise that resolves when Job is done */
  readonly result: Promise<any>;

  private _resolve: (value: any) => void = () => {};
  private _reject: (reason?: any) => void = () => {};

  constructor(jobName: string, workerThread: WorkerThread) {
    this.name = jobName;
    this.workerThread = workerThread;
    this.result = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  /**
   * Send a message to the job's worker thread
   * @param data any data structure, ideally consisting mostly of transferrable objects
   */
  postMessage(type: WorkerMessageType, payload: WorkerMessagePayload): void {
    this.workerThread.postMessage({
      source: 'loaders.gl', // Lets worker ignore unrelated messages
      type,
      payload
    });
  }

  /**
   * Call to resolve the `result` Promise with the supplied value
   */
  done(value: any): void {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    this._resolve(value);
  }

  /**
   * Call to reject the `result` Promise with the supplied error
   */
  error(error: Error): void {
    if (!this.isRunning) {
      return;
    }
    this.isRunning = false;
    this._reject(error);
  }

  /** Terminates the worker executing this job and rejects its result with an abort error. */
  abort(): void {
    if (!this.isRunning) {
      return;
    }
    const error = new Error(`Worker job "${this.name}" was aborted`);
    error.name = 'AbortError';
    this.workerThread.destroy();
    this.error(error);
  }
}
