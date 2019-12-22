import {fetchFile, encode} from '@loaders.gl/core';
import {DracoWriter} from '@loaders.gl/draco';

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

  for (const options of OPTIONS) {
    bench.addAsync(
      `DracoEncoder#pointcloud ${POSITIONS.byteLength / 12}#${options.name}`,
      async () => {
        return await encode(attributes, DracoWriter, {draco: {pointcloud: true}});
      }
    );

    // TODO - COMMENT OUT until bench.addAsync is fixed (too many invocations)
    // const compressedPointCloud = await encode(attributes, DracoWriter, {draco: {pointcloud: true}});
    // bench.addAsync(
    //   `DracoDecoder#pointcloud ${POSITIONS.byteLength / 12}#${options.name}`,
    //   async () => {
    //     return await parse(compressedPointCloud, DracoLoader, {worker: false});
    //   }
    // );
  }

  return bench;
}
