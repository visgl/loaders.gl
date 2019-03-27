import {loadFile} from '@loaders.gl/core';

import test from 'tape-promise/tape';

test('loadFile#loadFile', t => {
  t.ok(loadFile, 'loadFile defined');
  t.ok(loadFile('.'), 'loadFile accepts undefined loaders');
  t.end();
});
