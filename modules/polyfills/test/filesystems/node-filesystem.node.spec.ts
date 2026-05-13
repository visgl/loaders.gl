import {expect, test} from 'vitest';
import {NodeFilesystem} from '@loaders.gl/loader-utils';

test('NodeFileSystem#import', () => {
  if (!NodeFilesystem) {
    console.log('NodeFileSystem not defined');
    return;
  }

  expect(NodeFilesystem, 'NodeFileSystem defined').toBeTruthy();
});
