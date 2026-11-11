// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {MemoryLog} from 'probe.gl/log';
import {getLoaderLog} from '@loaders.gl/core/loader-utils';
import {NullLog, ConsoleLog} from '@loaders.gl/core/lib/loader-utils/loggers';

test('NullLog#methods', () => {
  const log = new NullLog();
  testLogger(log, 'NullLog');
});

test('ConsoleLog#methods', () => {
  const log = new ConsoleLog();
  testLogger(log, 'ConsoleLog');
});

function testLogger(log, logName) {
  expect(() => log.log(0, 'message')(), `${logName}.log()`).not.toThrow();
  expect(() => log.info(0, 'message')(), `${logName}.info()`).not.toThrow();
  expect(() => log.warn('message')(), `${logName}.warn()`).not.toThrow();
  expect(() => log.error('message')(), `${logName}.error()`).not.toThrow();
}

test('operation loggers capture diagnostics and scoped null suppresses a legacy logger', () => {
  const log = new MemoryLog();
  getLoaderLog({core: {log}}).warn('operation warning')();
  getLoaderLog({log, core: {log: null}}).warn('suppressed warning')();
  expect(log.messages.map(message => message.message)).toEqual(['operation warning']);
});
