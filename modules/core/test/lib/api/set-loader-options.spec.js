import test from 'tape-promise/tape';
import {setLoaderOptions, getLoaderOptions} from '@loaders.gl/core';

test('setLoaderOptions', (t) => {
  setLoaderOptions({});
  t.end();
});

test('getLoaderOptions', (t) => {
  const options1 = getLoaderOptions();
  t.notOk(options1._worker);
  setLoaderOptions({
    _worker: 'test'
  });
  const options2 = getLoaderOptions();
  t.equals(options2._worker, 'test');
  t.end();
});
