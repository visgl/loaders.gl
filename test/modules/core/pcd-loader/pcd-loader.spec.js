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

  // Check internal loader data
  t.ok(data.loaderData.header, 'Original header was found');
  t.equal(data.loaderData.attributes.position.length, 639, 'position attribute was found');
  t.equal(data.loaderData.attributes.color.length, 639, 'color attribute was found');

  // Check normalized data
  t.ok(data.header, 'Header was found');

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not found');
  t.equal(data.attributes.POSITION.bufferView.length, 639, 'POSITION attribute was found');
  t.equal(data.attributes.COLOR_0.bufferView.length, 639, 'COLOR attribute was found');

  t.end();
});

test('PCDLoader#parseBinary', t => {
  const data = PCDLoader.parseBinary(PCD_BINARY);

  // Check internal loader data
  t.ok(data.loaderData.header, 'Original header was found');
  t.equal(data.loaderData.attributes.position.length, 179250, 'position attribute was found');

  // Check normalized data
  t.ok(data.header, 'Header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not found');
  t.equal(data.attributes.POSITION.bufferView.length, 179250, 'POSITION attribute was found');

  t.end();
});
