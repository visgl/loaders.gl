import {load, registerLoaders} from '@loaders.gl/core';

import test from 'tape-promise/tape';

test('load#load', t => {
  t.ok(load, 'load defined');
  load('.').then(loadedData => {
    t.ok(true, 'load accepts undefined loaders');
    t.end();
  });
});

test('load#auto detect loader', t => {
  registerLoaders({
    name: 'JSON',
    extensions: ['json'],
    parse: data => {
      t.ok(data instanceof ArrayBuffer, 'Got ArrayBuffer');
      t.end();
    }
  });
  load('package.json');
});
