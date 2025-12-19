import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {formErrorHandler, normalizePort} from '../../../src/i3s-server/utils/server-utils';

test('tile-converter(i3s-server)#normalizePort', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  const result1 = normalizePort('8080');
  t.strictEquals(result1, 8080);

  const result2 = normalizePort('\\\\.\\pipe\\PIPE_NAME');
  t.strictEquals(result2, '\\\\.\\pipe\\PIPE_NAME');

  const result3 = normalizePort('-1000');
  t.strictEquals(result3, false);

  t.end();
});

test('tile-converter(i3s-server)#formErrorHandler', async (t) => {
  if (isBrowser) {
    t.end();
    return;
  }

  const func = formErrorHandler(8080);
  t.ok(func);

  t.end();
});
