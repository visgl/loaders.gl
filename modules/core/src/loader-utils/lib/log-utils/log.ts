// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Log, type Logger} from 'probe.gl/log';

// Version constant cannot be imported, it needs to correspond to the build version of **this** module.
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
export const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const version = VERSION[0] >= '0' && VERSION[0] <= '9' ? `v${VERSION}` : '';

// Make sure we set the global variable
function createLog() {
  const log = new Log({id: 'loaders.gl'});

  globalThis.loaders ||= {};
  globalThis.loaders.log = log;
  globalThis.loaders.version = version;

  globalThis.probe ||= {};
  globalThis.probe.loaders = log;

  return log;
}

export const log = createLog();

/** A logger that discards messages. */
export class NullLog implements Logger {
  /** Discards debug messages. */
  log() {
    return ignoreMessage;
  }
  /** Discards informational messages. */
  info() {
    return ignoreMessage;
  }
  /** Discards messages marked to be emitted once. */
  once() {
    return ignoreMessage;
  }
  /** Discards warnings. */
  warn() {
    return ignoreMessage;
  }
  /** Discards errors. */
  error() {
    return ignoreMessage;
  }
}

/** Discards a deferred log message. */
function ignoreMessage(): void {}

const nullLog = new NullLog();

/** Resolves a caller's operation logger. A null logger suppresses diagnostics. */
export function getLoaderLog(options?: {
  core?: {log?: Logger | null};
  log?: Logger | null;
}): Logger {
  const logger = options?.core?.log !== undefined ? options.core.log : options?.log;
  return logger === null ? nullLog : logger || log;
}
