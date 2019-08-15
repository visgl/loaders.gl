import {decodeRGB565} from '@loaders.gl/math';

export function normalize3DTileColorAttribute(tile, colors) {
  const {batchIds, isRGB565, batchTable, pointCount} = tile;

  // no colors defined
  if (!colors && (!batchIds || !batchTable)) {
    return null;
  }

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
    return {size: 3, value: colorArray};
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
    return {size: 3, value: colorArray};
  }

  // RGB case (tile.isTranslucent)
  if (colors && colors.length === pointCount * 3) {
    return {size: 3, value: colors};
  }

  // DEFAULT: RGBA case
  return {size: 4, value: colors};
}
