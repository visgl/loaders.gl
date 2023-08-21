import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {MaxarLoader} from '../src';

const testUrl = '@loaders.gl/3d-tiles/test/data/bridges.3tz';

test('maxarLoader#load uncompressed file', async (t) => {
  const uncompressedFile = await load(testUrl, MaxarLoader, {maxar: {path: 'tileset.json'}});
  t.deepEqual(uncompressedFile.byteLength, 2420, 'tileset.json has the correct length');
  t.end();
});

test('maxarLoader#load deflated file', async (t) => {
  const uncompressedFile = await load(testUrl, MaxarLoader, {maxar: {path: '13/5081/4739.glb'}});
  t.deepEqual(uncompressedFile.byteLength, 36032, 'tileset.json has the correct length');
  t.end();
});
