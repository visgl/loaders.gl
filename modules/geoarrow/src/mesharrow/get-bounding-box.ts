// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

export type BoundingBox = [[number, number, number], [number, number, number]];

/** basic helper method to calculate a models upper and lower bounds */
export function getBoundingBoxFromArrowPositions(
  column: arrow.Vector<arrow.FixedSizeList>
): BoundingBox {
  const mins: [number, number, number] = [Infinity, Infinity, Infinity];
  const maxs: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  const valueColumn = column.getChildAt(0)!;
  // `toArray()` rebases sliced vectors to their logical range. It is zero-copy for the
  // common single-chunk numeric case and only combines data when the vector is chunked.
  const pointData = valueColumn.toArray();
  const pointSize = 3; // attributes.POSITION.size;
  for (let i = 0; i < pointData.length; i += pointSize) {
    const x = pointData[i];
    const y = pointData[i + 1];
    const z = pointData[i + 2];

    if (x < mins[0]) mins[0] = x;
    if (x > maxs[0]) maxs[0] = x;

    if (y < mins[1]) mins[1] = y;
    if (y > maxs[1]) maxs[1] = y;

    if (z < mins[2]) mins[2] = z;
    if (z > maxs[2]) maxs[2] = z;
  }

  return [mins, maxs];
}
