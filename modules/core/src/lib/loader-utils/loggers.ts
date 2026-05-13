// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// probe.gl Log compatible loggers

import {Log} from '@probe.gl/log';

/** Default probe.gl logger used by loaders.gl. */
export const probeLog = new Log({id: 'loaders.gl'});

type LogFunction = () => void;

/** Logger implementation that intentionally drops all messages. */
export class NullLog {
  /** Drops a log message. */
  log(): LogFunction {
    return () => {};
  }
  /** Drops an info message. */
  info(): LogFunction {
    return () => {};
  }
  /** Logs one message once; no-op for the null logger. */
  once(): LogFunction {
    return () => {};
  }
  /** Drops a warning message. */
  warn(): LogFunction {
    return () => {};
  }
  /** Drops an error message. */
  error(): LogFunction {
    return () => {};
  }
}

/** Logger implementation that forwards messages to the global console. */
export class ConsoleLog {
  /** Console-like object used for message output. */
  console;
  /** Messages already emitted through `once`. */
  private onceMessages = new Set<string>();

  /** Creates a console-backed logger. */
  constructor() {
    this.console = console; // eslint-disable-line
  }
  /** Logs a message to the console. */
  log(...args: unknown[]): LogFunction {
    return this.console.log.bind(this.console, ...args);
  }
  /** Logs an informational message to the console. */
  info(...args: unknown[]): LogFunction {
    return this.console.info.bind(this.console, ...args);
  }
  /** Logs one message once to the console. */
  once(...args: unknown[]): LogFunction {
    const message = String(args[0]);
    if (this.onceMessages.has(message)) {
      return () => {};
    }
    this.onceMessages.add(message);
    return this.console.info.bind(this.console, ...args);
  }
  /** Logs a warning message to the console. */
  warn(...args: unknown[]): LogFunction {
    return this.console.warn.bind(this.console, ...args);
  }
  /** Logs an error message to the console. */
  error(...args: unknown[]): LogFunction {
    return this.console.error.bind(this.console, ...args);
  }
}
