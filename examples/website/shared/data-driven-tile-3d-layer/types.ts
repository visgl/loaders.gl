import type {Tile3D} from '@loaders.gl/tiles';

/**
 * Colorization settings applied to I3S tile content.
 */
export type ColorsByAttribute = {
  /** Feature attribute name. */
  attributeName: string;
  /** Minimum attribute value. */
  minValue: number;
  /** Maximum attribute value. */
  maxValue: number;
  /** Minimum RGBA color. */
  minColor: [number, number, number, number];
  /** Maximum RGBA color. */
  maxColor: [number, number, number, number];
  /** Colorization mode. */
  mode: string;
};

/**
 * Filter settings applied to I3S tile content.
 */
export type FiltersByAttribute = {
  /** Feature attribute name. */
  attributeName: string;
  /** Filter value. */
  value: number;
};

/**
 * Tile update callback result.
 */
export type TileUpdateResult = {
  /** Whether the tile changed. */
  isUpdated: boolean;
  /** Tile identifier. */
  id: string;
};

/**
 * Tile color update callback.
 */
export type CustomizeTileColors = (
  tile: Tile3D,
  colorsByAttribute: ColorsByAttribute | null
) => Promise<TileUpdateResult>;

/**
 * Tile filtering callback.
 */
export type CustomizeTileFilter = (
  tile: Tile3D,
  filtersByAttribute: FiltersByAttribute | null
) => Promise<TileUpdateResult>;
