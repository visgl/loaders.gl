import {COLORED_BY} from './coloring-utils';

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

export const TILE_COLORING_MODES = {
  'Tile coloring: Original': COLORED_BY.ORIGINAL,
  'Tile coloring: By tile (random)': COLORED_BY.RANDOM,
  'Tile coloring: By depth': COLORED_BY.DEPTH
  // TODO: implement after tile-selecting feature
  // 'Tile coloring: Custom (by selected object)': COLORED_BY.CUSTOM,
};

export const INITIAL_TILE_COLORING_MODE = COLORED_BY.RANDOM;

export const OBB_COLORING_MODES = {
  'Obb coloring: White': COLORED_BY.ORIGINAL,
  'Obb coloring: By tile': COLORED_BY.TILE
};

export const INITIAL_OBB_COLORING_MODE = COLORED_BY.ORIGINAL;
