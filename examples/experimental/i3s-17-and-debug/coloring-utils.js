export const COLORED_BY = {
  ORIGINAL: 0,
  TILE: 1,
  DEPTH: 2,
  CUSTOM: 3
};

export const DEPTH_COLOR_MAP = {
  1: [197, 78, 90],
  2: [197, 108, 78],
  3: [198, 139, 77],
  4: [199, 170, 75],
  5: [188, 195, 69],
  6: [131, 202, 74],
  7: [85, 194, 69],
  8: [73, 188, 115],
  9: [70, 174, 172],
  10: [68, 118, 182],
  11: [97, 74, 183],
  12: [125, 58, 174]
};

export const DEPTH_MAX_LEVEL = 12;

export function getTileColor(tile, options) {
  switch (options.coloredBy) {
    case COLORED_BY.TILE:
      return getColorByTile(tile.id, options.colorsMap);
    case COLORED_BY.DEPTH:
      return getColorByDepth(tile.depth);
    case COLORED_BY.CUSTOM:
      return getCustomColor();
    default:
      return [255, 255, 255];
  }
}

function getColorByDepth(level) {
  return DEPTH_COLOR_MAP[level] || DEPTH_COLOR_MAP[DEPTH_MAX_LEVEL];
}

function getCustomColor() {
  // TODO: implement after tile-selecting feature
  return [255, 255, 255];
}

function getColorByTile(id, colorsMap) {
  const randomColor = Array.from({length: 3}, _ => Math.round(Math.random() * 255));

  colorsMap[id] = colorsMap[id] || randomColor;
  return colorsMap[id];
}
