/* eslint-disable max-len */
import test from 'tape-catch';
import {TextEncoder, getGLTFAttribute} from '@loaders.gl/core';
import {loadBinaryFile} from '@loaders.gl/core-node';
import {PCDLoader} from '@loaders.gl/pcd';
import path from 'path';

import PCD_ASCII from 'test-data/pcd/simple-ascii.pcd.js';
import {validateLoadedData} from '../conformance';

const PCD_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../data/pcd/Zaghetto.pcd')) ||
  require('test-data/pcd/Zaghetto.pcd');

test('PCDLoader#parseText', t => {
  const binaryPCD = new TextEncoder().encode(PCD_ASCII);

  const data = PCDLoader.parseBinary(binaryPCD);
  validateLoadedData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not found');

  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 639, 'POSITION attribute was found');
  t.equal(getGLTFAttribute(data, 'COLOR_0').value.length, 639, 'COLOR attribute was found');

  t.end();
});

test('PCDLoader#parseBinary', t => {
  const data = PCDLoader.parseBinary(PCD_BINARY);
  validateLoadedData(t, data);

  // Check internal loader data
  t.ok(data.loaderData.header, 'Original header was found');

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 179250, 'POSITION attribute was found');

  t.end();
});
