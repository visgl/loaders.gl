// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {Buffer, type Binding, type Device} from '@luma.gl/core';
import type {Color} from '@deck.gl/core';
import {BoundingSphere, CullingVolume} from '@math.gl/culling';
import {type GaussianSplatData, getGaussianSplatDataFromArrowTable} from './splat-data';
import {
  getSortedSplatIndicesByDepth,
  getSplatTransientBufferByteLengths,
  packSplatDepthKey
} from './splat-sort';

/** Internal sorting modes supported by the splat engine. */
export type SplatSortMode = 'none' | 'global' | 'tile';

/** Props that affect engine resource updates and sorting. */
export type SplatEngineProps = {
  /** Sorting strategy used by the engine. */
  sortMode: SplatSortMode;
  /** Minimum normalized alpha that remains renderable. */
  alphaCutoff: number;
  /** Minimum projected size in pixels that remains renderable. */
  screenSizeCutoffPixels: number;
  /** Gaussian support radius used for CPU fallback radii and future covariance bounds. */
  gaussianSupportRadius: number;
};

/** Draw-time inputs used by {@link SplatEngine.update}. */
export type SplatEngineUpdateProps = {
  /** Optional model-view-projection matrix used for CPU projection until the compute pass lands. */
  modelViewProjectionMatrix?: readonly number[];
  /** Optional viewport size used for screen-space culling. */
  viewportSize?: readonly [number, number];
  /** Optional math.gl culling volume used for frustum culling. */
  cullingVolume?: CullingVolume;
};

/** Bindings consumed by the future WebGPU render path. */
export type SplatRenderBindings = Record<string, Binding>;

/** CPU mirror of projected per-splat render values. */
export type SplatProjectedData = {
  /** Axis-aligned Gaussian support radii in layer units. */
  radii: readonly [number, number];
  /** Normalized opacity after decode. */
  opacity: number;
  /** Visibility flag after engine-side culling. */
  visible: number;
};

type ClipPosition = readonly [number, number, number, number];

/** GPU buffers owned by {@link SplatEngine}. */
export type SplatEngineBuffers = {
  /** Interleaved position storage buffer. */
  positions: Buffer;
  /** Interleaved decoded scale storage buffer. */
  scales: Buffer;
  /** Interleaved quaternion storage buffer. */
  rotations: Buffer;
  /** Normalized opacity storage buffer. */
  opacities: Buffer;
  /** Packed RGBA color storage buffer. */
  colors: Buffer;
  /** Current sortable key buffer. */
  keys: Buffer;
  /** Current sorted index buffer. */
  indices: Buffer;
  /** Temporary sortable key buffer. */
  tempKeys: Buffer;
  /** Temporary sorted index buffer. */
  tempIndices: Buffer;
  /** Projected per-splat data reserved for the WebGPU render shader. */
  projected: Buffer;
};

const DEFAULT_ENGINE_PROPS: SplatEngineProps = {
  sortMode: 'global',
  alphaCutoff: 1 / 255,
  screenSizeCutoffPixels: 0,
  gaussianSupportRadius: 3
};

/** Internal engine that owns Gaussian splat GPU resources and sorting state. */
export class SplatEngine {
  /** luma device that owns all buffers. */
  readonly device: Device;

  /** Current engine props after defaults have been applied. */
  props: SplatEngineProps = {...DEFAULT_ENGINE_PROPS};

  /** Current decoded splat data. */
  data: GaussianSplatData | null = null;

  /** Current GPU buffers. */
  buffers: SplatEngineBuffers | null = null;

  private sortedIndices: Uint32Array = new Uint32Array(0);
  private keys: Uint32Array = new Uint32Array(0);
  private projectedData: Float32Array = new Float32Array(0);
  private dataVersion = 0;
  private sortedVersion = -1;
  private propsChanged = true;
  private updateSignature = '';

  constructor(device: Device, props: Partial<SplatEngineProps> = {}) {
    if (device.type !== 'webgpu') {
      throw new Error('SplatEngine requires a WebGPU device.');
    }

    this.device = device;
    this.setProps(props);
  }

  /** Release all GPU resources owned by this engine. */
  destroy(): void {
    this.destroyBuffers();
  }

  /** Update engine options and mark dependent state dirty when values change. */
  setProps(props: Partial<SplatEngineProps>): void {
    const nextProps = {...this.props, ...props};
    if (
      nextProps.sortMode !== this.props.sortMode ||
      nextProps.alphaCutoff !== this.props.alphaCutoff ||
      nextProps.screenSizeCutoffPixels !== this.props.screenSizeCutoffPixels ||
      nextProps.gaussianSupportRadius !== this.props.gaussianSupportRadius
    ) {
      this.propsChanged = true;
    }
    this.props = nextProps;
  }

