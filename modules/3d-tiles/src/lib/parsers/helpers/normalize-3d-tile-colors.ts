// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {Tile3DBatchTable} from '@loaders.gl/3d-tiles';
import {decodeRGB565, GL} from '@loaders.gl/math';
import {Tiles3DTileContent} from '../../../types';

/* eslint-disable complexity*/
export function normalize3DTileColorAttribute(
  tile: Tiles3DTileContent,
  colors: Uint8ClampedArray | null,
  batchTable?: Tile3DBatchTable
): {type: number; value: Uint8ClampedArray; size: number; normalized: boolean} | null {
  // no colors defined
  if (!colors && (!tile || !tile.batchIds || !batchTable)) {
    return null;
  }

  const {batchIds, isRGB565, pointCount = 0} = tile;
  // Batch table, look up colors in table
  if (batchIds && batchTable) {
    const colorArray = new Uint8ClampedArray(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      const batchId = batchIds[i];
      // TODO figure out what is `dimensions` used for
      const dimensions = batchTable.getProperty(batchId, 'dimensions');
      const color = dimensions.map((d) => d * 255);
      colorArray[i * 3] = color[0];
      colorArray[i * 3 + 1] = color[1];
      colorArray[i * 3 + 2] = color[2];
    }
    return {
      type: GL.UNSIGNED_BYTE,
      value: colorArray,
      size: 3,
      normalized: true
    };
  }

  // RGB565 case, convert to RGB
  if (colors && isRGB565) {
    const colorArray = new Uint8ClampedArray(pointCount * 3);
    for (let i = 0; i < pointCount; i++) {
      const color = decodeRGB565(colors[i]);
      colorArray[i * 3] = color[0];
      colorArray[i * 3 + 1] = color[1];
      colorArray[i * 3 + 2] = color[2];
    }
    return {
      type: GL.UNSIGNED_BYTE,
      value: colorArray,
      size: 3,
      normalized: true
    };
  }

  // RGB case (tile.isTranslucent)
  if (colors && colors.length === pointCount * 3) {
    return {
      type: GL.UNSIGNED_BYTE,
      value: colors,
      size: 3,
      normalized: true
    };
  }

  // DEFAULT: RGBA case
  return {
    type: GL.UNSIGNED_BYTE,
    value: colors || new Uint8ClampedArray(),
    size: 4,
    normalized: true
  };
}
/* eslint-enable complexity*/
