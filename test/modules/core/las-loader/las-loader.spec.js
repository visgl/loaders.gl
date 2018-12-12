/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile, LASLoader} from 'loaders.gl';
import path from 'path';

const LAS_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../data/las/indoor.laz')) ||
  require('../data/las/indoor.laz');

test('LASLoader#parseBinary', t => {
  const data = LASLoader.parseBinary(LAS_BINARY);

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
