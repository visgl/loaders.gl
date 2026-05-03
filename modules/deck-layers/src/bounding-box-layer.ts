// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  COORDINATE_SYSTEM,
  type Color,
  type CompositeLayerProps,
  type DefaultProps,
  type Layer
} from '@deck.gl/core';
import {LineLayer, type LineLayerProps} from '@deck.gl/layers';
import {
  createBoundingBoxLayerEdges,
  type BoundingBoxLayerBox,
  type BoundingBoxLayerEdge
} from './bounding-box-utils';

export type {BoundingBoxLayerBox, BoundingBoxLayerEdge};
export {createBoundingBoxLayerEdges};

/** Props for {@link BoundingBoxLayer}. */
export type BoundingBoxLayerProps<DataT = BoundingBoxLayerBox> = CompositeLayerProps & {
  /** Objects whose bounding boxes should be rendered. */
  data: DataT[];
  /** Bounding box accessor for each object. */
  getBoundingBox?:
    | BoundingBoxLayerBox
    | ((object: DataT) => BoundingBoxLayerBox | null | undefined);
  /** Color accessor for each object's bounding box. */
  getColor?: Color | ((object: DataT) => Color);
  /** Wireframe line width in pixels. */
  lineWidth?: number;
  /** Optional props forwarded to deck.gl's LineLayer. */
  lineLayerProps?: Partial<LineLayerProps<BoundingBoxLayerEdge<DataT>>>;
};

const DEFAULT_COLOR: Color = [255, 190, 80, 220];

const defaultProps: DefaultProps<BoundingBoxLayerProps> = {
  id: 'bounding-box-layer',
  data: {type: 'object', compare: false, value: []},
  getBoundingBox: {type: 'accessor', value: (object: BoundingBoxLayerBox) => object},
  getColor: {type: 'accessor', value: DEFAULT_COLOR},
  lineWidth: 1,
  lineLayerProps: {type: 'object', compare: false, value: {}}
};

/**
 * Debug layer that renders wireframe boxes from math.gl bounding volumes.
 *
 * The layer accepts `AxisAlignedBoundingBox` and `OrientedBoundingBox` instances directly,
 * or arbitrary objects paired with a `getBoundingBox` accessor.
 */
export class BoundingBoxLayer<DataT = BoundingBoxLayerBox> extends CompositeLayer<
  BoundingBoxLayerProps<DataT>
> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'BoundingBoxLayer';

  /** Default props shared across bounding box layers. */
  static defaultProps: DefaultProps = defaultProps;

  /** Renders bounding boxes as LineLayer segments. */
  renderLayers(): Layer | null {
    const paths = createBoundingBoxLayerEdges(this.props.data, this.props.getBoundingBox);
    if (paths.length === 0) {
      return null;
    }

    const lineLayerProps = this.props.lineLayerProps || {};
    return new LineLayer<BoundingBoxLayerEdge<DataT>>({
      ...this.getSubLayerProps({id: 'edges'}),
      ...lineLayerProps,
      data: paths,
      coordinateSystem: this.props.coordinateSystem ?? COORDINATE_SYSTEM.LNGLAT,
      getSourcePosition: edge => edge.sourcePosition,
      getTargetPosition: edge => edge.targetPosition,
      getColor: edge => getObjectColor(edge.object, this.props.getColor),
      getWidth: this.props.lineWidth,
      widthUnits: 'pixels',
      parameters: {
        depthTest: false,
        ...lineLayerProps.parameters
      },
      updateTriggers: {
        getBoundingBox: this.props.getBoundingBox,
        getColor: this.props.getColor,
        ...(lineLayerProps.updateTriggers || {})
      }
    }) as unknown as Layer;
  }
}

/**
 * Resolves either a static color or object color accessor.
 * @param object Object being colored.
 * @param color Static color or accessor from layer props.
 * @returns RGBA color.
 */
function getObjectColor<DataT>(object: DataT, color?: Color | ((object: DataT) => Color)): Color {
  if (typeof color === 'function') {
    return color(object);
  }
  return color || DEFAULT_COLOR;
}
