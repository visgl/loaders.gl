/* eslint-disable max-len */
import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';
import {isBrowser} from '@loaders.gl/polyfills/utils/globals';

test('Node image polyfills', (t) => {
  if (!isBrowser) {
    // @ts-ignore
    t.equals(typeof _encodeImageNode, 'function', 'global._encodeImageNode successfully installed');
    // @ts-ignore
    t.equals(typeof _parseImageNode, 'function', 'global._parseImageNode successfully installed');
  }
  t.end();
});
