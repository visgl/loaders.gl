/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {readFileSync, parseFileSync, parseFile, getGLTFAttribute} from '@loaders.gl/core';
import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';
import path from 'path';
import {validateLoadedData} from 'test/common/conformance';

const LAS_BINARY =
  readFileSync(path.resolve(__dirname, '../data/indoor.0.1.laz')) ||
  require('../data/indoor.0.1.laz');

test('LASLoader#parseBinary', t => {
  const data = parseFileSync(LAS_BINARY, LASLoader, {skip: 10});
  validateLoadedData(t, data);

  t.is(data.header.vertexCount, data.loaderData.header.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 80805 * 3, 'POSITION attribute was found');

  t.end();
});

test('LASWorkerLoader#parseBinary', t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  // Once binary is transferred to worker it cannot be read from the main thread
  // Duplicate it here to avoid breaking other tests
  const lasBinary = LAS_BINARY.slice();
  parseFile(lasBinary, LASWorkerLoader, {skip: 10}).then(data => {
    validateLoadedData(t, data);

    t.equal(getGLTFAttribute(data, 'POSITION').value.length, 80805 * 3, 'POSITION attribute was found');

  }).catch(error => {
    t.fail(error);

  }).then(t.end);
});
