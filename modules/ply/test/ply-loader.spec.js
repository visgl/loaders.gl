/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {readFile, readFileSync, parseFileSync, parseFile, getGLTFAttribute} from '@loaders.gl/core';
import {PLYLoader, PLYWorkerLoader} from '@loaders.gl/ply';
import path from 'path';

import PLY_ASCII from '../data/cube_att.ply.js';
import {validateLoadedData} from 'test/common/conformance';

const PLY_BINARY =
  readFileSync(path.resolve(__dirname, '../data/bun_zipper.ply')) ||
  require('../data/bun_zipper.ply');

test('PLYLoader#parse(text)', async t => {
  const data = parseFileSync(PLY_ASCII, PLYLoader);

  validateLoadedData(t, data);
  t.equal(data.indices.value.length, 36, 'Indices found');
  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 72, 'POSITION attribute was found');
  t.equal(getGLTFAttribute(data, 'NORMAL').value.length, 72, 'NORMAL attribute was found');
  t.end();
});

test('PLYLoader#parseFileSync(binary)', t => {
  const data = parseFileSync(PLY_BINARY, PLYLoader);

  validateLoadedData(t, data);
  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 107841, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parse(binary)', async t => {
  const arrayBuffer = await readFile('@loaders.gl/ply/../data/bun_zipper.ply');
  const data = await parseFile(arrayBuffer, PLYLoader);

  validateLoadedData(t, data);
  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 107841, 'POSITION attribute was found');
  t.end();
});

test('PLYLoader#parse(WORKER)', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  // Once binary is transferred to worker it cannot be read from the main thread
  // Duplicate it here to avoid breaking other tests
  const plyBinary = PLY_BINARY.slice();
  const data = await parseFile(plyBinary, PLYWorkerLoader);

  validateLoadedData(t, data);
  t.equal(getGLTFAttribute(data, 'POSITION').value.length, 107841, 'POSITION attribute was found');
  t.end();
});
