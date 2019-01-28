/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile} from '@loaders.gl/core';
import {LASLoader} from '@loaders.gl/las';
import path from 'path';

const LAS_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../data/las/indoor.0.1.laz')) ||
  require('test-data/las/indoor.0.1.laz');

test('LASLoader#parseBinary', t => {
  const data = LASLoader.parseBinary(LAS_BINARY, {skip: 10});

  // Check normalized data
  t.ok(data.header, 'Normalized header was found');
  t.is(data.header.vertexCount, data.originalHeader.totalRead, 'Original header was found');
  t.equal(data.drawMode, 0, 'mode is POINTS (0)');

  t.notOk(data.attributes.INDICES, 'INDICES attribute was not preset');
  t.equal(data.attributes.POSITION.length, 80805 * 3, 'POSITION attribute was found');

  t.end();
});
