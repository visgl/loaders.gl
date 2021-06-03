export type WorkerThreadProps = {
  name: string;
  source?: string;
  url?: string;
};

/**
 * Represents one worker thread
 */
export default class WorkerThread {
  static isSupported(): boolean;

  readonly name: string;
  readonly terminated: boolean;

  onMessage: (message: any) => void;
  onError: (error: Error) => void;

  constructor(options: WorkerThreadProps);

  /**
   * Terminate this worker thread
   * @note Can free up significant memory
   */
  destroy(): void;

  /**
   * Send a message to this worker thread
   * @param data any data structure, ideally consisting mostly of transferrable objects
   * @param transferList If not supplied, calculated automatically by traversing data
   */
  postMessage(data: any, transferList?: any[]): void;
}
