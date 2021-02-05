import ChildProcess from 'child_process';

export type ProcessProxyOptions = {
  command: string;
  arguments: string[],
  /** Whether to add a port specified arg */
  portArg?: string,
  /** Base port number */
  port?: number,
  /** Whether to search for an available port if the base port is occupied */
  autoPort?: boolean,
  /** Number of milliseconds to wait until concluding success */
  /** wait: 0 - infinity */
  wait?: number,
  /** Options passed on to Node'.js `ChildProcess.spawn` */
  spawn?: ChildProcess.SpawnOptionsWithoutStdio,
  /** Callback when the  */
  onStart?: (proxy: ChildProcessProxy) => void
};

/**
 * Manager for a Node.js child process
 * Prepares arguments, starts, stops and tracks output
 */
export default class ChildProcessProxy {
  constructor(options?: {id?: string});

  /** Starts a child process with the provided options */
  start(options?: ProcessProxyOptions): Promise<object>;

  /** Stops a running child process */
  stop(): Promise<void>

  /** Exits this process */
  exit(statusCode?: number);
}
