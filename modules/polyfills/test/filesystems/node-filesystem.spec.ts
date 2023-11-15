// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {NodeFilesystem} from '@loaders.gl/loader-utils';

import {isBrowser} from '@loaders.gl/core';

if (!isBrowser) {
  test('NodeFileSystem#import', (t) => {
    if (!NodeFilesystem) {
      t.comment('NodeFileSystem not defined');
      t.end();
      return;
    }
    t.ok(NodeFilesystem, 'NodeFileSystem defined');
    t.end();
  });
}
