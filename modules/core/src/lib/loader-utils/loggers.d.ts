export class NullLog {
  log(): any;
  info(): any;
  warn(): any;
  error(): any;
}

export class ConsoleLog {
  log(...args): any;
  info(...args): any;
  warn(...args): any;
  error(...args): any;
}
