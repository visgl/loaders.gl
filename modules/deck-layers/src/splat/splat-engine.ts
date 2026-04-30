// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  Buffer,
  type Binding,
  type BindingDeclaration,
  type ComputePipeline,
  type Device,
  type Shader
} from '@luma.gl/core';
import type {Color} from '@deck.gl/core';
import {BoundingSphere, CullingVolume} from '@math.gl/culling';
import {
  projectSplatCovarianceToScreen,
  projectWorldPositionToScreen,
  transformPosition
} from './splat-covariance';
import {type GaussianSplatData, getGaussianSplatDataFromArrowTable} from './splat-data';
import {
  getSortedSplatIndicesByDepth,
  getSplatTileGrid,
  getSplatTileBufferByteLengths,
  getSplatTransientBufferByteLengths,
  packSplatDepthKey
} from './splat-sort';
import {
  SPLAT_COMPUTE_F32_PARAM_COUNT,
  SPLAT_COMPUTE_PARAM_BYTE_LENGTH,
  SPLAT_COMPUTE_SHADER,
  SPLAT_COMPUTE_WORKGROUP_SIZE
} from './splat-compute-shaders';

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
  /** Additional two-dimensional screen-space Gaussian kernel radius in pixels. */
  kernel2DSize: number;
  /** Maximum one-sigma screen-space splat size in pixels. */
  maxScreenSpaceSplatSize: number;
};

/** Draw-time inputs used by {@link SplatEngine.update}. */
export type SplatEngineUpdateProps = {
  /** Optional model-view-projection matrix used for CPU projection until the compute pass lands. */
  modelViewProjectionMatrix?: readonly number[];
  /** Optional viewport size used for screen-space culling. */
  viewportSize?: readonly [number, number];
  /** Optional math.gl culling volume used for frustum culling. */
  cullingVolume?: CullingVolume;
  /** Render radius multiplier used for screen-size culling. */
  radiusScale?: number;
};

/** Bindings consumed by the future WebGPU render path. */
export type SplatRenderBindings = Record<string, Binding>;

/** CPU mirror of projected per-splat render values. */
export type SplatProjectedData = {
  /** First one-sigma ellipse axis in screen pixels. */
  axis0: readonly [number, number];
  /** Second one-sigma ellipse axis in screen pixels. */
  axis1: readonly [number, number];
  /** Normalized opacity after decode. */
  opacity: number;
  /** Visibility flag after engine-side culling. */
  visible: number;
  /** Maximum one-sigma axis length in screen pixels. */
  maxAxisPixels: number;
};

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

/** GPU buffers used only by the compute projection and tile sorting path. */
type SplatComputeBuffers = {
  /** Compute parameter uniform buffer. */
  params: Buffer;
  /** Atomic count buffer: visible count and overflow count. */
  counts: Buffer;
  /** CPU-readable staging buffer for count readback. */
  countReadback: Buffer;
  /** Number of visible splats assigned to each tile. */
  tileCounts: Buffer;
  /** Prefix offset for each tile plus one sentinel offset. */
  tileOffsets: Buffer;
  /** Atomic scatter cursors initialized from tile offsets. */
  tileCursors: Buffer;
  /** Compact visible splat indices grouped by tile. */
  tileIndices: Buffer;
  /** Compact visible splat depth keys grouped by tile. */
  tileKeys: Buffer;
  /** Temporary tile index storage reserved for future radix kernels. */
  tempTileIndices: Buffer;
  /** Temporary tile key storage reserved for future radix kernels. */
  tempTileKeys: Buffer;
};

/** Lazily-created compute shader and per-entry-point pipelines. */
type SplatComputePipelines = {
  /** Shared WGSL compute shader module. */
  shader: Shader;
  /** Clear pass pipeline. */
  clear: ComputePipeline;
  /** Projection and tile-count pass pipeline. */
  project: ComputePipeline;
  /** Serial tile prefix scan pipeline. */
  scanTiles: ComputePipeline;
  /** Visible splat scatter pipeline. */
  scatterTiles: ComputePipeline;
  /** Tile-local sort pipeline. */
  tileSort: ComputePipeline;
  /** Sorted compact index copy pipeline. */
  copySorted: ComputePipeline;
};

