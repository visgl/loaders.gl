// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

export type BoundingBox = [[number, number, number], [number, number, number]];

/** basic helper method to calculate a models upper and lower bounds */
export function getBoundingBoxFromArrowPositions(
  column: arrow.Vector<arrow.FixedSizeList>
): BoundingBox {
  const mins: [number, number, number] = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
  const maxs: [number, number, number] = [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE];

  const valueColumn = column.getChildAt(0)!;
  for (const data of valueColumn.data) {
    const pointSize = 3; // attributes.POSITION.size;
    const pointData = data.buffers[arrow.BufferType.DATA];
    const pointCount = pointData.length / pointSize;

    for (let i = 0; i < pointCount; i += pointSize) {
      const x = pointData[i];
      const y = pointData[i + 1];
      const z = pointData[i + 2];

      if (x < mins[0]) mins[0] = x;
      else if (x > maxs[0]) maxs[0] = x;

      if (y < mins[1]) mins[1] = y;
      else if (y > maxs[1]) maxs[1] = y;

      if (z < mins[2]) mins[2] = z;
      else if (z > maxs[2]) maxs[2] = z;
    }
  }

  return [mins, maxs];
}
