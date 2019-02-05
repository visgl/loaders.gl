/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile} from '@loaders.gl/core-node';
import {LASLoader} from '@loaders.gl/las';
import path from 'path';
import {validateLoadedData, getAttribute} from '../conformance';

const LAS_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../data/las/indoor.0.1.laz')) ||
  require('test-data/las/indoor.0.1.laz');

test('LASLoader#parseBinary', t => {
  const data = LASLoader.parseBinary(LAS_BINARY, {skip: 10});
  validateLoadedData(data);

  t.is(data.header.elementCount, data.loaderData.header.totalRead, 'Original header was found');
  t.equal(data.mode, 0, 'mode is POINTS (0)');

  t.notOk(data.indices, 'INDICES attribute was not preset');
  t.equal(getAttribute(data, 'POSITION').value.length, 80805 * 3, 'POSITION attribute was found');

  t.end();
});