  /** Decode Arrow data and upload persistent/transient GPU buffers. */
  setData(table: arrow.Table, fallbackColor: Color): void {
    const data = getGaussianSplatDataFromArrowTable(
      table,
      fallbackColor,
      this.props.gaussianSupportRadius
    );
    this.data = data;
    this.dataVersion++;
    this.sortedVersion = -1;
    this.sortedIndices = createSequentialIndices(data.length);
    this.keys = new Uint32Array(data.length);
    this.projectedData = new Float32Array(Math.max(data.length, 1) * 4);

    this.destroyBuffers();
    this.buffers = this.createBuffers(data);
  }

  /** Update projection/sort state before rendering. */
  update(props: SplatEngineUpdateProps = {}): void {
    if (!this.data || !this.buffers) {
      return;
    }

    const updateSignature = getUpdateSignature(props);
    if (
      !this.propsChanged &&
      this.sortedVersion === this.dataVersion &&
      this.updateSignature === updateSignature
    ) {
      return;
    }

    this.updateDepthSortBuffers(props);
    this.sortedVersion = this.dataVersion;
    this.propsChanged = false;
    this.updateSignature = updateSignature;
  }

  /** Return render bindings for a WebGPU render model. */
  getRenderBindings(): SplatRenderBindings {
    if (!this.buffers) {
      return {};
    }

    return {
      splatPositions: this.buffers.positions,
      splatColors: this.buffers.colors,
      splatIndices: this.buffers.indices,
      splatProjected: this.buffers.projected
    };
  }

  /** Return the number of splats currently managed by this engine. */
  getSplatCount(): number {
    return this.data?.length ?? 0;
  }

  /** Return a copy of the current sorted indices for validation. */
  getSortedIndicesForTesting(): Uint32Array {
    return this.sortedIndices.slice();
  }

  /** Return a copy of the current packed depth keys for validation. */
  getKeysForTesting(): Uint32Array {
    return this.keys.slice();
  }

  /** Return projected data for one splat for validation. */
  getProjectedDataForTesting(index: number): SplatProjectedData {
    const projectedIndex = index * 4;
    return {
      radii: [this.projectedData[projectedIndex + 0], this.projectedData[projectedIndex + 1]],
      opacity: this.projectedData[projectedIndex + 2],
      visible: this.projectedData[projectedIndex + 3]
    };
  }

  private createBuffers(data: GaussianSplatData): SplatEngineBuffers {
    const transientByteLengths = getSplatTransientBufferByteLengths(data.length);
    const colors = packColors(data.colors);

    return {
      positions: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.VERTEX,
        data: data.positions
      }),
      scales: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST,
        data: data.scales
      }),
      rotations: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST,
        data: data.rotations
      }),
      opacities: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST,
        data: data.opacities
      }),
      colors: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST,
        data: colors
      }),
      keys: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: transientByteLengths.keys
      }),
      indices: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        data: this.sortedIndices
      }),
      tempKeys: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: transientByteLengths.tempKeys
      }),
      tempIndices: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: transientByteLengths.tempIndices
      }),
      projected: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: transientByteLengths.projected
      })
    };
  }

  private updateDepthSortBuffers(props: SplatEngineUpdateProps): void {
    const data = this.data;
    const buffers = this.buffers;
    if (!data || !buffers) {
      return;
    }

    const depths = new Float32Array(data.length);
    let depthMin = Number.POSITIVE_INFINITY;
    let depthMax = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < data.length; index++) {
      const positionIndex = index * 3;
      const clipPosition = getClipPosition(
        props.modelViewProjectionMatrix,
        data.positions[positionIndex + 0],
        data.positions[positionIndex + 1],
        data.positions[positionIndex + 2]
      );
      const depth = props.modelViewProjectionMatrix
        ? clipPosition[3]
        : -data.positions[index * 3 + 2];
      depths[index] = depth;
      depthMin = Math.min(depthMin, depth);
      depthMax = Math.max(depthMax, depth);
    }

    if (this.props.sortMode === 'none') {
      this.sortedIndices = createSequentialIndices(data.length);
    } else {
      this.sortedIndices = getSortedSplatIndicesByDepth(depths);
    }

    for (let index = 0; index < data.length; index++) {
      this.keys[index] = packSplatDepthKey(depths[index], {depthMin, depthMax});
    }

    for (let index = 0; index < data.length; index++) {
      const projectedIndex = index * 4;
      const scaleIndex = index * 3;
      const positionIndex = index * 3;
      const opacity = data.opacities[index];
      const radiusX = data.scales[scaleIndex + 0] * this.props.gaussianSupportRadius;
      const radiusY = data.scales[scaleIndex + 1] * this.props.gaussianSupportRadius;
      const screenRadius = getProjectedScreenRadius(
        props,
        data.positions[positionIndex + 0],
        data.positions[positionIndex + 1],
        data.positions[positionIndex + 2],
        radiusX,
        radiusY
      );
      const isVisible =
        opacity >= this.props.alphaCutoff &&
        isBoundingSphereVisible(
          props.cullingVolume,
          data.positions[positionIndex + 0],
          data.positions[positionIndex + 1],
          data.positions[positionIndex + 2],
          Math.max(radiusX, radiusY, data.scales[scaleIndex + 2] * this.props.gaussianSupportRadius)
        ) &&
        screenRadius >= this.props.screenSizeCutoffPixels
          ? 1
          : 0;
      this.projectedData[projectedIndex + 0] = radiusX;
      this.projectedData[projectedIndex + 1] = radiusY;
      this.projectedData[projectedIndex + 2] = opacity;
      this.projectedData[projectedIndex + 3] = isVisible;
    }

    buffers.indices.write(this.sortedIndices);
    buffers.keys.write(this.keys);
    buffers.projected.write(this.projectedData);
  }

  private destroyBuffers(): void {
    const buffers = this.buffers;
    if (!buffers) {
      return;
    }

    for (const buffer of Object.values(buffers)) {
      buffer.destroy();
    }
    this.buffers = null;
  }
}

