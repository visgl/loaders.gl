import test from 'tape-promise/tape';
import {NullLog, ConsoleLog} from '@loaders.gl/core/lib/loader-utils/loggers';

test('NullLog#methods', (t) => {
  const log = new NullLog();
  testLogger(t, log, 'NullLog');
  t.end();
});

test('ConsoleLog#methods', (t) => {
  const log = new ConsoleLog();
  testLogger(t, log, 'ConsoleLog');
  t.end();
});

function testLogger(t, log, logName) {
  t.doesNotThrow(() => log.log()(), `${logName}.log()`);
  t.doesNotThrow(() => log.info()(), `${logName}.info()`);
  t.doesNotThrow(() => log.warn()(), `${logName}.warn()`);
  t.doesNotThrow(() => log.error()(), `${logName}.error()`);
}
