// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {Buffer, type Binding, type Device} from '@luma.gl/core';
import type {Color} from '@deck.gl/core';
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
  /** Optional model-view-projection matrix used for future GPU projection passes. */
  modelViewProjectionMatrix?: readonly number[];
  /** Optional viewport size used by future screen-space culling. */
  viewportSize?: readonly [number, number];
};

/** Bindings consumed by the future WebGPU render path. */
export type SplatRenderBindings = Record<string, Binding>;

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
  private dataVersion = 0;
  private sortedVersion = -1;
  private propsChanged = true;

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

    this.destroyBuffers();
    this.buffers = this.createBuffers(data);
  }

  /** Update projection/sort state before rendering. */
  update(_props: SplatEngineUpdateProps = {}): void {
    if (!this.data || !this.buffers) {
      return;
    }

    if (!this.propsChanged && this.sortedVersion === this.dataVersion) {
      return;
    }

    this.updateDepthSortBuffers();
    this.sortedVersion = this.dataVersion;
    this.propsChanged = false;
  }

  /** Return render bindings for a WebGPU render model. */
  getRenderBindings(): SplatRenderBindings {
    if (!this.buffers) {
      return {};
    }

    return {
      splatPositions: this.buffers.positions,
      splatScales: this.buffers.scales,
      splatRotations: this.buffers.rotations,
      splatOpacities: this.buffers.opacities,
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

  private updateDepthSortBuffers(): void {
    const data = this.data;
    const buffers = this.buffers;
    if (!data || !buffers) {
      return;
    }

    if (this.props.sortMode === 'none') {
      this.sortedIndices = createSequentialIndices(data.length);
    } else {
      const depths = new Float32Array(data.length);
      for (let index = 0; index < data.length; index++) {
        depths[index] = -data.positions[index * 3 + 2];
      }
      this.sortedIndices = getSortedSplatIndicesByDepth(depths);
      for (let index = 0; index < data.length; index++) {
        this.keys[index] = packSplatDepthKey(depths[index]);
      }
    }

    buffers.indices.write(this.sortedIndices);
    buffers.keys.write(this.keys);
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
