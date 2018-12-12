/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile, _getMeshSize} from '@loaders.gl/core';
import {DracoLoader, DracoEncoder} from '@loaders.gl/draco';
import path from 'path';

const BUNNY_DRC =
  loadBinaryFile(path.resolve(__dirname, '../../data/draco/bunny.drc')) ||
  require('test-data/draco/bunny.drc');

test('DracoEncoder#parseBinary', t => {
  const data = DracoLoader.parseBinary(BUNNY_DRC);

  t.ok(data.header, 'Documents were found');
  // t.comment(JSON.stringify(data));
  t.equal(data.attributes.POSITION.length, 104502, 'position attribute was found');

  // Encode mesh
  const dracoEncoder = new DracoEncoder();
  const compressedMesh = dracoEncoder.encodePointCloud(data.attributes);
  dracoEncoder.destroy();
  const meshSize = _getMeshSize(data.attributes);
  const ratio = meshSize / compressedMesh.byteLength;
  t.comment(`Draco compression ratio: ${ratio.toFixed(1)}`);

  // const data2 = DracoLoader.parseBinary(compressedMesh.buffer);
  // t.ok(data2.header, 'Documents were found');
  // // t.comment(JSON.stringify(data));
  // t.equal(data2.attributes.POSITION.length, 104502, 'position attribute was found');

  t.end();
});
