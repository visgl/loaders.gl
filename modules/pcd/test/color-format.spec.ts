import {expect, test} from 'vitest';
import {parseInBatches} from '@loaders.gl/core';
import {PCDLoader} from '@loaders.gl/pcd';
import {getFloat16Value} from '@loaders.gl/schema';
import {parsePCD} from '../src/lib/parse-pcd';

const PCD_WITH_COLORS = `# .PCD v0.7 - Point Cloud Data file format
VERSION .7
FIELDS x y z rgb
SIZE 4 4 4 4
TYPE F F F U
COUNT 1 1 1 1
WIDTH 2
HEIGHT 1
POINTS 2
DATA ascii
0 0 0 16711680
1 1 1 255
`;

test('parsePCD#colorFormat float16', () => {
  const mesh = parsePCD(new TextEncoder().encode(PCD_WITH_COLORS), {
    pcd: {colorFormat: 'float16'}
  });
  const colors = mesh.attributes.COLOR_0;
  expect(colors.componentType).toBe('float16');
  expect(getFloat16Value(colors.value, 0)).toBeCloseTo(0, 3);
  expect(getFloat16Value(colors.value, 2)).toBeCloseTo(0.498, 3);
});

test('parsePCD#colorFormat uint8norm remains the default', () => {
  const mesh = parsePCD(new TextEncoder().encode(PCD_WITH_COLORS));
  expect(mesh.attributes.COLOR_0.value).toBeInstanceOf(Uint8Array);
});

test('parsePCD#colorFormat float32 returns normalized colors', () => {
  const mesh = parsePCD(new TextEncoder().encode(PCD_WITH_COLORS), {
    pcd: {colorFormat: 'float32'}
  });
  const colors = mesh.attributes.COLOR_0;
  expect(colors.value).toBeInstanceOf(Float32Array);
  expect(colors.value[2]).toBeCloseTo(0.498, 3);
});

test('PCDLoader#colorFormat float16 works for Arrow batches', async () => {
  const data = new TextEncoder().encode(PCD_WITH_COLORS).buffer;
  const batches = await parseInBatches([data], PCDLoader, {
    batchSize: 1,
    core: {worker: false},
    pcd: {shape: 'arrow-table', colorFormat: 'float16'}
  });
  const batchValues: number[] = [];
  for await (const batch of batches) {
    const colorColumn = batch.data.getChild('COLOR_0');
    batchValues.push(...Array.from(colorColumn.get(0)));
    expect(
      batch.schema.fields.find(field => field.name === 'COLOR_0')!.metadata.componentType
    ).toBe('float16');
  }
  expect(batchValues.length).toBe(6);
});
