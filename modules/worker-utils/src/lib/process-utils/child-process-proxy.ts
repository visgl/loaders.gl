/* eslint-disable no-console */
import {spawn, ChildProcess, SpawnOptionsWithoutStdio} from 'child_process';
import {getAvailablePort} from './process-utils';

export type ChildProcessProxyProps = {
  command: string;
  arguments: string[];
  /** Whether to add a port specified arg */
  portArg?: string;
  /** Base port number */
  port?: number;
  /** Whether to search for an available port if the base port is occupied */
  autoPort?: boolean;
  /** Number of milliseconds to wait until concluding success */
  /** wait: 0 - infinity */
  wait?: number;
  /** Options passed on to Node'.js `spawn` */
  spawn?: SpawnOptionsWithoutStdio;
  /** Callback when the  */
  onStart?: (proxy: ChildProcessProxy) => void;
  onSuccess?: (proxy: ChildProcessProxy) => void;
};

const DEFAULT_PROPS: ChildProcessProxyProps = {
  command: '',
  arguments: [],
  port: 5000,
  autoPort: true,
  wait: 2000,
  onSuccess: (processProxy) => {
    console.log(`Started ${processProxy.props.command}`);
  }
};

/**
 * Manager for a Node.js child process
 * Prepares arguments, starts, stops and tracks output
 */
export default class ChildProcessProxy {
  id: string;
  props: ChildProcessProxyProps = {...DEFAULT_PROPS};
  private childProcess: ChildProcess | null = null;
  private port: number = 0;
  private successTimer?;

  // constructor(props?: {id?: string});
  constructor({id = 'browser-driver'} = {}) {
    this.id = id;
  }

  /** Starts a child process with the provided props */
  async start(props: ChildProcessProxyProps): Promise<object> {
    props = {...DEFAULT_PROPS, ...props};
    this.props = props;

    const args = [...props.arguments];

    // If portArg is set, we can look up an available port
    this.port = Number(props.port);
    if (props.portArg) {
      if (props.autoPort) {
        this.port = await getAvailablePort(props.port);
      }
      args.push(props.portArg, String(this.port));
    }

    return await new Promise((resolve, reject) => {
      try {
        this._setTimeout(() => {
          if (props.onSuccess) {
            props.onSuccess(this);
          }
          resolve({});
        });

        console.log(`Spawning ${props.command} ${props.arguments.join(' ')}`);
        const childProcess = spawn(props.command, args, props.spawn);
        this.childProcess = childProcess;

        childProcess.stdout.on('data', (data) => {
          console.log(data.toString());
        });
        // TODO - add option regarding whether stderr should be treated as data
        childProcess.stderr.on('data', (data) => {
          console.log(`Child process wrote to stderr: "${data}".`);
          this._clearTimeout();
          reject(new Error(data));
        });
        childProcess.on('error', (error) => {
          console.log(`Child process errored with ${error}`);
          this._clearTimeout();
          reject(error);
        });
        childProcess.on('close', (code) => {
          console.log(`Child process exited with ${code}`);
          this.childProcess = null;
          this._clearTimeout();
          resolve({});
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /** Stops a running child process */
  async stop(): Promise<void> {
    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = null;
    }
  }

  /** Exits this process */
  async exit(statusCode: number = 0): Promise<void> {
    try {
      await this.stop();
      // eslint-disable-next-line no-process-exit
      process.exit(statusCode);
    } catch (error) {
      console.error(error.message || error);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }

  _setTimeout(callback: (...args: any[]) => void) {
    if (Number(this.props.wait) > 0) {
      this.successTimer = setTimeout(callback, this.props.wait);
    }
  }

  _clearTimeout() {
    if (this.successTimer) {
      clearTimeout(this.successTimer);
    }
  }
}
