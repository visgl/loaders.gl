import {readFileSync, parseFileSync, _getMeshSize} from '@loaders.gl/core';
import {DracoEncoder, DracoLoader} from '@loaders.gl/draco';
import path from 'path';

const POSITIONS =
  readFileSync(path.resolve(__dirname, './data/raw-attribute-buffers/lidar-positions.bin')) ||
  require('./data/raw-attribute-buffers/lidar-positions.bin');

const COLORS =
  readFileSync(path.resolve(__dirname, './data/raw-attribute-buffers/lidar-positions.bin')) ||
  require('./data/raw-attribute-buffers/lidar-colors.bin');

/*
import {addFileAliases, isBrowser} from '@loaders.gl/core';

const TEST_DATA_DIR = path.resolve(__dirname, '../data');

addFileAliases(TEST_DATA_DIR, {
  'raw-attribute-buffers/lidar-positions.bin':
    isBrowser && require('test-data/raw-attribute-buffers/lidar-positions.bin'),
  'raw-attribute-buffers/lidar-colors.bin':
    isBrowser & require('test-data/raw-attribute-buffers/lidar-colors.bin')
});

const POSITIONS =
  readFileSync(path.resolve(TEST_DATA_DIR, 'raw-attribute-buffers/lidar-positions.bin'));
const COLORS =
  readFileSync(path.resolve(TEST_DATA_DIR, '/raw-attribute-buffers/lidar-positions.bin'));
*/

const attributes = {
  POSITIONS: new Float32Array(POSITIONS),
  COLORS: new Uint8ClampedArray(COLORS)
};
const rawSize = _getMeshSize(attributes);

const OPTIONS = [
  {
    name: 'quantization=10',
    quantization: {POSITION: 10}
  },
  {
    name: 'quantization=14',
    quantization: {POSITION: 14}
  }
];

export default function dracoBench(bench) {
  bench = bench.group('Draco Encode/Decode');

  OPTIONS.forEach(option => {
    const dracoEncoder = new DracoEncoder(option);
    const compressedPointCloud = dracoEncoder.encodePointCloud(attributes);
    // eslint-disable-next-line
    console.log(`${option.name} compression rate:
      ${((compressedPointCloud.byteLength / rawSize) * 100).toFixed(2)}%`);

    bench = bench
      .add(`DracoEncoder#encode point cloud#${option.name}`, () => {
        dracoEncoder.encodePointCloud(attributes);
      })
      .add(`DracoDecoder#decode point cloud#${option.name}`, () => {
        parseFileSync(compressedPointCloud, DracoLoader);
      });
  });

  return bench;
}
