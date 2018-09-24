/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile, PCDLoader, TextEncoder} from 'loaders.gl';
import path from 'path';

import PCD_ASCII from '../data/pcd/simple-ascii.pcd.js';

const PCD_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../data/pcd/Zaghetto.pcd')) ||
  require('../data/pcd/Zaghetto.pcd');

test('PCDLoader#parseText', t => {
  const binaryPCD = new TextEncoder().encode(PCD_ASCII);

  const data = PCDLoader.parseBinary(binaryPCD);

  t.ok(data.header, 'Documents were found');
  t.equal(data.attributes.position.length, 639, 'position attribute was found');
  t.equal(data.attributes.color.length, 639, 'Color attribute was found');

  t.end();
});

test('PCDLoader#parseBinary', t => {
  const data = PCDLoader.parseBinary(PCD_BINARY);

  t.ok(data.header, 'Documents were found');
  t.equal(data.attributes.position.length, 179250, 'position attribute was found');

  t.end();
});
