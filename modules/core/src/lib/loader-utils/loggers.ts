// probe.gl Log compatible loggers
import {Log} from '@probe.gl/log';

export const probeLog = new Log({id: 'loaders.gl'});

// Logs nothing
export class NullLog {
  log() {
    return () => {};
  }
  info() {
    return () => {};
  }
  warn() {
    return () => {};
  }
  error() {
    return () => {};
  }
}

// Logs to console
export class ConsoleLog {
  console;

  constructor() {
    this.console = console; // eslint-disable-line
  }
  log(...args) {
    return this.console.log.bind(this.console, ...args);
  }
  info(...args) {
    return this.console.info.bind(this.console, ...args);
  }
  warn(...args) {
    return this.console.warn.bind(this.console, ...args);
  }
  error(...args) {
    return this.console.error.bind(this.console, ...args);
  }
}
