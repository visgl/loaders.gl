export enum LogLevel {
    Debug,
    Info,
    Warn,
    Error,
}

export default class Logger {
    static logLevel: LogLevel = LogLevel.Warn;

    static debug(...args: any[]): void {
      this.log(LogLevel.Debug, ...args);
    }

    static info(...args: any[]): void {
      this.log(LogLevel.Info, ...args);
    }

    static warn(...args: any[]): void {
      this.log(LogLevel.Warn, ...args);
    }

    static error(...args: any[]): void {
      this.log(LogLevel.Error, ...args);
    }

    static log(level: LogLevel, ...args: any[]): void {
      if (this.logLevel > level) {
        return;
      }

      switch (level) {
        case LogLevel.Debug: {
          console.debug(...args);
          break;
        }
        case LogLevel.Info: {
          console.info(...args);
          break;
        }
        case LogLevel.Warn: {
          console.warn(...args);
          break;
        }
        case LogLevel.Error: {
          console.error(...args);
          break;
        }
      }
    }
}
