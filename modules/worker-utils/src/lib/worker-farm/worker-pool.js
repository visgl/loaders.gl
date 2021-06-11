/** @typedef {import('../worker-protocol/protocol').WorkerMessageType} WorkerMessageType  */
/** @typedef {import('../worker-protocol/protocol').WorkerMessagePayload} WorkerMessagePayload */
import {isMobile} from '../env-utils/globals';
import {assert} from '../env-utils/assert';
import WorkerThread from './worker-thread';
import WorkerJob from './worker-job';

/**
 * @typedef {{
 *   name: string;
 *   onMessage: (job: WorkerJob, type: WorkerMessageType, payload: WorkerMessagePayload) => void,
 *   onError: (job: WorkerJob, error: Error) => void;
 *   onStart: (value: any) => void; // Resolve job start promise
 * }} QueuedJob
 */

export default class WorkerPool {
  constructor(props) {
    assert(props.source || props.url);

    this.source = props.source;
    this.url = props.url;

    this.name = 'undefined';
    this.maxConcurrency = 1;
    this.maxMobileConcurrency = 1;
    this.reuseWorkers = true;
    this.onDebug = () => {};

    /** @type {QueuedJob[]} */
    this.jobQueue = [];
    /** @type {WorkerThread[]} */
    this.idleQueue = [];
    this.count = 0;
    this.isDestroyed = false;

    this.props = {};
    this.setProps(props);
  }

  destroy() {
    // Destroy idle workers, active Workers will be destroyed on completion
    this.idleQueue.forEach((worker) => worker.destroy());
    this.isDestroyed = true;
  }

  setProps(props) {
    this.props = {...this.props, props};

    if ('name' in props) {
      this.name = props.name;
    }
    if ('maxConcurrency' in props) {
      this.maxConcurrency = props.maxConcurrency;
    }
    if ('maxMobileConcurrency' in props) {
      this.maxMobileConcurrency = props.maxMobileConcurrency;
    }
    if ('reuseWorkers' in props) {
      this.reuseWorkers = props.reuseWorkers;
    }
    if ('onDebug' in props) {
      this.onDebug = props.onDebug;
    }
  }

  async startJob(
    name,
    onMessage = (job, type, data) => job.done(data),
    onError = (job, error) => job.error(error)
  ) {
    // Promise resolves when thread starts working on this job
    const startPromise = new Promise((onStart) => {
      // Promise resolves when thread completes or fails working on this job
      this.jobQueue.push({name, onMessage, onError, onStart});
    });
    this._startQueuedJob();
    return startPromise;
  }

  // PRIVATE

  /**
   * @returns {Promise<void>}
   */
  async _startQueuedJob() {
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
        jobName: queuedJob.name,
        workerThread,
        backlog: this.jobQueue.length
      });

      // Create a worker job to let the app access thread and manage job completion
      const job = new WorkerJob(queuedJob.name, workerThread);

      // Set the worker thread's message handlers
      workerThread.onMessage = (data) => queuedJob.onMessage(job, data.type, data.payload);
      workerThread.onError = (error) => queuedJob.onError(job, error);

      // Resolve the start promise so that the app can start sending messages to worker
      queuedJob.onStart(job);

      // Wait for the app to signal that the job is complete, then return worker to queue
      try {
        await job.result;
      } finally {
        this.returnWorkerToQueue(workerThread);
      }
    }
  }

  returnWorkerToQueue(worker) {
    if (this.isDestroyed) {
      worker.destroy();
      return;
    }

    if (this.reuseWorkers) {
      this.idleQueue.push(worker);
    } else {
      worker.destroy();
      this.count--;
    }

    this._startQueuedJob();
  }

  /**
   * @returns {WorkerThread?}
   */
  _getAvailableWorker() {
    // If a worker has completed and returned to the queue, it can be used
    if (this.idleQueue.length > 0) {
      return this.idleQueue.shift() || null;
    }

    // Create fresh worker if we haven't yet created the max amount of worker threads for this worker source
    if (this.count < this._getMaxConcurrency()) {
      this.count++;
      const name = `${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`;
      return new WorkerThread({name, source: this.source, url: this.url});
    }

    // No worker available, have to wait
    return null;
  }

  _getMaxConcurrency() {
    return isMobile ? this.maxMobileConcurrency : this.maxConcurrency;
  }
}
