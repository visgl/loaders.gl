// loaders.gl, MIT license

import test from 'tape-promise/tape';
import {NodeFileSystem} from '@loaders.gl/polyfills';

import {isBrowser} from '@loaders.gl/core';

if (!isBrowser) {

  test('NodeFileSystem#import', (t) => {
    if (!NodeFileSystem) {
      t.comment('NodeFileSystem not defined');
      t.end();
      return;
    }
    t.ok(NodeFileSystem, 'NodeFileSystem defined');
    t.end();
  });

}
