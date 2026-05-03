import {expect, test} from 'vitest';
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
  expect(() => log.log()(), `${logName}.log()`).not.toThrow();
  expect(() => log.info()(), `${logName}.info()`).not.toThrow();
  expect(() => log.warn()(), `${logName}.warn()`).not.toThrow();
  expect(() => log.error()(), `${logName}.error()`).not.toThrow();
}
