import {fetchFile, parse, encode} from '@loaders.gl/core';
import {DracoLoader, DracoWriter} from '@loaders.gl/draco';

const POSITIONS_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin';
const COLORS_URL = '@loaders.gl/draco/test/data/raw-attribute-buffers/lidar-positions.bin';

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
  let response = await fetchFile(POSITIONS_URL);
  const POSITIONS = await response.arrayBuffer();

  response = await fetchFile(COLORS_URL);
  const COLORS = await response.arrayBuffer();

  const attributes = {
    POSITIONS: new Float32Array(POSITIONS),
    COLORS: new Uint8ClampedArray(COLORS)
  };

  const arrayBuffer = await encode(attributes, DracoWriter, {draco: {pointcloud: true}});

  const pointCount = POSITIONS.byteLength / 12;

  bench.group('Draco Decode');
  for (const options of OPTIONS) {
    bench.addAsync(
      `DracoLoader#pointcloud#${options.name} - sequential`,
      {multiplier: pointCount, unit: 'points'},
      async () =>
        await parse(arrayBuffer.slice(), DracoLoader, {draco: {pointcloud: true}, worker: true})
    );

    bench.addAsync(
      `DracoLoader#pointcloud#${options.name} - parallel`,
      {multiplier: pointCount, unit: 'points', _throughput: 5},
      async () =>
        await parse(arrayBuffer.slice(), DracoLoader, {draco: {pointcloud: true}, worker: true})
    );
  }

  bench.group('Draco Encode');
  for (const options of OPTIONS) {
    bench.addAsync(
      `DracoWriter#pointcloud#${options.name} - sequential`,
      {multiplier: pointCount, unit: 'points'},
      async () => await encode(attributes, DracoWriter, {draco: {pointcloud: true}, worker: true})
    );

    bench.addAsync(
      `DracoWriter#pointcloud#${options.name} - parallel`,
      {multiplier: pointCount, unit: 'points', _throughput: 5},
      async () => await encode(attributes, DracoWriter, {draco: {pointcloud: true}, worker: true})
    );
  }

  return bench;
}
