// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {parse} from '@loaders.gl/core';
import {validateArrowTableSchema} from '@loaders.gl/arrow';
import {meshArrowSchema} from '@loaders.gl/schema';
import {PotreeBinLoader} from '@loaders.gl/potree';

test('PotreeBinLoader#parse(shape: arrow-table)', async t => {
  const arrayBuffer = makePotreeBinTile();
  const table = await parse(arrayBuffer, PotreeBinLoader, {
    potree: {
      shape: 'arrow-table',
      pointAttributes: ['POSITION_CARTESIAN', 'RGB_PACKED'],
      scale: 0.01,
      positionOrigin: [10, 20, 30],
      nodeBoundingBox: [
        [10, 20, 30],
        [11, 22, 33]
      ]
    }
  });

  t.equal(table.shape, 'arrow-table', 'table has arrow-table shape');
  validateArrowTableSchema(table.data, meshArrowSchema, {
    schemaName: 'PotreeBinLoader Mesh table'
  });
  t.equal(table.data.numRows, 2, 'table has point rows');
  t.ok(table.data.getChild('POSITION'), 'table includes POSITION column');
  t.ok(table.data.getChild('COLOR_0'), 'table includes COLOR_0 column');

  t.end();
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
