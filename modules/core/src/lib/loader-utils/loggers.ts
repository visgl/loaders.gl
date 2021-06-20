// probe.gl Log compatible loggers

// Logs nothing
export class NullLog {
  log() {
    return (_) => {};
  }
  info() {
    return (_) => {};
  }
  warn() {
    return (_) => {};
  }
  error() {
    return (_) => {};
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
