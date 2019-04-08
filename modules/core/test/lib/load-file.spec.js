import {loadFile, registerLoaders} from '@loaders.gl/core';

import test from 'tape-promise/tape';

test('loadFile#loadFile', t => {
  t.ok(loadFile, 'loadFile defined');
  loadFile('.').then(loadedData => {
    t.ok(true, 'loadFile accepts undefined loaders');
    t.end();
  });
});

test('loadFile#auto detect loader', t => {
  registerLoaders({
    name: 'JSON',
    extensions: ['json'],
    parse: data => {
      t.ok(data instanceof ArrayBuffer, 'Got ArrayBuffer');
      t.end();
    }
  });
  loadFile('package.json');
});
