import {onMessageFunc} from './worker-thread';

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
  /**
   * @param processor - worker function
   * @param maxConcurrency - max count of workers
   */
  constructor(options: {
    source: string | Function;
    name?: string;
    maxConcurrency?: number;
    onMessage?: onMessageFunc,
    onDebug?: (options: OnDebugParameters) => any;
    reuseWorkers?: boolean;
  });

  /**
   * Process binary data in a worker
   * @param data data (containing binary typed arrays) to be transferred to worker
   * @param jobName name of the job
   * @returns a Promise with data (containing typed arrays) transferred back from worker
   */
  process(data: any, jobName?: string): Promise<any>;

  destroy(): void;
}
