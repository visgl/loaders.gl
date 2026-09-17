// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {Tile3DBatchTable} from '@loaders.gl/3d-tiles';
import {decodeRGB565, GL} from '@math.gl/geometry-utils';
import {convertColorArrayToFloat16} from '@loaders.gl/schema';
import {Tiles3DTileContent} from '../../../types';

/* eslint-disable complexity*/
export function normalize3DTileColorAttribute(
  tile: Tiles3DTileContent,
  colors: Uint8ClampedArray | null,
  batchTable?: Tile3DBatchTable,
  colorFormat: 'uint8norm' | 'float16' | 'float32' = 'uint8norm'
): {
  type: number;
  value: Uint8ClampedArray | Float16Array | Uint16Array | Float32Array;
  size: number;
  normalized: boolean;
  componentType?: 'float16';
} | null {
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
      const color = dimensions.map(d => d * 255);
      colorArray[i * 3] = color[0];
      colorArray[i * 3 + 1] = color[1];
      colorArray[i * 3 + 2] = color[2];
    }
    return makeColorAttribute(colorArray, 3, colorFormat);
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
    return makeColorAttribute(colorArray, 3, colorFormat);
  }

  // RGB case (tile.isTranslucent)
  if (colors && colors.length === pointCount * 3) {
    return makeColorAttribute(colors, 3, colorFormat);
  }

  // DEFAULT: RGBA case
  return makeColorAttribute(colors || new Uint8ClampedArray(), 4, colorFormat);
}

/** Build a normalized byte, Float16, or Float32 color attribute. */
function makeColorAttribute(
  colors: Uint8ClampedArray,
  size: number,
  colorFormat: 'uint8norm' | 'float16' | 'float32'
) {
  if (colorFormat === 'float16') {
    return {
      type: 5131,
      value: convertColorArrayToFloat16(colors, 255),
      size,
      normalized: false,
      componentType: 'float16' as const
    };
  }
  if (colorFormat === 'float32') {
    return {
      type: GL.FLOAT,
      value: Float32Array.from(colors, color => color / 255),
      size,
      normalized: false
    };
  }
  return {type: GL.UNSIGNED_BYTE, value: colors, size, normalized: true};
}
/* eslint-enable complexity*/
