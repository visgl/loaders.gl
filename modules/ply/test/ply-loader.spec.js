/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile} from '@loaders.gl/core-node';
import {parseFileSync, parseWithWorker, getGLTFAttribute} from '@loaders.gl/core';
import {PLYLoader, PLYWorkerLoader} from '@loaders.gl/ply';
import path from 'path';

import PLY_ASCII from '../data/cube_att.ply.js';
import {validateLoadedData} from 'test/common/conformance';

const PLY_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../data/bun_zipper.ply')) ||
  require('../data/bun_zipper.ply');

test('PLYLoader#parseText', t => {
  const data = parseFileSync(PLY_ASCII, PLYLoader);

  validateLoadedData(t, data);

  t.equal(data.indices.value.length, 36, 'Indices found');

  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 72, 'POSITION attribute was found');
  t.equal(getGLTFAttribute(data, 'NORMAL').value.length, 72, 'NORMAL attribute was found');

  t.end();
});

test('PLYLoader#parseBinary', t => {
  const data = parseFileSync(PLY_BINARY, PLYLoader);

  validateLoadedData(t, data);

  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 107841, 'POSITION attribute was found');

  t.end();
});

test('PLYLoader#parseBinaryAsync', t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  // Once binary is transferred to worker it cannot be read from the main thread
  // Duplicate it here to avoid breaking other tests
  const plyBinary = PLY_BINARY.slice();
  parseWithWorker(PLYWorkerLoader.worker)(plyBinary).then(data => {
    validateLoadedData(t, data);

    t.equal(getGLTFAttribute(data, 'POSITION').value.length, 107841, 'POSITION attribute was found');

  }).catch(error => {
    t.fail(error);

  }).then(t.end);
});
