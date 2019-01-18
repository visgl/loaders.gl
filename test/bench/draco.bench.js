import {loadBinaryFile} from '@loaders.gl/core';
import {DracoEncoder, DracoLoader} from '@loaders.gl/draco';
import path from 'path';

const POSITIONS =
  loadBinaryFile(path.resolve(__dirname, '../data/raw-attribute-buffers/lidar-positions.bin')) ||
  require('test-data/raw-attribute-buffers/lidar-positions.bin');

const COLORS =
  loadBinaryFile(path.resolve(__dirname, '../data/raw-attribute-buffers/lidar-positions.bin')) ||
  require('test-data/raw-attribute-buffers/lidar-colors.bin');

const attributes = {
  POSITIONS: new Float32Array(POSITIONS),
  COLORS: new Uint8ClampedArray(COLORS)
};

const dracoEncoder10 = new DracoEncoder({
  quantization: {
    POSITION: 10
  }
});
const dracoEncoder14 = new DracoEncoder({
  quantization: {
    POSITION: 14
  }
});
const compressedPointCloud10 = dracoEncoder10.encodePointCloud(attributes);
const compressedPointCloud14 = dracoEncoder14.encodePointCloud(attributes);

export default function dracoBench(bench) {
  return bench
    .group('Draco Encode/Decode')
    .add('DracoEncoder#encode point cloud#quantization=10', () => {
      dracoEncoder10.encodePointCloud(attributes);
    })
    .add('DracoEncoder#encode point cloud#quantization=14', () => {
      dracoEncoder14.encodePointCloud(attributes);
    })
    .add('DracoDecoder#decode point cloud#quantization=10', () => {
      DracoLoader.parseBinary(compressedPointCloud10);
    })
    .add('DracoDecoder#decode point cloud#quantization=14', () => {
      DracoLoader.parseBinary(compressedPointCloud14);
    });
}
