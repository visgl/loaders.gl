import WorkerThread from './worker-thread';

/**
 * Process multiple data messages with small pool of identical workers
 */
export default class WorkerPool {
  constructor({
    source,
    name = 'unnamed',
    maxConcurrency = 1,
    onMessage,
    onDebug = () => {},
    reuseWorkers = true
  }) {
    this.source = source;
    this.name = name;
    this.maxConcurrency = maxConcurrency;
    this.onMessage = onMessage;
    this.onDebug = onDebug;

    this.jobQueue = [];
    this.idleQueue = [];
    this.count = 0;
    this.isDestroyed = false;
    this.reuseWorkers = reuseWorkers;
  }

  destroy() {
    // Destroy idle workers, active Workers will be destroyed on completion
    this.idleQueue.forEach(worker => worker.destroy());
    this.isDestroyed = true;
  }

  /**
   * Process binary data in a worker
   */
  process(data, jobName) {
    return new Promise((resolve, reject) => {
      this.jobQueue.push({data, jobName, resolve, reject});
      this._startQueuedJob();
    });
  }

  // PRIVATE

  async _startQueuedJob() {
    if (!this.jobQueue.length) {
      return;
    }
    const worker = this._getAvailableWorker();
    if (!worker) {
      return;
    }

    // We have a worker, dequeue and start the job
    const job = this.jobQueue.shift();

    // @ts-ignore
    this.onDebug({
      message: 'processing',
      worker: worker.name,
      job: job.jobName,
      backlog: this.jobQueue.length
    });

    try {
      job.resolve(await worker.process(job.data));
    } catch (error) {
      job.reject(error);
    } finally {
      this._onWorkerDone(worker);
    }
  }

  _onWorkerDone(worker) {
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

  _getAvailableWorker() {
    // If a worker has completed and returned to the queue, it can be used
    if (this.idleQueue.length > 0) {
      return this.idleQueue.shift();
    }

    // Create fresh worker if we haven't yet created the max amount of worker threads for this worker source
    if (this.count < this.maxConcurrency) {
      this.count++;
      const name = `${this.name.toLowerCase()} (#${this.count} of ${this.maxConcurrency})`;
      return new WorkerThread({source: this.source, onMessage: this.onMessage, name});
    }

    // No worker available, have to wait
    return null;
  }
}
