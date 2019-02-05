/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile} from '@loaders.gl/core-node';
import {DracoLoader} from '@loaders.gl/draco';
import path from 'path';
import {validateLoadedData} from '../conformance';

const BUNNY_DRC =
  loadBinaryFile(path.resolve(__dirname, '../../data/draco/bunny.drc')) ||
  require('test-data/draco/bunny.drc');

test('DracoLoader#parse and encode', t => {
  const data = DracoLoader.parseBinary(BUNNY_DRC);
  validateLoadedData(data);

  const POSITION = data.glTFAttributeMap.POSITION;
  t.equal(data.attributes[POSITION].value.length, 104502, 'position attribute was found');

  t.end();
});