const DEFAULT_ENGINE_PROPS: SplatEngineProps = {
  sortMode: 'global',
  alphaCutoff: 1 / 255,
  screenSizeCutoffPixels: 0,
  gaussianSupportRadius: 3,
  kernel2DSize: 0.3,
  maxScreenSpaceSplatSize: 1024
};

const COUNT_BUFFER_BYTE_LENGTH = 2 * Uint32Array.BYTES_PER_ELEMENT;

const COMPUTE_BINDING_DECLARATIONS = {
  positions: {name: 'positions', type: 'read-only-storage', group: 0, location: 0},
  scales: {name: 'scales', type: 'read-only-storage', group: 0, location: 1},
  rotations: {name: 'rotations', type: 'read-only-storage', group: 0, location: 2},
  opacities: {name: 'opacities', type: 'read-only-storage', group: 0, location: 3},
  keys: {name: 'keys', type: 'storage', group: 0, location: 4},
  indices: {name: 'indices', type: 'storage', group: 0, location: 5},
  projected: {name: 'projected', type: 'storage', group: 0, location: 6},
  tileCounts: {name: 'tileCounts', type: 'storage', group: 0, location: 7},
  tileOffsets: {name: 'tileOffsets', type: 'storage', group: 0, location: 8},
  tileCursors: {name: 'tileCursors', type: 'storage', group: 0, location: 9},
  tileIndices: {name: 'tileIndices', type: 'storage', group: 0, location: 10},
  tileKeys: {name: 'tileKeys', type: 'storage', group: 0, location: 11},
  tempTileIndices: {name: 'tempTileIndices', type: 'storage', group: 0, location: 12},
  tempTileKeys: {name: 'tempTileKeys', type: 'storage', group: 0, location: 13},
  counts: {name: 'counts', type: 'storage', group: 0, location: 14},
  params: {name: 'params', type: 'uniform', group: 0, location: 15}
} as const satisfies Record<string, BindingDeclaration>;

