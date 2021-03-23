import {COLORED_BY} from './color-map';

export const MAP_STYLES = {
  'Base Map: Satellite': 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
  'Base Map: Light': 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  'Base Map: Dark': 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'
};

export const CONTRAST_MAP_STYLES = {
  'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json':
    'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json':
    'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
  'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json':
    'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json'
};

export const INITIAL_MAP_STYLE = MAP_STYLES['Base Map: Dark'];

export const TILE_COLOR_MODES = {
  'Color: Original': COLORED_BY.ORIGINAL,
  'Color: By tile (random)': COLORED_BY.RANDOM,
  'Color: By depth': COLORED_BY.DEPTH
  // TODO: implement after tile-selecting feature
  // 'Tile coloring: Custom (by selected object)': COLORED_BY.CUSTOM,
};

export const INITIAL_TILE_COLOR_MODE = COLORED_BY.RANDOM;

export const OBB_COLOR_MODES = {
  'Color: White': COLORED_BY.ORIGINAL,
  'Color: By tile': COLORED_BY.TILE
};

export const INITIAL_OBB_COLOR_MODE = COLORED_BY.ORIGINAL;
