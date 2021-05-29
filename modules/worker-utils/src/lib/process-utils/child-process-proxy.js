// Forked from probe.gl under MIT license, Copyright (c) 2015 - 2017 Uber Technologies, Inc.

/* eslint-disable no-console */
import ChildProcess from 'child_process';
import {assert} from '../env-utils/assert';
import {getAvailablePort} from './process-utils';

const DEFAULT_PROCESS_OPTIONS = {
  command: null,
  arguments: [],
  portArg: null,
  port: 'auto',
  basePort: 5000,
  wait: 2000,
  nodeSpawnOptions: {maxBuffer: 5000 * 1024},
  onSuccess: processProxy => {
    console.log(`Started ${processProxy.options.command}`);
  }
};

export default class ChildProcessProxy {
  constructor({id = 'browser-driver'} = {}) {
    this.id = id;
    this.childProcess = null;
    this.port = null;
    this.successTimer = null;
    this.options = {};
  }

  async start(options = {}) {
    options = {...DEFAULT_PROCESS_OPTIONS, ...options};
    assert(options.command && typeof options.command === 'string');
    this.options = options;

    const args = [...options.arguments];

    // If portArg is set, we can look up an available port
    this.port = options.port;
    if (options.portArg) {
      if (this.port === 'auto') {
        this.port = await getAvailablePort(options.basePort);
      }
      args.push(options.portArg, this.port);
    }

    return await new Promise((resolve, reject) => {
      try {
        this._setTimeout(() => {
          if (options.onSuccess) {
            options.onSuccess(this);
          }
          resolve({});
        });

        console.log(`Spawning ${options.command} ${options.arguments.join(' ')}`);
        this.childProcess = ChildProcess.spawn(options.command, args, options.spawn);

        this.childProcess.stdout.on('data', data => {
          console.log(data.toString());
        });
        // TODO - add option regarding whether stderr should be treated as data
        this.childProcess.stderr.on('data', data => {
          console.log(`Child process wrote to stderr: "${data}".`);
          this._clearTimeout();
          reject(new Error(data));
        });
        this.childProcess.on('error', error => {
          console.log(`Child process errored with ${error}`);
          this._clearTimeout();
          reject(error);
        });
        this.childProcess.on('close', code => {
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

  async stop() {
    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = null;
    }
  }

  async exit(statusCode = 0) {
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

  _setTimeout(callback) {
    if (this.options.wait > 0) {
      this.successTimer = setTimeout(callback, this.options.wait);
    }
  }

  _clearTimeout() {
    if (this.successTimer) {
      clearTimeout(this.successTimer);
    }
  }
}
