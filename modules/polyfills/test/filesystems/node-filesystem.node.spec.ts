import {expect, test} from 'vitest';
import {NodeFilesystem} from '@loaders.gl/loader-utils';
import {isBrowser} from '@loaders.gl/core';
if (!isBrowser) {
  test('NodeFileSystem#import', () => {
    if (!NodeFilesystem) {
      console.log('NodeFileSystem not defined');
      return;
    }
    expect(NodeFilesystem, 'NodeFileSystem defined').toBeTruthy();
  });
}
