import test from 'tape-promise/tape';
import {isBrowser, resolvePath} from '@loaders.gl/core';
import {_NodeFileSystem as NodeFileSystem} from '@loaders.gl/core';

const IMAGE_URLS = [
  '@loaders.gl/images/test/data/img1-preview.png',
  '@loaders.gl/images/test/data/img1-preview.jpeg',
  '@loaders.gl/images/test/data/img1-preview.gif',
  '@loaders.gl/images/test/data/img1-preview.bmp'
];

test('NodeFileSystem#fetch', async (t) => {
  if (!isBrowser) {
    const fs = new NodeFileSystem({resolvePath});
    const {fetch} = fs;
    for (const url of IMAGE_URLS) {
      const response = await fetch(url);
      t.ok(response.ok, `fetching file from node file system: ${url}`);
      t.equal(response.status, 200, `fetching non-existent file from node file system set status`);
    }
    const response = await fetch('bogus.txt');
    t.notOk(response.ok, `fetching non-existent file from node file system fails`);
    t.equal(response.status, 400, `fetching non-existent file from node file system set status`);
  }
  t.end();
});
