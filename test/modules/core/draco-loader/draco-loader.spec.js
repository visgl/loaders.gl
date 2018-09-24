/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile, DRACOLoader} from 'loaders.gl';
import path from 'path';

const BUNNY_DRC =
  loadBinaryFile(path.resolve(__dirname, '../data/draco/bunny.drc')) ||
  require('../data/draco/bunny.drc');

test('DRACOLoader#parse and encode', t => {
  const data = DRACOLoader.parseBinary(BUNNY_DRC);

  t.ok(data.header, 'Documents were found');
  t.equal(data.attributes.POSITION.length, 104502, 'position attribute was found');

  t.end();
});
