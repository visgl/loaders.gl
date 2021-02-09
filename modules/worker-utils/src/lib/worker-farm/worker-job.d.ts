import WorkerThread from './worker-thread';
// TODO circular subdir dependency
import {WorkerMessageType, WorkerMessagePayload} from '../worker-protocol/protocol';

/**
 * Represents one Job handled by a WorkerPool or WorkerFarm
 */
export default class WorkerJob {
  readonly name: string;
  readonly workerThread: WorkerThread;
  readonly isRunning: boolean;
  /** Promise that resolves when Job is done */
  readonly result: Promise<any>;

  constructor(jobName: string, workerThread: WorkerThread);

  /**
   * Send a message to the job's worker thread
   * @param data any data structure, ideally consisting mostly of transferrable objects
   */
  postMessage(type: WorkerMessageType, payload: WorkerMessagePayload): void;

  /**
   * Call to resolve the `result` Promise with the supplied value
   */
  done(value): void;

  /**
   * Call to reject the `result` Promise with the supplied error
   */
  error(error): void;
}
