import WorkerJob from './worker-job';
// TODO circular subdir dependency
import {WorkerMessageType, WorkerMessagePayload} from '../worker-protocol/protocol';

/**
 * @param maxConcurrency - max count of workers
 */
export type WorkerPoolProps = {
  name?: string;
  url?: string;
  source?: string; // | Function;
  maxConcurrency?: number;
  maxMobileConcurrency?: number;
  onDebug?: (options: OnDebugParameters) => any;
  reuseWorkers?: boolean;
};

type OnDebugParameters = {
  message: string;
  worker: string;
  job: string;
  backlog: number;
};

/**
 * Process multiple data messages with small pool of identical workers
 */
export default class WorkerPool {
  readonly maxConcurrency: number;

  constructor(props: WorkerPoolProps);

  /**
   * Terminates all workers in the pool
   * @note Can free up significant memory
   */
  destroy(): void;

  setProps(props: WorkerPoolProps): void;

  /**
   * Start up a worker thread from the pool
   * @param jobName For debug purposes
   * @param onMessage Callback to handle messages from the worker
   * @param onError Callback to handle errors from the worker
   * @returns A promise that resolves to a WorkerThread that has been started with `start()`.
   */
  startJob(
    jobName: string,
    onMessage?: (job: WorkerJob, type: WorkerMessageType, payload: WorkerMessagePayload) => void,
    onError?: (job: WorkerJob, error: Error) => void
  ): Promise<WorkerJob>;

  /**
   * Resolves the Promise returned from `start`.
   * @note This is a book-keeping function, it does not affect the worker thread itself.
   */
  endJob(value: any): void;

  /**
   * Rejects the Promise returned from `start()`.
   * @note This is a book-keeping function, it does not affect the worker thread itself.
   */
  endJob(error: Error): void;
}
