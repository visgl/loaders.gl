export const COLORED_BY = {
  ORIGINAL: 0,
  RANDOM: 1,
  DEPTH: 2,
  CUSTOM: 3,
  TILE: 4
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

const DEPTH_MAX_LEVEL = 12;
const DEFAULT_COLOR = [255, 255, 255];

export default class ColorMap {
  constructor() {
    this.state = {
      randomColorMap: {},
      colorMap: {}
    };
  }

  getTileColor(tile, options) {
    switch (options.coloredBy) {
      case COLORED_BY.RANDOM:
        return this._getRandomColor(tile.id);
      case COLORED_BY.DEPTH:
        return this._getColorByDepth(tile.id, tile.depth);
      case COLORED_BY.TILE:
        return this._getColorByTile(tile.id);
      case COLORED_BY.CUSTOM:
        return this._getCustomColor();
      default:
        return DEFAULT_COLOR;
    }
  }

  _getColorByTile(id) {
    const {colorMap} = this.state;
    return colorMap[id] || DEFAULT_COLOR;
  }

  _getColorByDepth(id, level) {
    const {colorMap} = this.state;
    colorMap[id] = DEPTH_COLOR_MAP[level] || DEPTH_COLOR_MAP[DEPTH_MAX_LEVEL];
    return colorMap[id];
  }

  _getCustomColor() {
    // TODO: implement after tile-selecting feature
    return [255, 255, 255];
  }

  _getRandomColor(id) {
    const {colorMap, randomColorMap} = this.state;
    const randomColor = Array.from({length: 3}, _ => Math.round(Math.random() * 255));

    randomColorMap[id] = randomColorMap[id] || randomColor;
    colorMap[id] = randomColorMap[id];
    return colorMap[id];
  }
}
