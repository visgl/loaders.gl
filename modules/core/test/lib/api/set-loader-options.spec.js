import test from 'tape-promise/tape';
import {setLoaderOptions} from '@loaders.gl/core';

test('setLoaderOptions', (t) => {
  setLoaderOptions({});
  t.end();
});