/** Return a stable signature for projection inputs that affect render buffers. */
function getUpdateSignature(props: SplatEngineUpdateProps): string {
  const matrix = props.modelViewProjectionMatrix;
  const viewportSize = props.viewportSize;
  const cullingVolumeSignature = props.cullingVolume
    ? props.cullingVolume.planes
        .map(plane => `${plane.normal[0]},${plane.normal[1]},${plane.normal[2]},${plane.distance}`)
        .join(';')
    : 'none';
  return `${matrix ? Array.from(matrix).join(',') : 'none'}|${
    viewportSize ? `${viewportSize[0]},${viewportSize[1]}` : 'none'
  }|${cullingVolumeSignature}`;
}

/** Transform one position by an optional column-major matrix. */
function getClipPosition(
  matrix: readonly number[] | undefined,
  x: number,
  y: number,
  z: number
): ClipPosition {
  if (!matrix) {
    return [x, y, z, 1];
  }

  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
    matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15]
  ];
}

/** Test whether a splat bounding sphere intersects the active frustum. */
function isBoundingSphereVisible(
  cullingVolume: CullingVolume | undefined,
  x: number,
  y: number,
  z: number,
  radius: number
): boolean {
  if (!cullingVolume) {
    return true;
  }

  const boundingSphere = new BoundingSphere([x, y, z], Math.max(radius, 0));
  return cullingVolume.computeVisibility(boundingSphere) !== CullingVolume.MASK_OUTSIDE;
}

/** Estimate projected splat radius in pixels for screen-size culling. */
function getProjectedScreenRadius(
  props: SplatEngineUpdateProps,
  x: number,
  y: number,
  z: number,
  radiusX: number,
  radiusY: number
): number {
  if (!props.modelViewProjectionMatrix || !props.viewportSize) {
    return Number.POSITIVE_INFINITY;
  }

  const center = getScreenPosition(props, x, y, z);
  const xEdge = getScreenPosition(props, x + radiusX, y, z);
  const yEdge = getScreenPosition(props, x, y + radiusY, z);
  return Math.max(getDistance2D(center, xEdge), getDistance2D(center, yEdge));
}

/** Project a world position into screen pixels. */
function getScreenPosition(
  props: SplatEngineUpdateProps,
  x: number,
  y: number,
  z: number
): readonly [number, number] {
  const clipPosition = getClipPosition(props.modelViewProjectionMatrix, x, y, z);
  const viewportSize = props.viewportSize || [1, 1];
  const inverseW = clipPosition[3] !== 0 ? 1 / clipPosition[3] : 0;
  const normalizedX = clipPosition[0] * inverseW;
  const normalizedY = clipPosition[1] * inverseW;
  return [(normalizedX * 0.5 + 0.5) * viewportSize[0], (0.5 - normalizedY * 0.5) * viewportSize[1]];
}

/** Calculate a two-dimensional Euclidean distance. */
function getDistance2D(left: readonly [number, number], right: readonly [number, number]): number {
  const dx = left[0] - right[0];
  const dy = left[1] - right[1];
  return Math.sqrt(dx * dx + dy * dy);
}

/** Create a sequential index indirection. */
function createSequentialIndices(length: number): Uint32Array {
  const indices = new Uint32Array(length);
  for (let index = 0; index < length; index++) {
    indices[index] = index;
  }
  return indices;
}

/** Pack RGBA bytes into little-endian unsigned integers for storage buffers. */
function packColors(colors: Uint8Array): Uint32Array {
  const packedColors = new Uint32Array(colors.length / 4);
  for (let index = 0; index < packedColors.length; index++) {
    packedColors[index] =
      colors[index * 4 + 0] |
      (colors[index * 4 + 1] << 8) |
      (colors[index * 4 + 2] << 16) |
      (colors[index * 4 + 3] << 24);
  }
  return packedColors;
}
