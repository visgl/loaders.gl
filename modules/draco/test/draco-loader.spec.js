/* eslint-disable max-len */
import test from 'tape-catch';
import {parseFileSync} from '@loaders.gl/core';
import {loadBinaryFile} from '@loaders.gl/core-node';
import {DracoLoader} from '@loaders.gl/draco';
import path from 'path';
import {validateLoadedData} from 'test/common/conformance';

const BUNNY_DRC =
  loadBinaryFile(path.resolve(__dirname, '../data/bunny.drc')) ||
  require('../data/bunny.drc');

test('DracoLoader#parse and encode', t => {
  const data = parseFileSync(BUNNY_DRC, DracoLoader);
  validateLoadedData(t, data);

  const POSITION = data.glTFAttributeMap.POSITION;
  t.equal(data.attributes[POSITION].value.length, 104502, 'position attribute was found');

  t.end();
});
