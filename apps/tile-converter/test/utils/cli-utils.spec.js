import {
  getBooleanValue,
  getIntegerValue,
  getStringValue,
  getURLValue,
  validateOptionsWithEqual
} from '../../src/lib/utils/cli-utils';
import {expect, test} from 'vitest';
test('tile-converter(utils)#reads a string value', async () => {
  expect(getStringValue(0, ['', 'string'])).toBe('string');
});
test('tile-converter(utils)#handles a wrong string value', async () => {
  expect(getStringValue(0, ['', '--string'])).toBe('');
});
test('tile-converter(utils)#reads a URL value', async () => {
  expect(getURLValue(0, ['', 'host\\path'])).toBe('host/path');
});
test('tile-converter(utils)#reads a number value', async () => {
  expect(getIntegerValue(0, ['', '123'])).toBe(123);
});
test('tile-converter(utils)#handles a wrong number value', async () => {
  expect(getIntegerValue(0, ['', 'string'])).toBeFalsy();
});
test('tile-converter(utils)#reads a boolean value', async () => {
  expect(getBooleanValue(0, ['', 'true'])).toBe(true);
});
test('tile-converter(utils)#handles a wrong boolean value', async () => {
  expect(getBooleanValue(0, ['', 'string'])).toBe(false);
});
test('tile-converter(utils)#parses "=" pairs', async () => {
  const expected = ['--arg1', 'someValue', '--argWithNoValue'];
  expect(
    validateOptionsWithEqual(['--arg1=someValue', '--argWithNoValue']).every(
      (val, index) => val === expected[index]
    )
  ).toBe(true);
});
