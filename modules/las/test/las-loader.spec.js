/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {readFileSync, parseFileSync, getGLTFAttribute} from '@loaders.gl/core';
import {LASLoader} from '@loaders.gl/las';
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
