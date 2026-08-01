// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoadWorker, WorkerMessageType, WorkerMessagePayload, WorkerOptions} from '../../types';
import {isMobile} from '../env-utils/globals';
import WorkerThread from './worker-thread';
import WorkerJob from './worker-job';

/** WorkerPool onDebug Callback Parameters */
type OnDebugParameters = {
  message: string;
  worker: string;
  name: string;
  job: string;
  backlog: number;
  workerThread: WorkerThread;
};

/** WorkerPool Properties */
export type WorkerPoolProps = {
  /** Human-readable worker pool name. */
  name?: string;
  /** Inline worker source used for source-backed workers. */
  source?: string; // | Function;
  /** Worker script URL used for URL-backed workers. */
  url?: string;
  /** Lazily resolves a fallback worker URL if loadWorker is unavailable. */
  getUrl?: () => string;
  /** Creates a browser Worker instance without going through a URL string. */
  loadWorker?: LoadWorker;
  /** Worker options forwarded to loadWorker. */
  loadWorkerOptions?: WorkerOptions;
  /** Maximum number of workers to run concurrently on desktop browsers or Node.js. */
  maxConcurrency?: number;
  /** Maximum number of workers to run concurrently on mobile browsers. */
  maxMobileConcurrency?: number;
  /** Debug callback invoked when jobs are started. */
  onDebug?: (options: OnDebugParameters) => any;
  /** Whether workers should be reused after completing a job. */
  reuseWorkers?: boolean;
};

/** Worker pool lookup options, including values that only affect pool identity. */
export type WorkerPoolTarget = WorkerPoolProps & {
  /** Worker name used as the base pool identity. */
  name: string;
  /** Stable cache key for a lazily resolved fallback URL. */
  urlKey?: string;
};

/** Private helper types */
type OnMessage = (job: WorkerJob, type: WorkerMessageType, payload: WorkerMessagePayload) => void;
type OnError = (job: WorkerJob, error: Error) => void;

type QueuedJob = {
  name: string;
  onMessage: OnMessage;
  onError: OnError;
  onStart: (value: any) => void; // Resolve job start promise
};

/**
 * Process multiple data messages with small pool of identical workers
 */
export default class WorkerPool {
  /** Human-readable worker pool name. */
  name: string = 'unnamed';
  /** Inline worker source used for source-backed workers. */
  source?: string; // | Function;
  /** Worker script URL used for URL-backed workers. */
  url?: string;
  /** Lazily resolves a fallback worker URL if loadWorker is unavailable. */
  getUrl?: () => string;
  /** Creates a browser Worker instance without going through a URL string. */
  loadWorker?: LoadWorker;
  /** Worker options forwarded to loadWorker. */
  loadWorkerOptions?: WorkerOptions;
  /** Maximum number of workers to run concurrently on desktop browsers or Node.js. */
  maxConcurrency: number = 1;
  /** Maximum number of workers to run concurrently on mobile browsers. */
  maxMobileConcurrency: number = 1;
  /** Debug callback invoked when jobs are started. */
  onDebug: (options: OnDebugParameters) => any = () => {};
  /** Whether workers should be reused after completing a job. */
  reuseWorkers: boolean = true;

  private props: WorkerPoolProps = {};
  private jobQueue: QueuedJob[] = [];
  private idleQueue: WorkerThread[] = [];
  private count = 0;
  private isDestroyed = false;

  /** Checks if workers are supported on this platform */
  static isSupported(): boolean {
    return WorkerThread.isSupported();
  }

  /**
   * @param props Worker pool properties.
   */
  constructor(props: WorkerPoolProps) {
    this.source = props.source;
    this.url = props.url;
    this.getUrl = props.getUrl;
    this.loadWorker = props.loadWorker;
    this.loadWorkerOptions = props.loadWorkerOptions;
    this.setProps(props);
  }

  /**
   * Terminates all workers in the pool
   * @note Can free up significant memory
   */
  destroy(): void {
    // Destroy idle workers, active Workers will be destroyed on completion
    this.idleQueue.forEach(worker => worker.destroy());
    this.isDestroyed = true;
  }

