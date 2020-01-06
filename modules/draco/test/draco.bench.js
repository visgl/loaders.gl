import {fetchFile, parse, encode} from '@loaders.gl/core';
import {DracoLoader, DracoWriter} from '@loaders.gl/draco';

const POSITIONS_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin';
const COLORS_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-colors.bin';

const OPTIONS = [
  {
    name: 'quantization=10',
    quantization: {POSITION: 10},
    priority: 0
  }
  // We currently don't see meaningful difference in point cloud decoding performance by varying parameters
  // To keep benchmarks fast, leave this commented out for now
  // {
  //   name: 'quantization=14',
  //   quantization: {POSITION: 14},
  // }
];

export default async function dracoBench(bench) {
  let response = await fetchFile(POSITIONS_URL);
  const POSITIONS = await response.arrayBuffer();

  response = await fetchFile(COLORS_URL);
  const COLORS = await response.arrayBuffer();

  const attributes = {
    POSITIONS: new Float32Array(POSITIONS),
    COLORS: new Uint8ClampedArray(COLORS)
  };

  const arrayBuffer = await encode(attributes, DracoWriter, {draco: {pointcloud: true}});

  // Warm up worker (keep worker loading out of throughput measurement)
  await parse(arrayBuffer.slice(), DracoLoader, {draco: {pointcloud: true}, worker: true});

  const pointCount = POSITIONS.byteLength / 12;

  bench.group('Draco Decode');
  const benchOptions = {multiplier: pointCount, unit: 'points', minIterations: 3};

  for (const options of OPTIONS) {
    bench.addAsync(
      `DracoLoader#pointcloud#${options.name} - sequential`,
      benchOptions,
      async () =>
        await parse(arrayBuffer.slice(), DracoLoader, {draco: {pointcloud: true}, worker: true})
    );

    bench.addAsync(
      `DracoLoader#pointcloud#${options.name} - parallel`,
      {...benchOptions, _throughput: 5},
      async () =>
        await parse(arrayBuffer.slice(), DracoLoader, {draco: {pointcloud: true}, worker: true})
    );
  }

  bench.group('Draco Encode');
  for (const options of OPTIONS) {
    bench.addAsync(
      `DracoWriter#pointcloud#${options.name} - sequential`,
      benchOptions,
      async () => await encode(attributes, DracoWriter, {draco: {pointcloud: true}, worker: true})
    );

    /* TODO - enable this case once worker writer is implemented
    bench.addAsync(
      {...benchOptions, _throughput: 5},
      {multiplier: pointCount, unit: 'points', _throughput: 5, minIterations: 1},
      async () => await encode(attributes, DracoWriter, {draco: {pointcloud: true}, worker: true})
    );
    */
  }

  return bench;
}
