/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {readFileSync, parseFileSync, parseFile, TextEncoder, getGLTFAttribute} from '@loaders.gl/core';
import {PCDLoader, PCDWorkerLoader} from '@loaders.gl/pcd';
import path from 'path';

import PCD_ASCII from '../data/simple-ascii.pcd.js';
import {validateLoadedData} from 'test/common/conformance';

const PCD_BINARY =
  readFileSync(path.resolve(__dirname, '../data/Zaghetto.pcd')) ||
  require('../data/Zaghetto.pcd');

test('PCDLoader#parseText', t => {
  const binaryPCD = new TextEncoder().encode(PCD_ASCII);

  const data = parseFileSync(binaryPCD, PCDLoader);
  validateLoadedData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not found');

  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 639, 'POSITION attribute was found');
  t.equal(getGLTFAttribute(data, 'COLOR_0').value.length, 639, 'COLOR attribute was found');

  t.end();
});

test('PCDLoader#parseBinary', t => {
  const data = parseFileSync(PCD_BINARY, PCDLoader);
  validateLoadedData(t, data);

  t.equal(data.mode, 0, 'mode is POINTS (0)');
  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 179250, 'POSITION attribute was found');

  t.end();
});

test('PCDWorkerLoader#parseBinary', t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  // Once binary is transferred to worker it cannot be read from the main thread
  // Duplicate it here to avoid breaking other tests
  const pcdBinary = PCD_BINARY.slice();
  parseFile(pcdBinary, PCDWorkerLoader).then(data => {
    validateLoadedData(t, data);

    t.equal(data.mode, 0, 'mode is POINTS (0)');
    t.notOk(data.indices, 'INDICES attribute was not preset');
    t.equal(getGLTFAttribute(data, 'POSITION').value.length, 179250, 'POSITION attribute was found');

  }).catch(error => {
    t.fail(error);

  }).then(t.end);
});