  /**
   * Updates worker pool configuration.
   * @param props Worker pool properties to merge into the current pool.
   */
  setProps(props: WorkerPoolProps) {
    this.props = {...this.props, ...props};

    if (props.name !== undefined) {
      this.name = props.name;
    }
    if (props.maxConcurrency !== undefined) {
      this.maxConcurrency = props.maxConcurrency;
    }
    if (props.maxMobileConcurrency !== undefined) {
      this.maxMobileConcurrency = props.maxMobileConcurrency;
    }
    if (props.reuseWorkers !== undefined) {
      this.reuseWorkers = props.reuseWorkers;
    }
    if (props.onDebug !== undefined) {
      this.onDebug = props.onDebug;
    }
  }

  async startJob(
    name: string,
    onMessage: OnMessage = (job, type, data) => job.done(data),
    onError: OnError = (job, error) => job.error(error)
  ): Promise<WorkerJob> {
    // Promise resolves when thread starts working on this job
    const startPromise = new Promise<WorkerJob>(onStart => {
      // Promise resolves when thread completes or fails working on this job
      this.jobQueue.push({name, onMessage, onError, onStart});
      return this;
    });
    this._startQueuedJob(); // eslint-disable-line @typescript-eslint/no-floating-promises
    return await startPromise;
  }

  // PRIVATE

  /**
   * Starts first queued job if worker is available or can be created
   * Called when job is started and whenever a worker returns to the idleQueue
   */
  async _startQueuedJob(): Promise<void> {
    if (!this.jobQueue.length) {
      return;
    }

    const workerThread = this._getAvailableWorker();
    if (!workerThread) {
      return;
    }

    // We have a worker, dequeue and start the job
    const queuedJob = this.jobQueue.shift();
    if (queuedJob) {
      // Emit a debug event
      // @ts-ignore
      this.onDebug({
        message: 'Starting job',
        name: queuedJob.name,
        workerThread,
        backlog: this.jobQueue.length
      });

      // Create a worker job to let the app access thread and manage job completion
      const job = new WorkerJob(queuedJob.name, workerThread);
      workerThread.ref();

      // Set the worker thread's message handlers
      workerThread.onMessage = data => queuedJob.onMessage(job, data.type, data.payload);
      workerThread.onError = error => queuedJob.onError(job, error);

      // Resolve the start promise so that the app can start sending messages to worker
      queuedJob.onStart(job);

      // Wait for the app to signal that the job is complete, then return worker to queue
      try {
        await job.result;
      } catch {
        // The job result promise carries worker errors back to the caller; do not duplicate-log
        // handled rejections here.
      } finally {
        this.returnWorkerToQueue(workerThread);
      }
    }
  }

  /**
   * Returns a worker to the idle queue
   * Destroys the worker if
   *  - pool is destroyed
   *  - if this pool doesn't reuse workers
   *  - if maxConcurrency has been lowered
   * @param worker
   */
  returnWorkerToQueue(worker: WorkerThread) {
    const shouldDestroyWorker =
      // If the pool is destroyed, there is no reason to keep the worker around
      this.isDestroyed ||
      // If the app has disabled worker reuse, any completed workers should be destroyed
      !this.reuseWorkers ||
      // If concurrency has been lowered, this worker might be surplus to requirements
      this.count > this._getMaxConcurrency();

    if (shouldDestroyWorker) {
      worker.destroy();
      this.count--;
    } else {
      worker.unref();
      this.idleQueue.push(worker);
    }

    if (!this.isDestroyed) {
      this._startQueuedJob(); // eslint-disable-line @typescript-eslint/no-floating-promises
    }
  }

  /**
   * Returns idle worker or creates new worker if maxConcurrency has not been reached
   */
  _getAvailableWorker(): WorkerThread | null {
    // If a worker has completed and returned to the queue, it can be used
    if (this.idleQueue.length > 0) {
      return this.idleQueue.shift() || null;
    }

    // Create fresh worker if we haven't yet created the max amount of worker threads for this worker source
    if (this.count < this._getMaxConcurrency()) {
      this.count++;
      const name = `${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`;
      return new WorkerThread({
        name,
        source: this.source,
        url: this.url,
        getUrl: this.getUrl,
        loadWorker: this.loadWorker,
        loadWorkerOptions: this.loadWorkerOptions
      });
    }

    // No worker available, have to wait
    return null;
  }

  _getMaxConcurrency() {
    return isMobile ? this.maxMobileConcurrency : this.maxConcurrency;
  }
}
