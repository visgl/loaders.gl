import {fetchFile, parseFileSync, _getMeshSize} from '@loaders.gl/core';
import {DracoLoader, DracoWriter} from '@loaders.gl/draco';

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

export default async function dracoBench(bench) {
  bench = bench.group('Draco Encode/Decode');

  let response = await fetchFile(
    '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin'
  );
  const POSITIONS = await response.arrayBuffer();
  response = await fetchFile(
    '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin'
  );
  const COLORS = await response.arrayBuffer();

  const attributes = {
    POSITIONS: new Float32Array(POSITIONS),
    COLORS: new Uint8ClampedArray(COLORS)
  };
  const rawSize = _getMeshSize(attributes);

  OPTIONS.forEach(option => {
    const dracoEncoder = encodeFile({attributes}, DracoWriter, options);
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
