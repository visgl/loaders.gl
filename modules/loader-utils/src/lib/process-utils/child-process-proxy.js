// Forked from probe.gl under MIT license, Copyright (c) 2015 - 2017 Uber Technologies, Inc.

/* eslint-disable no-console */
/* global process, setTimeout, clearTimeout, console */
import ChildProcess from 'child_process';
import assert from '../env-utils/assert';
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
        const successTimer = setTimeout(() => {
          if (options.onSuccess) {
            options.onSuccess(this);
          }
          resolve({});
        }, options.wait);

        console.log(`Spawning ${options.command} ${options.arguments.join(' ')}`);
        this.childProcess = ChildProcess.spawn(options.command, args, options.spawn);

        // TODO - add option regarding whether stderr should be treated as data
        this.childProcess.stderr.on('data', data => {
          console.log(`Child process wrote to stderr: "${data}".`);
          clearTimeout(successTimer);
          reject(new Error(data));
        });
        this.childProcess.on('error', error => {
          console.log(`Child process errored with ${error}`);
          clearTimeout(successTimer);
          reject(error);
        });
        this.childProcess.on('close', code => {
          console.log(`Child process exited with ${code}`);
          this.childProcess = null;
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
}
