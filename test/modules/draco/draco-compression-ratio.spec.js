/* eslint-disable max-len */
import test from 'tape-catch';
import {loadBinaryFile, _getMeshSize} from '@loaders.gl/core';
import {DracoEncoder, DracoLoader} from '@loaders.gl/draco';
import path from 'path';

const POSITIONS =
  loadBinaryFile(path.resolve(__dirname, '../../data/raw-attribute-buffers/lidar-positions.bin')) ||
  require('test-data/raw-attribute-buffers/lidar-positions.bin');

const COLORS =
  loadBinaryFile(path.resolve(__dirname, '../../data/raw-attribute-buffers/lidar-positions.bin')) ||
  require('test-data/raw-attribute-buffers/lidar-colors.bin');

test('DracoEncoder#compressRawBuffers', t => {
  const attributes = {
    POSITIONS: new Float32Array(POSITIONS), // , 0, 300),
    COLORS: new Float32Array(COLORS) //, 0, 400)
  };
  t.comment(`Encoding ${attributes.POSITIONS.length} positions, ${attributes.COLORS.length} colors...`);

  // Encode mesh
  const dracoEncoder = new DracoEncoder();
  t.comment(`compressor created`);
  const compressedMesh = dracoEncoder.encodePointCloud(attributes);
  t.comment(`compression completed`);
  dracoEncoder.destroy();
  const meshSize = _getMeshSize(attributes);
  const ratio = meshSize / compressedMesh.byteLength;
  t.comment(`Draco compression ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);

  // Ensure we can parse it
  const data2 = DracoLoader.parseBinary(compressedMesh);
  t.ok(data2.header, 'Documents were found');
  // t.comment(JSON.stringify(data));
  t.equal(data2.attributes.POSITION.length, 104502, 'position attribute was found');

  t.end();
});
