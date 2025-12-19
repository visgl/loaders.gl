import {
  getBooleanValue,
  getIntegerValue,
  getStringValue,
  getURLValue,
  validateOptionsWithEqual
} from '../../src/lib/utils/cli-utils';
import test from 'tape-promise/tape';

test('tile-converter(utils)#reads a string value', async (t) => {
  t.equal(getStringValue(0, ['', 'string']), 'string');
  t.end();
});

test('tile-converter(utils)#handles a wrong string value', async (t) => {
  t.equal(getStringValue(0, ['', '--string']), '');
  t.end();
});

test('tile-converter(utils)#reads a URL value', async (t) => {
  t.equal(getURLValue(0, ['', 'host\\path']), 'host/path');
  t.end();
});

test('tile-converter(utils)#reads a number value', async (t) => {
  t.equal(getIntegerValue(0, ['', '123']), 123);
  t.end();
});

test('tile-converter(utils)#handles a wrong number value', async (t) => {
  t.notOk(getIntegerValue(0, ['', 'string']));
  t.end();
});

test('tile-converter(utils)#reads a boolean value', async (t) => {
  t.equal(getBooleanValue(0, ['', 'true']), true);
  t.end();
});

test('tile-converter(utils)#handles a wrong boolean value', async (t) => {
  t.equal(getBooleanValue(0, ['', 'string']), false);
  t.end();
});

test('tile-converter(utils)#parses "=" pairs', async (t) => {
  const expected = ['--arg1', 'someValue', '--argWithNoValue'];
  t.true(
    validateOptionsWithEqual(['--arg1=someValue', '--argWithNoValue']).every(
      (val, index) => val === expected[index]
    )
  );
  t.end();
});
