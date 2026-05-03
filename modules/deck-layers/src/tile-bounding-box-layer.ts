// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  type Color,
  type CompositeLayerProps,
  type DefaultProps,
  type Layer
} from '@deck.gl/core';
import {AxisAlignedBoundingBox} from '@math.gl/culling';
import type {PointCloudTile} from '@loaders.gl/tiles';
import {
  BoundingBoxLayer,
  type BoundingBoxLayerBox,
  type BoundingBoxLayerProps
} from './bounding-box-layer';

/** Props for {@link TileBoundingBoxLayer}. */
export type TileBoundingBoxLayerProps = CompositeLayerProps & {
  /** Point-cloud tiles whose bounding boxes should be rendered. */
  tiles: PointCloudTile[];
  /** Whether to render only selected tiles. */
  selectedOnly?: boolean;
  /** Optional tile bounding box accessor. */
  getBoundingBox?: (tile: PointCloudTile) => BoundingBoxLayerBox | null | undefined;
  /** Color accessor for each tile bounding box. */
  getColor?: Color | ((tile: PointCloudTile) => Color);
  /** Wireframe line width in pixels. */
  lineWidth?: number;
  /** Optional props forwarded to the general BoundingBoxLayer. */
  boundingBoxLayerProps?: Partial<BoundingBoxLayerProps<PointCloudTile>>;
};

const DEFAULT_SELECTED_COLOR: Color = [255, 190, 80, 220];
const DEFAULT_UNSELECTED_COLOR: Color = [96, 165, 250, 120];

const defaultProps: DefaultProps<TileBoundingBoxLayerProps> = {
  id: 'tile-bounding-box-layer',
  tiles: {type: 'object', compare: false, value: []},
  selectedOnly: true,
  getBoundingBox: {type: 'accessor', value: getPointCloudTileBoundingBox},
  getColor: {type: 'accessor', value: getDefaultTileColor},
  lineWidth: 1,
  boundingBoxLayerProps: {type: 'object', compare: false, value: {}}
};

/**
 * Debug layer that adapts point-cloud tiles to the general math.gl BoundingBoxLayer.
 */
export class TileBoundingBoxLayer extends CompositeLayer<TileBoundingBoxLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'TileBoundingBoxLayer';

  /** Default props shared across tile bounding box layers. */
  static defaultProps: DefaultProps = defaultProps;

  /** Renders selected point-cloud tile bounds through BoundingBoxLayer. */
  renderLayers(): Layer | null {
    const tiles = this.props.selectedOnly
      ? this.props.tiles.filter(tile => tile.selected)
      : this.props.tiles;

    if (tiles.length === 0) {
      return null;
    }

    return new BoundingBoxLayer<PointCloudTile>({
      ...this.getSubLayerProps({id: 'bounds'}),
      ...this.props.boundingBoxLayerProps,
      data: tiles,
      coordinateSystem: this.props.coordinateSystem,
      getBoundingBox: this.props.getBoundingBox,
      getColor: this.props.getColor,
      lineWidth: this.props.lineWidth
    }) as unknown as Layer;
  }
}

/**
 * Converts a point-cloud tile bounding volume into a math.gl axis-aligned bounding box.
 * @param tile Point-cloud tile.
 * @returns math.gl axis-aligned bounding box.
 */
function getPointCloudTileBoundingBox(tile: PointCloudTile): AxisAlignedBoundingBox {
  const [minBounds, maxBounds] = tile.boundingVolume.cartographicBounds;
  return new AxisAlignedBoundingBox(minBounds, maxBounds);
}

/**
 * Returns the default color for selected and unselected tile boxes.
 * @param tile Tile being colored.
 * @returns RGBA color.
 */
function getDefaultTileColor(tile: PointCloudTile): Color {
  return tile.selected ? DEFAULT_SELECTED_COLOR : DEFAULT_UNSELECTED_COLOR;
}
