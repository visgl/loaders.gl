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
import {AxisAlignedBoundingBox, OrientedBoundingBox} from '@math.gl/culling';

/** math.gl bounding boxes supported by {@link BoundingBoxLayer}. */
export type BoundingBoxLayerBox = AxisAlignedBoundingBox | OrientedBoundingBox;

/** One rendered edge of a bounding box. */
export type BoundingBoxLayerEdge<DataT = BoundingBoxLayerBox> = {
  /** Source object associated with this edge. */
  object: DataT;
  /** Source position for one wireframe edge. */
  sourcePosition: number[];
  /** Target position for one wireframe edge. */
  targetPosition: number[];
};

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
 * Creates one two-point path per edge for supplied math.gl bounding boxes.
 * @param data Objects to inspect.
 * @param getBoundingBox Bounding box accessor for each object.
 * @returns LineLayer data for the visible edges.
 */
export function createBoundingBoxLayerEdges<DataT>(
  data: DataT[],
  getBoundingBox?: BoundingBoxLayerBox | ((object: DataT) => BoundingBoxLayerBox | null | undefined)
): BoundingBoxLayerEdge<DataT>[] {
  const edges: BoundingBoxLayerEdge<DataT>[] = [];
  for (const object of data) {
    const boundingBox = resolveBoundingBox(object, getBoundingBox);
    if (!boundingBox) {
      continue;
    }
    addBoundingBoxEdges(edges, object, boundingBox);
  }
  return edges;
}

/**
 * Appends the 12 wireframe edges for one bounding box.
 * @param edges Mutable edge array that receives new edges.
 * @param object Source object associated with the bounding box.
 * @param boundingBox math.gl axis-aligned or oriented bounding box.
 */
function addBoundingBoxEdges<DataT>(
  edges: BoundingBoxLayerEdge<DataT>[],
  object: DataT,
  boundingBox: BoundingBoxLayerBox
): void {
  const corners = getBoundingBoxCorners(boundingBox);
  const edgeIndices = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7]
  ];

  for (const [startIndex, endIndex] of edgeIndices) {
    edges.push({
      object,
      sourcePosition: corners[startIndex],
      targetPosition: corners[endIndex]
    });
  }
}

/**
 * Resolves a bounding box from either direct box input or an accessor.
 * @param object Source object.
 * @param getBoundingBox Optional direct box or accessor.
 * @returns Resolved math.gl bounding box.
 */
function resolveBoundingBox<DataT>(
  object: DataT,
  getBoundingBox?: BoundingBoxLayerBox | ((object: DataT) => BoundingBoxLayerBox | null | undefined)
): BoundingBoxLayerBox | null | undefined {
  if (typeof getBoundingBox === 'function') {
    return getBoundingBox(object);
  }
  return getBoundingBox || (object as BoundingBoxLayerBox);
}

/**
 * Returns the eight corners of a math.gl bounding box.
 * @param boundingBox math.gl axis-aligned or oriented bounding box.
 * @returns Eight corner positions.
 */
function getBoundingBoxCorners(boundingBox: BoundingBoxLayerBox): number[][] {
  if (boundingBox instanceof OrientedBoundingBox) {
    return getOrientedBoundingBoxCorners(boundingBox);
  }
  return getAxisAlignedBoundingBoxCorners(boundingBox);
}

/**
 * Returns the eight corners of an axis-aligned bounding box.
 * @param boundingBox math.gl axis-aligned bounding box.
 * @returns Eight corner positions.
 */
function getAxisAlignedBoundingBoxCorners(boundingBox: AxisAlignedBoundingBox): number[][] {
  const [minX, minY, minZ = 0] = boundingBox.minimum;
  const [maxX, maxY, maxZ = minZ] = boundingBox.maximum;
  return [
    [minX, minY, minZ],
    [maxX, minY, minZ],
    [maxX, maxY, minZ],
    [minX, maxY, minZ],
    [minX, minY, maxZ],
    [maxX, minY, maxZ],
    [maxX, maxY, maxZ],
    [minX, maxY, maxZ]
  ];
}

/**
 * Returns the eight corners of an oriented bounding box.
 * @param boundingBox math.gl oriented bounding box.
 * @returns Eight corner positions.
 */
function getOrientedBoundingBoxCorners(boundingBox: OrientedBoundingBox): number[][] {
  const center = boundingBox.center;
  const halfAxes = boundingBox.halfAxes;
  const xAxis = [halfAxes[0], halfAxes[1], halfAxes[2]];
  const yAxis = [halfAxes[3], halfAxes[4], halfAxes[5]];
  const zAxis = [halfAxes[6], halfAxes[7], halfAxes[8]];

  return [
    addSignedAxes(center, xAxis, yAxis, zAxis, -1, -1, -1),
    addSignedAxes(center, xAxis, yAxis, zAxis, 1, -1, -1),
    addSignedAxes(center, xAxis, yAxis, zAxis, 1, 1, -1),
    addSignedAxes(center, xAxis, yAxis, zAxis, -1, 1, -1),
    addSignedAxes(center, xAxis, yAxis, zAxis, -1, -1, 1),
    addSignedAxes(center, xAxis, yAxis, zAxis, 1, -1, 1),
    addSignedAxes(center, xAxis, yAxis, zAxis, 1, 1, 1),
    addSignedAxes(center, xAxis, yAxis, zAxis, -1, 1, 1)
  ];
}

/**
 * Adds signed half-axes to an oriented bounding box center.
 * @param center Box center.
 * @param xAxis First half-axis.
 * @param yAxis Second half-axis.
 * @param zAxis Third half-axis.
 * @param xSign Sign applied to the first half-axis.
 * @param ySign Sign applied to the second half-axis.
 * @param zSign Sign applied to the third half-axis.
 * @returns One oriented bounding box corner.
 */
function addSignedAxes(
  center: readonly number[],
  xAxis: number[],
  yAxis: number[],
  zAxis: number[],
  xSign: number,
  ySign: number,
  zSign: number
): number[] {
  return [
    center[0] + xSign * xAxis[0] + ySign * yAxis[0] + zSign * zAxis[0],
    center[1] + xSign * xAxis[1] + ySign * yAxis[1] + zSign * zAxis[1],
    center[2] + xSign * xAxis[2] + ySign * yAxis[2] + zSign * zAxis[2]
  ];
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