const COMPUTE_PIPELINE_BINDING_NAMES: Record<string, readonly string[]> = {
  clear: ['tileCounts', 'tileOffsets', 'tileCursors', 'counts', 'params'],
  project: [
    'positions',
    'scales',
    'rotations',
    'opacities',
    'keys',
    'projected',
    'tileCounts',
    'params'
  ],
  scanTiles: ['tileCounts', 'tileOffsets', 'tileCursors', 'counts', 'params'],
  scatterTiles: [
    'positions',
    'keys',
    'projected',
    'tileCursors',
    'tileIndices',
    'tileKeys',
    'params'
  ],
  tileSort: ['tileOffsets', 'tileIndices', 'tileKeys', 'counts', 'params'],
  copySorted: ['indices', 'tileIndices', 'counts', 'params']
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
  private renderSplatCount = 0;
  private dataVersion = 0;
  private sortedVersion = -1;
  private propsChanged = true;
  private updateSignature = '';
  private computeBuffers: SplatComputeBuffers | null = null;
  private computePipelines: SplatComputePipelines | null = null;
  private computeTileGrid = getSplatTileGrid(1, 1);
  private computeBufferSignature = '';
  private countReadbackPromise: Promise<void> | null = null;
  private computeUpdateSerial = 0;
  private overflowSplatCount = 0;

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
    this.destroyComputeResources();
  }

  /** Update engine options and mark dependent state dirty when values change. */
  setProps(props: Partial<SplatEngineProps>): void {
    const nextProps = {...this.props, ...props};
    if (
      nextProps.sortMode !== this.props.sortMode ||
      nextProps.alphaCutoff !== this.props.alphaCutoff ||
      nextProps.screenSizeCutoffPixels !== this.props.screenSizeCutoffPixels ||
      nextProps.gaussianSupportRadius !== this.props.gaussianSupportRadius ||
      nextProps.kernel2DSize !== this.props.kernel2DSize ||
      nextProps.maxScreenSpaceSplatSize !== this.props.maxScreenSpaceSplatSize
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
    this.renderSplatCount = data.length;
    this.keys = new Uint32Array(data.length);
    this.projectedData = new Float32Array(Math.max(data.length, 1) * 8);
    this.computeBufferSignature = '';
    this.overflowSplatCount = 0;
    this.countReadbackPromise = null;

    this.destroyBuffers();
    this.destroyComputeBuffers();
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

    if (this.shouldUseComputeTilePath()) {
      this.updateComputeTileBuffers(props);
    } else {
      this.updateDepthSortBuffers(props);
    }
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

  /** Return the number of visible splats in the current render index buffer. */
  getRenderSplatCount(): number {
    return this.renderSplatCount;
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
    const projectedIndex = index * 8;
    return {
      axis0: [this.projectedData[projectedIndex + 0], this.projectedData[projectedIndex + 1]],
      axis1: [this.projectedData[projectedIndex + 2], this.projectedData[projectedIndex + 3]],
      opacity: this.projectedData[projectedIndex + 4],
      visible: this.projectedData[projectedIndex + 5],
      maxAxisPixels: this.projectedData[projectedIndex + 6]
    };
  }

  /** Return whether the active device can run the compute tile path for validation. */
  getUsesComputeTilePathForTesting(): boolean {
    return this.shouldUseComputeTilePath();
  }

  /** Return the current compute tile grid for validation. */
  getComputeTileGridForTesting(): ReturnType<typeof getSplatTileGrid> {
    return this.computeTileGrid;
  }

  /** Return the last tile overflow count reported by the compute sorter. */
  getOverflowSplatCountForTesting(): number {
    return this.overflowSplatCount;
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

  /** Return true when the current device exposes the WebGPU compute APIs needed by tile mode. */
  private shouldUseComputeTilePath(): boolean {
    return (
      (this.props.sortMode === 'tile' || this.props.sortMode === 'none') &&
      typeof this.device.createShader === 'function' &&
      typeof this.device.createComputePipeline === 'function' &&
      typeof this.device.createCommandEncoder === 'function'
    );
  }

  /** Run WebGPU projection, tile binning, optional tile sort, and visible-count readback. */
  private updateComputeTileBuffers(props: SplatEngineUpdateProps): void {
    const data = this.data;
    const buffers = this.buffers;
    if (!data || !buffers) {
      return;
    }

    this.ensureComputeResources(props);
    const computeBuffers = this.computeBuffers;
    const computePipelines = this.computePipelines;
    if (!computeBuffers || !computePipelines) {
      return;
    }

    this.writeComputeParams(props);
    const bindings = this.getComputeBindings();
    const commandEncoder = this.device.createCommandEncoder({id: 'splat-compute-command-encoder'});
    const computePass = commandEncoder.beginComputePass({id: 'splat-compute-pass'});
    const splatWorkgroups = Math.ceil(Math.max(data.length, 1) / SPLAT_COMPUTE_WORKGROUP_SIZE);
    const clearWorkgroups = Math.ceil(
      Math.max(this.computeTileGrid.tileCount + 1, 2) / SPLAT_COMPUTE_WORKGROUP_SIZE
    );
    const sortMode = this.props.sortMode;

    dispatchComputePipeline(
      computePass,
      computePipelines.clear,
      filterBindings(bindings, COMPUTE_PIPELINE_BINDING_NAMES.clear),
      clearWorkgroups
    );
    dispatchComputePipeline(
      computePass,
      computePipelines.project,
      filterBindings(bindings, COMPUTE_PIPELINE_BINDING_NAMES.project),
      splatWorkgroups
    );
    dispatchComputePipeline(
      computePass,
      computePipelines.scanTiles,
      filterBindings(bindings, COMPUTE_PIPELINE_BINDING_NAMES.scanTiles),
      1
    );
    dispatchComputePipeline(
      computePass,
      computePipelines.scatterTiles,
      filterBindings(bindings, COMPUTE_PIPELINE_BINDING_NAMES.scatterTiles),
      splatWorkgroups
    );
    if (sortMode === 'tile') {
      dispatchComputePipeline(
        computePass,
        computePipelines.tileSort,
        filterBindings(bindings, COMPUTE_PIPELINE_BINDING_NAMES.tileSort),
        this.computeTileGrid.tileCount
      );
    }
    dispatchComputePipeline(
      computePass,
      computePipelines.copySorted,
      filterBindings(bindings, COMPUTE_PIPELINE_BINDING_NAMES.copySorted),
      splatWorkgroups
    );
    computePass.end();
    const shouldReadCounts = !this.countReadbackPromise;
    if (shouldReadCounts) {
      commandEncoder.copyBufferToBuffer({
        sourceBuffer: computeBuffers.counts,
        destinationBuffer: computeBuffers.countReadback,
        size: COUNT_BUFFER_BYTE_LENGTH
      });
    }
    this.device.submit(commandEncoder.finish({id: 'splat-compute-command-buffer'}));

    if (shouldReadCounts) {
      this.updateCountReadback();
    }
  }

  /** Create or resize compute resources for the current data and viewport tile grid. */
  private ensureComputeResources(props: SplatEngineUpdateProps): void {
    const data = this.data;
    if (!data) {
      return;
    }

    this.ensureComputePipelines();
    const viewportSize = props.viewportSize ?? [1, 1];
    const tileGrid = getSplatTileGrid(viewportSize[0], viewportSize[1]);
    const nextSignature = `${data.length}|${tileGrid.columns}|${tileGrid.rows}|${tileGrid.tileSizePixels}`;
    if (this.computeBuffers && this.computeBufferSignature === nextSignature) {
      this.computeTileGrid = tileGrid;
      return;
    }

    this.destroyComputeBuffers();
    const tileByteLengths = getSplatTileBufferByteLengths(data.length, tileGrid);
    const compactByteLength = Math.max(data.length, 1) * Uint32Array.BYTES_PER_ELEMENT;
    this.computeBuffers = {
      params: this.device.createBuffer({
        usage: Buffer.UNIFORM | Buffer.COPY_DST,
        byteLength: SPLAT_COMPUTE_PARAM_BYTE_LENGTH
      }),
      counts: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
        byteLength: COUNT_BUFFER_BYTE_LENGTH
      }),
      countReadback: this.device.createBuffer({
        usage: Buffer.MAP_READ | Buffer.COPY_DST,
        byteLength: COUNT_BUFFER_BYTE_LENGTH
      }),
      tileCounts: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST,
        byteLength: tileByteLengths.tileCounts
      }),
      tileOffsets: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST,
        byteLength: tileByteLengths.tileOffsets
      }),
      tileCursors: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST,
        byteLength: tileByteLengths.tileCounts
      }),
      tileIndices: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: compactByteLength
      }),
      tileKeys: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: compactByteLength
      }),
      tempTileIndices: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: compactByteLength
      }),
      tempTileKeys: this.device.createBuffer({
        usage: Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
        byteLength: compactByteLength
      })
    };
    this.computeTileGrid = tileGrid;
    this.computeBufferSignature = nextSignature;
  }

  /** Lazily create the shared compute shader and all entry-point pipelines. */
  private ensureComputePipelines(): void {
    if (this.computePipelines) {
      return;
    }

    const shader = this.device.createShader({
      id: 'splat-compute-shader',
      source: SPLAT_COMPUTE_SHADER,
      language: 'wgsl',
      stage: 'compute'
    });
    this.computePipelines = {
      shader,
      clear: this.createComputePipeline(shader, 'clear'),
      project: this.createComputePipeline(shader, 'project'),
      scanTiles: this.createComputePipeline(shader, 'scanTiles'),
      scatterTiles: this.createComputePipeline(shader, 'scatterTiles'),
      tileSort: this.createComputePipeline(shader, 'tileSort'),
      copySorted: this.createComputePipeline(shader, 'copySorted')
    };
  }

  /** Create a compute pipeline for one WGSL entry point. */
  private createComputePipeline(shader: Shader, entryPoint: string): ComputePipeline {
    return this.device.createComputePipeline({
      id: `splat-compute-${entryPoint}`,
      shader,
      entryPoint,
      shaderLayout: getComputeShaderLayout(entryPoint)
    });
  }

  /** Write matrix, viewport, culling, and tile parameters consumed by WGSL. */
  private writeComputeParams(props: SplatEngineUpdateProps): void {
    const data = this.data;
    const computeBuffers = this.computeBuffers;
    if (!data || !computeBuffers) {
      return;
    }

    const paramsArrayBuffer = new ArrayBuffer(SPLAT_COMPUTE_PARAM_BYTE_LENGTH);
    const paramsF32 = new Float32Array(paramsArrayBuffer);
    const paramsU32 = new Uint32Array(paramsArrayBuffer);
    const matrix = props.modelViewProjectionMatrix ?? IDENTITY_MATRIX;
    paramsF32.set(matrix.slice(0, 16), 0);
    paramsF32[16] = props.viewportSize?.[0] ?? 1;
    paramsF32[17] = props.viewportSize?.[1] ?? 1;
    paramsF32[18] = this.props.alphaCutoff;
    paramsF32[19] = Math.max(props.radiusScale ?? 1, 0);
    paramsF32[20] = this.props.gaussianSupportRadius;
    paramsF32[21] = this.props.screenSizeCutoffPixels;
    paramsF32[22] = this.props.kernel2DSize;
    paramsF32[23] = this.props.maxScreenSpaceSplatSize;
    writeCullingPlanes(paramsF32, props.cullingVolume);

    const u32Offset = SPLAT_COMPUTE_F32_PARAM_COUNT;
    paramsU32[u32Offset + 0] = data.length;
    paramsU32[u32Offset + 1] = this.computeTileGrid.columns;
    paramsU32[u32Offset + 2] = this.computeTileGrid.rows;
    paramsU32[u32Offset + 3] = this.computeTileGrid.tileSizePixels;
    paramsU32[u32Offset + 4] = this.computeTileGrid.tileCount;
    paramsU32[u32Offset + 5] =
      this.props.sortMode === 'tile' ? 2 : this.props.sortMode === 'global' ? 1 : 0;

    computeBuffers.params.write(new Uint8Array(paramsArrayBuffer));
  }

  /** Build the binding map shared by all compute entry points. */
  private getComputeBindings(): Record<string, Binding> {
    const buffers = this.buffers;
    const computeBuffers = this.computeBuffers;
    if (!buffers || !computeBuffers) {
      return {};
    }

    return {
      positions: buffers.positions,
      scales: buffers.scales,
      rotations: buffers.rotations,
      opacities: buffers.opacities,
      keys: buffers.keys,
      indices: buffers.indices,
      projected: buffers.projected,
      tileCounts: computeBuffers.tileCounts,
      tileOffsets: computeBuffers.tileOffsets,
      tileCursors: computeBuffers.tileCursors,
      tileIndices: computeBuffers.tileIndices,
      tileKeys: computeBuffers.tileKeys,
      tempTileIndices: computeBuffers.tempTileIndices,
      tempTileKeys: computeBuffers.tempTileKeys,
      counts: computeBuffers.counts,
      params: computeBuffers.params
    };
  }

  /** Start an asynchronous readback of visible and overflow counts without stalling draw. */
  private updateCountReadback(): void {
    const computeBuffers = this.computeBuffers;
    if (!computeBuffers || this.countReadbackPromise) {
      return;
    }

    const readbackSerial = ++this.computeUpdateSerial;
    this.countReadbackPromise = computeBuffers.countReadback
      .readAsync(0, COUNT_BUFFER_BYTE_LENGTH)
      .then(bytes => {
        if (readbackSerial < this.computeUpdateSerial) {
          return;
        }
        const values = new Uint32Array(bytes.buffer, bytes.byteOffset, 2);
        this.renderSplatCount = Math.min(values[0], this.getSplatCount());
        this.overflowSplatCount = values[1];
      })
      .catch(() => {})
      .finally(() => {
        this.countReadbackPromise = null;
      });
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
      const clipPosition = transformPosition(props.modelViewProjectionMatrix, [
        data.positions[positionIndex + 0],
        data.positions[positionIndex + 1],
        data.positions[positionIndex + 2]
      ]);
      const depth = props.modelViewProjectionMatrix
        ? clipPosition[3]
        : -data.positions[index * 3 + 2];
      depths[index] = depth;
      depthMin = Math.min(depthMin, depth);
      depthMax = Math.max(depthMax, depth);
    }

    for (let index = 0; index < data.length; index++) {
      this.keys[index] = packSplatDepthKey(depths[index], {depthMin, depthMax});
    }

    const tileIds = new Int32Array(data.length);
    const visibleFlags = new Uint8Array(data.length);
    const tileGrid = props.viewportSize
      ? getSplatTileGrid(props.viewportSize[0], props.viewportSize[1])
      : getSplatTileGrid(1, 1);
    const tileCounts = new Uint32Array(tileGrid.tileCount);
    let visibleCount = 0;

    for (let index = 0; index < data.length; index++) {
      const projectedIndex = index * 8;
      const scaleIndex = index * 3;
      const positionIndex = index * 3;
      const opacity = data.opacities[index];
      const scale: [number, number, number] = [
        data.scales[scaleIndex + 0],
        data.scales[scaleIndex + 1],
        data.scales[scaleIndex + 2]
      ];
      const position: [number, number, number] = [
        data.positions[positionIndex + 0],
        data.positions[positionIndex + 1],
        data.positions[positionIndex + 2]
      ];
      const rotationIndex = index * 4;
      const rotation: [number, number, number, number] = [
        data.rotations[rotationIndex + 0],
        data.rotations[rotationIndex + 1],
        data.rotations[rotationIndex + 2],
        data.rotations[rotationIndex + 3]
      ];
      const covariance = projectSplatCovarianceToScreen({
        position,
        scale,
        rotation,
        modelViewProjectionMatrix: props.modelViewProjectionMatrix,
        viewportSize: props.viewportSize,
        kernel2DSize: this.props.kernel2DSize,
        maxScreenSpaceSplatSize: this.props.maxScreenSpaceSplatSize
      });
      const renderedMaxAxisPixels =
        covariance.maxAxisPixels *
        this.props.gaussianSupportRadius *
        Math.max(props.radiusScale ?? 1, 0);
      const boundingRadius =
        Math.max(scale[0], scale[1], scale[2]) * this.props.gaussianSupportRadius;
      const isVisible =
        opacity >= this.props.alphaCutoff &&
        isBoundingSphereVisible(
          props.cullingVolume,
          position[0],
          position[1],
          position[2],
          boundingRadius
        ) &&
        renderedMaxAxisPixels >= this.props.screenSizeCutoffPixels
          ? 1
          : 0;
      this.projectedData[projectedIndex + 0] = covariance.axis0[0];
      this.projectedData[projectedIndex + 1] = covariance.axis0[1];
      this.projectedData[projectedIndex + 2] = covariance.axis1[0];
      this.projectedData[projectedIndex + 3] = covariance.axis1[1];
      this.projectedData[projectedIndex + 4] = opacity;
      this.projectedData[projectedIndex + 5] = isVisible;
      this.projectedData[projectedIndex + 6] = covariance.maxAxisPixels;
      this.projectedData[projectedIndex + 7] = 0;

      if (isVisible) {
        const tileId = getSplatTileId(props, tileGrid, position);
        tileIds[index] = tileId;
        tileCounts[tileId]++;
        visibleFlags[index] = 1;
        visibleCount++;
      } else {
        tileIds[index] = -1;
      }
    }

    this.sortedIndices = getRenderIndices({
      sortMode: this.props.sortMode,
      depths,
      tileIds,
      tileCounts,
      visibleFlags,
      visibleCount
    });
    this.renderSplatCount = this.sortedIndices.length;
    if (this.sortedIndices.length > 0) {
      buffers.indices.write(this.sortedIndices);
    }
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

  /** Destroy compute-only buffers. */
  private destroyComputeBuffers(): void {
    const computeBuffers = this.computeBuffers;
    if (!computeBuffers) {
      return;
    }

    for (const buffer of Object.values(computeBuffers)) {
      buffer.destroy();
    }
    this.computeBuffers = null;
    this.computeBufferSignature = '';
  }

  /** Destroy compute pipelines, shader, and compute-only buffers. */
  private destroyComputeResources(): void {
    this.destroyComputeBuffers();
    const computePipelines = this.computePipelines;
    if (!computePipelines) {
      return;
    }

    computePipelines.clear.destroy();
    computePipelines.project.destroy();
    computePipelines.scanTiles.destroy();
    computePipelines.scatterTiles.destroy();
    computePipelines.tileSort.destroy();
    computePipelines.copySorted.destroy();
    computePipelines.shader.destroy();
    this.computePipelines = null;
  }
}

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

