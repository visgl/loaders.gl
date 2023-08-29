import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {Tiles3DArchiveFileLoader} from '../src';

const testUrl = '@loaders.gl/3d-tiles/test/data/bridges.3tz';

test('tz3Loader#load uncompressed file', async (t) => {
  const uncompressedFile = await load(testUrl, Tiles3DArchiveFileLoader, {
    tz3: {path: 'tileset.json'}
  });
  t.deepEqual(uncompressedFile.byteLength, 2420, 'tileset.json has the correct length');
  t.end();
});

test('tz3Loader#load deflated file', async (t) => {
  const uncompressedFile = await load(testUrl, Tiles3DArchiveFileLoader, {
    tz3: {path: '13/5081/4739.glb'}
  });
  t.deepEqual(uncompressedFile.byteLength, 36032, 'tileset.json has the correct length');
  t.end();
});
