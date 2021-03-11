import {COLORED_BY} from './tile-layer/tile-layer';

export const MAP_STYLES = {
  'Base Map: Satellite': 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
  'Base Map: Light': 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  'Base Map: Dark': 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'
};

export const INITIAL_MAP_STYLE = MAP_STYLES['Base Map: Dark'];

export const MAP_COLORING_MODES = {
  'Tile coloring: Original': COLORED_BY.ORIGINAL,
  'Tile coloring: By tile': COLORED_BY.TILE,
  'Tile coloring: By depth': COLORED_BY.DEPTH
  // TODO: implement after tile-selecting feature
  // 'Tile coloring: Custom (by selected object)': COLORED_BY.CUSTOM,
};

export const INITIAL_COLORING_MODE = COLORED_BY.TILE;
