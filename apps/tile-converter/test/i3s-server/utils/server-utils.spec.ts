import {expect, test} from 'vitest';
import {isBrowser} from '@loaders.gl/core';
import {formErrorHandler, normalizePort} from '../../../src/i3s-server/utils/server-utils';
test('tile-converter(i3s-server)#normalizePort', async () => {
  if (isBrowser) {
    return;
  }
  const result1 = normalizePort('8080');
  expect(result1).toBe(8080);
  const result2 = normalizePort('\\\\.\\pipe\\PIPE_NAME');
  expect(result2).toBe('\\\\.\\pipe\\PIPE_NAME');
  const result3 = normalizePort('-1000');
  expect(result3).toBe(false);
});
test('tile-converter(i3s-server)#formErrorHandler', async () => {
  if (isBrowser) {
    return;
  }
  const func = formErrorHandler(8080);
  expect(func).toBeTruthy();
});
