/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';

if (!isBrowser) {

  test('TextEncoder', (t) => {
    t.ok(new TextEncoder(), 'TextEncoder successfully instantiated (available or polyfilled)');
    t.end();
  });

  test('TextDecoder', async (t) => {
    t.ok(new TextDecoder(), 'TextDecoder successfully instantiated (available or polyfilled)');

    const buffer = Buffer.from('México', 'latin1');
    const arrayBuffer = buffer;
    t.ok(arrayBuffer, 'node Buffer parses latin1 ');

    const textDecoder = new TextDecoder('latin1');
    t.ok(textDecoder, 'TextDecoder successfully instantiated (available or polyfilled)');
    t.equals(textDecoder.decode(arrayBuffer), 'México');  

    t.end();
  });
}
