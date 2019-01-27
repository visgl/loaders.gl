/* eslint-disable max-len */
import test from 'tape-catch';
import {_getMeshSize} from '@loaders.gl/core';
import {loadBinaryFile} from '@loaders.gl/core-io';
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
    POSITIONS: new Float32Array(POSITIONS),
    COLORS: new Uint8ClampedArray(COLORS)
  };
  t.comment(`Encoding ${attributes.POSITIONS.length} positions, ${attributes.COLORS.length} colors...`);

  // Encode mesh
  const dracoEncoder = new DracoEncoder();
  const compressedMesh = dracoEncoder.encodePointCloud(attributes);
  dracoEncoder.destroy();
  const meshSize = _getMeshSize(attributes);
  const ratio = meshSize / compressedMesh.byteLength;
  t.comment(`Draco compression ${compressedMesh.byteLength} bytes, ratio ${ratio.toFixed(1)}`);

  // Ensure we can parse it
  const data2 = DracoLoader.parseBinary(compressedMesh);
  t.ok(data2.header, 'Documents were found');
  t.equal(data2.attributes.POSITION.length, attributes.POSITIONS.length, 'position attribute was found');
  t.equal(data2.attributes.COLOR_0.length, attributes.COLORS.length, 'color attribute was found');

  t.end();
});
