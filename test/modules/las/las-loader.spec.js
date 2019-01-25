/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile} from '@loaders.gl/core';
import {LASLoader} from '@loaders.gl/las';
import path from 'path';

const LAS_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../data/las/indoor.0.1.laz')) ||
  require('test-data/las/indoor.0.1.laz');

test('LASLoader#parseBinary', t => {
  LASLoader.parseBinary(LAS_BINARY, {skip: 10}).then(data => {
    // Check normalized data
    t.ok(data.header, 'Normalized header was found');
    t.equal(data.drawMode, 0, 'mode is POINTS (0)');

    t.notOk(data.attributes.INDICES, 'INDICES attribute was not preset');
    t.equal(data.attributes.POSITION.length, 80804 * 3, 'POSITION attribute was found');

    t.end();
  }).catch(error => {
    t.fail(error);
    t.end();
  });
});
