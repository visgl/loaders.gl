import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {validateArrowTableSchema} from '@math.gl/arrow';
import {meshArrowSchema} from '@loaders.gl/core/schema';
import {PotreeBinLoader} from '@loaders.gl/tiles-3d/potree';
test('PotreeBinLoader#parse defaults to Arrow table', async () => {
  const arrayBuffer = makePotreeBinTile();
  const table = await parse(arrayBuffer, PotreeBinLoader, {
    potree: {
      pointAttributes: ['POSITION_CARTESIAN', 'RGB_PACKED'],
      scale: 0.01,
      positionOrigin: [10, 20, 30],
      nodeBoundingBox: [
        [10, 20, 30],
        [11, 22, 33]
      ]
    }
  });
  expect(table).toHaveProperty('numRows');
  validateArrowTableSchema(table, meshArrowSchema, {
    schemaName: 'PotreeBinLoader Mesh table'
  });
  expect(table.numRows, 'table has point rows').toBe(2);
  expect(table.getChild('POSITION'), 'table includes POSITION column').toBeTruthy();
  expect(table.getChild('COLOR_0'), 'table includes COLOR_0 column').toBeTruthy();
});
function makePotreeBinTile(): ArrayBuffer {
  const pointByteSize = 15;
  const arrayBuffer = new ArrayBuffer(pointByteSize * 2);
  const dataView = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  writePoint(dataView, bytes, 0, [1, 2, 3], [10, 20, 30]);
  writePoint(dataView, bytes, pointByteSize, [4, 5, 6], [40, 50, 60]);
  return arrayBuffer;
}
function writePoint(
  dataView: DataView,
  bytes: Uint8Array,
  byteOffset: number,
  position: [number, number, number],
  color: [number, number, number]
): void {
  dataView.setInt32(byteOffset, position[0], true);
  dataView.setInt32(byteOffset + 4, position[1], true);
  dataView.setInt32(byteOffset + 8, position[2], true);
  bytes.set(color, byteOffset + 12);
}
