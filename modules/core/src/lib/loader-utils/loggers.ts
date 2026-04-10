// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// probe.gl Log compatible loggers

import {Log} from '@probe.gl/log';

export const probeLog = new Log({id: 'loaders.gl'});

type LogFunction = () => void;

// Logs nothing
export class NullLog {
  log(): LogFunction {
    return () => {};
  }
  info(): LogFunction {
    return () => {};
  }
  warn(): LogFunction {
    return () => {};
  }
  error(): LogFunction {
    return () => {};
  }
}

// Logs to console
export class ConsoleLog {
  console;

  constructor() {
    this.console = console; // eslint-disable-line
  }
  log(...args: unknown[]): LogFunction {
    return this.console.log.bind(this.console, ...args);
  }
  info(...args: unknown[]): LogFunction {
    return this.console.info.bind(this.console, ...args);
  }
  warn(...args: unknown[]): LogFunction {
    return this.console.warn.bind(this.console, ...args);
  }
  error(...args: unknown[]): LogFunction {
    return this.console.error.bind(this.console, ...args);
  }
}