/** Dispatch one compute pipeline with a shared binding map. */
function dispatchComputePipeline(
  computePass: {setPipeline: (pipeline: ComputePipeline) => void; dispatch: (x: number) => void},
  pipeline: ComputePipeline,
  bindings: Record<string, Binding>,
  workgroupCount: number
): void {
  pipeline.setBindings(bindings);
  computePass.setPipeline(pipeline);
  computePass.dispatch(Math.max(Math.ceil(workgroupCount), 1));
}

/** Return a binding map containing only bindings used by one compute entry point. */
function filterBindings(
  bindings: Record<string, Binding>,
  bindingNames: readonly string[]
): Record<string, Binding> {
  const filteredBindings: Record<string, Binding> = {};
  for (const bindingName of bindingNames) {
    filteredBindings[bindingName] = bindings[bindingName];
  }
  return filteredBindings;
}

/** Return the minimal shader layout for one compute entry point. */
function getComputeShaderLayout(entryPoint: string): {bindings: BindingDeclaration[]} {
  const bindingNames = COMPUTE_PIPELINE_BINDING_NAMES[entryPoint];
  return {
    bindings: bindingNames.map(bindingName => COMPUTE_BINDING_DECLARATIONS[bindingName])
  };
}

/** Write six culling planes into the f32 compute parameter block. */
function writeCullingPlanes(
  paramsF32: Float32Array,
  cullingVolume: CullingVolume | undefined
): void {
  for (let planeIndex = 0; planeIndex < 6; planeIndex++) {
    const base = 24 + planeIndex * 4;
    const plane = cullingVolume?.planes[planeIndex];
    if (plane) {
      paramsF32[base + 0] = plane.normal[0];
      paramsF32[base + 1] = plane.normal[1];
      paramsF32[base + 2] = plane.normal[2];
      paramsF32[base + 3] = plane.distance;
    } else {
      paramsF32[base + 0] = 0;
      paramsF32[base + 1] = 0;
      paramsF32[base + 2] = 0;
      paramsF32[base + 3] = Number.POSITIVE_INFINITY;
    }
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
  }|${cullingVolumeSignature}|${props.radiusScale ?? 1}`;
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

/** Return a screen tile id for a projected splat center. */
function getSplatTileId(
  props: SplatEngineUpdateProps,
  tileGrid: ReturnType<typeof getSplatTileGrid>,
  position: readonly [number, number, number]
): number {
  const screenPosition = projectWorldPositionToScreen(
    props.modelViewProjectionMatrix,
    props.viewportSize,
    position
  );
  const column = Math.min(
    Math.max(Math.floor(screenPosition[0] / tileGrid.tileSizePixels), 0),
    tileGrid.columns - 1
  );
  const row = Math.min(
    Math.max(Math.floor(screenPosition[1] / tileGrid.tileSizePixels), 0),
    tileGrid.rows - 1
  );
  return row * tileGrid.columns + column;
}

/** Build the compact render index buffer for the selected sort mode. */
function getRenderIndices(options: {
  sortMode: SplatSortMode;
  depths: Float32Array;
  tileIds: Int32Array;
  tileCounts: Uint32Array;
  visibleFlags: Uint8Array;
  visibleCount: number;
}): Uint32Array {
  if (options.visibleCount === 0) {
    return new Uint32Array(0);
  }

  if (options.sortMode === 'none') {
    const indices = new Uint32Array(options.visibleCount);
    let offset = 0;
    for (let index = 0; index < options.visibleFlags.length; index++) {
      if (options.visibleFlags[index]) {
        indices[offset++] = index;
      }
    }
    return indices;
  }

  if (options.sortMode === 'tile') {
    return getTileSortedRenderIndices(options);
  }

  const visibleDepths = new Float32Array(options.visibleCount);
  const visibleIndices = new Uint32Array(options.visibleCount);
  let offset = 0;
  for (let index = 0; index < options.visibleFlags.length; index++) {
    if (options.visibleFlags[index]) {
      visibleDepths[offset] = options.depths[index];
      visibleIndices[offset] = index;
      offset++;
    }
  }

  const sortedVisibleOffsets = getSortedSplatIndicesByDepth(visibleDepths);
  const sortedIndices = new Uint32Array(options.visibleCount);
  for (let index = 0; index < sortedVisibleOffsets.length; index++) {
    sortedIndices[index] = visibleIndices[sortedVisibleOffsets[index]];
  }
  return sortedIndices;
}

/** Bin visible splats by screen tile and sort each tile segment back-to-front. */
function getTileSortedRenderIndices(options: {
  depths: Float32Array;
  tileIds: Int32Array;
  tileCounts: Uint32Array;
  visibleFlags: Uint8Array;
  visibleCount: number;
}): Uint32Array {
  const tileOffsets = new Uint32Array(options.tileCounts.length + 1);
  for (let tileIndex = 0; tileIndex < options.tileCounts.length; tileIndex++) {
    tileOffsets[tileIndex + 1] = tileOffsets[tileIndex] + options.tileCounts[tileIndex];
  }

  const cursors = tileOffsets.slice(0, -1);
  const indices = new Uint32Array(options.visibleCount);
  for (let index = 0; index < options.visibleFlags.length; index++) {
    if (options.visibleFlags[index]) {
      const tileId = options.tileIds[index];
      indices[cursors[tileId]++] = index;
    }
  }

  for (let tileIndex = 0; tileIndex < options.tileCounts.length; tileIndex++) {
    const start = tileOffsets[tileIndex];
    const end = tileOffsets[tileIndex + 1];
    if (end - start > 1) {
      const segment = Array.from(indices.subarray(start, end));
      segment.sort(
        (leftIndex, rightIndex) => options.depths[rightIndex] - options.depths[leftIndex]
      );
      indices.set(segment, start);
    }
  }

  return indices;
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
