/* eslint-disable max-len */
import test from 'tape-catch';
import {TextEncoder} from '@loaders.gl/core';
import {loadBinaryFile} from '@loaders.gl/core-node';
import {PCDLoader} from '@loaders.gl/pcd';
import path from 'path';

import PCD_ASCII from 'test-data/pcd/simple-ascii.pcd.js';

const PCD_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../data/pcd/Zaghetto.pcd')) ||
  require('test-data/pcd/Zaghetto.pcd');

test('PCDLoader#parseText', t => {
  const binaryPCD = new TextEncoder().encode(PCD_ASCII);

  const data = PCDLoader.parseBinary(binaryPCD);

  // Check internal loader data
  t.ok(data.loaderData.header, 'Original header was found');

  // Check normalized data
  t.ok(data.header, 'Normalized header was found');

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not found');

  const POSITION = data.glTFAttributeMap.POSITION;
  const COLOR_0 = data.glTFAttributeMap.COLOR_0;
  t.equal(data.attributes[POSITION].value.length, 639, 'POSITION attribute was found');
  t.equal(data.attributes[COLOR_0].value.length, 639, 'COLOR attribute was found');

  t.end();
});

test('PCDLoader#parseBinary', t => {
  const data = PCDLoader.parseBinary(PCD_BINARY);

  // Check internal loader data
  t.ok(data.loaderData.header, 'Original header was found');

  // Check normalized data
  t.ok(data.header, 'Normalized header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not preset');
  const POSITION = data.glTFAttributeMap.POSITION;
  t.equal(data.attributes[POSITION].value.length, 179250, 'POSITION attribute was found');

  t.end();
});
