import {decodeRGB565, GL} from '@loaders.gl/math';

/* eslint-disable complexity*/
export function normalize3DTileColorAttribute(tile, colors, batchTable) {
  // no colors defined
  if (!colors && (!tile || !tile.batchIds || !batchTable)) {
    return null;
  }

  const {batchIds, isRGB565, pointCount} = tile;
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
  if (isRGB565) {
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
    value: colors,
    size: 4,
    normalized: true
  };
}
/* eslint-enable complexity*/
