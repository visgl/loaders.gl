// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  color,
  CompositeLayer,
  Layer,
  type Attribute,
  type LayerContext,
  picking,
  project32,
  UNIT,
  type CompositeLayerProps,
  type DefaultProps,
  type LayerProps,
  type LayerDataSource,
  type UpdateParameters,
  type Unit,
  type Color
} from '@deck.gl/core';
import type {BufferLayout, Device} from '@luma.gl/core';
import {Geometry, Model} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import type {ArrowTableBatch, MeshArrowTable, TypedArray} from '@loaders.gl/schema';
import {CullingVolume, Plane} from '@math.gl/culling';
import {Matrix4, type Matrix4Like} from '@math.gl/core';
import {
  SplatEngine,
  type SplatEngineProps,
  type SplatEngineUpdateProps,
  type SplatRenderBindings,
  type SplatSortMode,
  type SplatWebGLAttributes
} from './splat/splat-engine';
import {
  getArrowTable,
  getGaussianSplatDataFromArrowTable,
  getGaussianSplatDataFromValues,
  type GaussianSplatValues
} from './splat/splat-data';

const DEFAULT_COLOR = [255, 255, 255, 255] as const;
const DEFAULT_RAD_SPLAT_MAX_CHUNKS = 32;
const DEFAULT_RAD_SPLAT_MAX_SPLATS = 2100000;
const DEFAULT_RAD_SPLAT_MAX_CONCURRENT_CHUNK_REQUESTS = 4;
const DEFAULT_RAD_SPLAT_MAX_OUTSTANDING_CHUNK_WORK_MULTIPLIER = 1;
const DEFAULT_RAD_SPLAT_CHUNK_RETRY_COUNT = 2;
const DEFAULT_RAD_SPLAT_CHUNK_RETRY_DELAY_MS = 120;
const DEFAULT_RAD_SPLAT_CHUNK_TIMEOUT_MS = 30000;
const DEFAULT_RAD_SPLAT_PREFETCH_CHUNK_MULTIPLIER = 4;
const DEFAULT_RAD_FRONTIER_MAX_SUPPRESSED_CHILD_SPLATS = 65536;
const DEFAULT_RAD_CHILD_SUPPRESSION_COVERAGE = 0.02;
const DEFAULT_RAD_PARENT_REPLACEMENT_COVERAGE = 0.85;
const DEFAULT_RAD_PARENT_MIN_PARTIAL_OPACITY_WEIGHT = 0.005;
const DEFAULT_RAD_PARENT_COVERAGE_FADE_SCALE = 512;
const DEFAULT_RAD_PRIORITY_MAX_SCORED_ROWS = 131072;
const DEFAULT_RAD_RENDER_PAGE_MAX_SPLATS = 262144;
const DEFAULT_RAD_RENDER_LOADING_COMMIT_INTERVAL_MS = 1000;
const DEFAULT_RAD_LOD_MIN_PROJECTED_PIXELS = 1;
const IDENTITY_MODEL_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const;

/** Public rendering modes supported by {@link SplatLayer}. */
export type SplatRenderMode = 'auto' | 'cpu' | 'gpu';

/** Public sorting modes supported by {@link SplatLayer}. */
export type PublicSplatSortMode = 'none' | 'global' | 'tile';

/** Props for {@link SplatLayer}. */
export type SplatLayerProps = CompositeLayerProps & {
  /** Gaussian splat table or loaders.gl Arrow table batches produced by `PLYLoader` with `ply.shape: 'arrow-table'`. */
  data: MeshArrowTable | arrow.Table | AsyncIterable<ArrowTableBatch> | null;
  /** Units used by decoded splat radii. */
  sizeUnits?: Unit;
  /** Radius multiplier applied after decoding `scale_*` columns. */
  radiusScale?: number;
  /** Minimum rendered splat radius in pixels. */
  radiusMinPixels?: number;
  /** Maximum rendered splat radius in pixels. */
  radiusMaxPixels?: number;
  /** Additional multiplier applied to decoded Gaussian alpha before blending. */
  alphaScale?: number;
  /** Fallback color used when spherical harmonic DC columns are not present. */
  getColor?: Color;
  /** Selects CPU/WebGL fallback rendering or the WebGPU engine path. */
  renderMode?: SplatRenderMode;
  /** Sorting strategy used by the WebGPU engine path. */
  sortMode?: PublicSplatSortMode;
  /** Minimum normalized alpha retained by the WebGPU engine path. */
  alphaCutoff?: number;
  /** Minimum projected screen size retained by the WebGPU engine path. */
  screenSizeCutoffPixels?: number;
  /** Gaussian support radius used when deriving billboard radii and bounds. */
  gaussianSupportRadius?: number;
  /** Additional two-dimensional screen-space Gaussian kernel radius in pixels. */
  kernel2DSize?: number;
  /** Maximum one-sigma screen-space splat size in pixels before support scaling. */
  maxScreenSpaceSplatSize?: number;
};

/** Bounds for decoded RAD splats in source coordinates. */
export type RADSplatBounds = {
  /** Minimum x, y, z values. */
  mins: [number, number, number];
  /** Maximum x, y, z values. */
  maxs: [number, number, number];
};

/** Progress event emitted while {@link RADSplatLayer} loads direct RAD chunks. */
export type RADSplatLoadProgress = {
  /** Whether the layer is currently loading chunks. */
  isLoading: boolean;
  /** Number of source chunks loaded so far. */
  loadedChunkCount: number;
  /** Number of source chunks selected for this load. */
  selectedChunkCount: number;
  /** Number of decoded splats loaded so far. */
  loadedSplatCount: number;
  /** Total splat count declared by RAD metadata. */
  totalSplatCount: number;
  /** Final visible splat count after optional parent pruning. */
  visibleSplatCount?: number;
  /** Final load duration in milliseconds. */
  loadTimeMs?: number;
  /** Final decoded bounds when available. */
  bounds?: RADSplatBounds;
  /** Number of decoded chunks resident in the runtime page store. */
  residentChunkCount?: number;
  /** Number of decoded splats resident in the runtime page store. */
  residentSplatCount?: number;
  /** Number of chunk requests currently in flight. */
  requestedChunkCount?: number;
  /** Number of resident chunks evicted since the current source was opened. */
  evictedChunkCount?: number;
  /** Milliseconds spent uploading the most recent chunk page. */
  lastUploadTimeMs?: number;
  /** Milliseconds since the current source started loading when the last coherent LoD set committed. */
  lastCommitTimeMs?: number;
  /** Load failure message. */
  error?: string;
};

/** Minimal RAD source contract consumed by {@link RADSplatLayer}. */
export type RADSplatSourceLike = {
  /** Returns parsed top-level RAD metadata. */
  getMetadata: () => Promise<RADSplatMetadataLike>;
  /** Fetches and decodes one RAD chunk into linear splat arrays. */
  getChunkSplats: (
    chunkIndex: number,
    options?: RADSplatChunkRequestOptions
  ) => Promise<RADSplatChunkValues>;
};

/** Props for rendering RAD sources without first materializing Arrow tables. */
export type RADSplatLayerProps = Omit<SplatLayerProps, 'data'> & {
  /** RAD source object returned by `RADSourceLoader`. */
  data: RADSplatSourceLike | null;
  /** First RAD chunk index to consider. */
  startChunkIndex?: number;
  /** Maximum number of RAD chunks to load. */
  maxChunks?: number;
  /** Maximum number of RAD splats to load before stopping chunk selection. */
  maxSplats?: number;
  /** Preferred Spark-style visible splat budget; overrides `maxSplats` when supplied. */
  lodSplatCount?: number;
  /** Maximum number of RAD chunks to fetch and decode at once. */
  maxConcurrentChunkRequests?: number;
  /** Whether loaded child splats should replace loaded parent LoD splats. */
  pruneLoadedLoDParents?: boolean;
  /** Multiplier applied to screen-space LoD priority. */
  lodSplatScale?: number;
  /** Render-radius multiplier applied after RAD LoD selection. */
  lodRenderScale?: number;
  /** Normalized inner foveation radius that keeps full chunk priority. */
  coneFov0?: number;
  /** Normalized outer foveation radius where `coneFoveate` priority is reached. */
  coneFov?: number;
  /** Relative priority retained for pages behind the active view. */
  behindFoveate?: number;
  /** Relative priority retained near the edge of the active view cone. */
  coneFoveate?: number;
  /** Whether the RAD page set should be reselected as the deck viewport changes. */
  reselectOnViewChange?: boolean;
  /** Maximum decoded RAD chunks retained across page reselections. */
  maxCachedChunks?: number;
  /** Maximum decoded resident splats retained before least-recently-used pages are evicted. */
  maxResidentSplats?: number;
  /** Alias for resident splat capacity used by Spark-style paged renderers. */
  maxPagedSplats?: number;
  /** Called as RAD chunks are loaded and uploaded. */
  onLoadProgress?: (progress: RADSplatLoadProgress) => void;
};

type RADSplatMetadataLike = {
  /** Total splat count declared by RAD metadata. */
  count: number;
  /** Nominal chunk size when per-chunk counts are omitted. */
  chunkSize?: number;
  /** RAD chunk table. */
  chunks: {base?: number; count?: number}[];
};

type RADSplatChunkRequestOptions = {
  /** Abort signal forwarded to chunk fetches. */
  signal?: AbortSignal;
  /** RAD chunk decode options. */
  radChunk?: {
    /** Whether decoded LoD child metadata is retained. */
    includeLoDTree?: boolean;
    /** Whether SH rest coefficients are decoded. */
    includeSphericalHarmonics?: boolean;
  };
};

type RADSplatChunkValues = GaussianSplatValues & {
  /** Source-specific RAD metadata. */
  loaderData?: Record<string, unknown>;
};

type RADSplatLoadedChunk = {
  /** Source chunk index. */
  chunkIndex: number;
  /** Decoded Gaussian splats for the chunk. */
  splats: RADSplatChunkValues;
};

type RADSplatRange = {
  /** Inclusive first global splat index loaded. */
  start: number;
  /** Exclusive last global splat index loaded. */
  end: number;
};

type RADSplatLoadedRange = RADSplatRange & {
  /** Source chunk index represented by this loaded global range. */
  chunkIndex: number;
};

type RADSplatChunkSelectionOptions = {
  /** First RAD chunk index used as the root of the LoD traversal. */
  startChunkIndex: number;
  /** Maximum number of chunks to decode. */
  maxChunks: number;
  /** Maximum number of source splats to decode. */
  maxSplats: number;
  /** Maximum number of concurrent chunk requests. */
  maxConcurrentChunkRequests: number;
  /** Active deck.gl viewport used to score LoD children. */
  viewport?: any;
  /** Optional layer model transform applied before viewport projection. */
  modelMatrix?: Matrix4Like | null;
  /** Render radius multiplier used to score projected child importance. */
  radiusScale: number;
  /** Gaussian support radius used to score projected child importance. */
  gaussianSupportRadius: number;
  /** Multiplier applied to screen-space LoD priority. */
  lodSplatScale: number;
  /** Render-radius multiplier applied after RAD LoD selection. */
  lodRenderScale: number;
  /** Normalized inner foveation radius that keeps full priority. */
  coneFov0: number;
  /** Normalized outer foveation radius where `coneFoveate` priority is reached. */
  coneFov: number;
  /** Relative priority retained for pages behind the active view. */
  behindFoveate: number;
  /** Relative priority retained near the edge of the active view cone. */
  coneFoveate: number;
  /** Called after another prioritized chunk batch has been decoded. */
  onLoadedChunksUpdate?: (loadedChunks: RADSplatLoadedChunk[]) => Promise<void> | void;
  /** Decoded RAD chunks retained by the layer across reselections. */
  chunkCache?: Map<number, RADSplatLoadedChunk>;
  /** Maximum decoded RAD chunks retained after a selection pass. */
  maxCachedChunks: number;
};

type RADRuntimeUpdateOptions = {
  /** Active deck.gl device used to create page engines. */
  device: Device;
  /** Active deck.gl viewport used to score LoD children. */
  viewport?: any;
  /** Optional layer model transform applied before viewport projection. */
  modelMatrix?: Matrix4Like | null;
  /** First RAD chunk index used as the root of the LoD traversal. */
  startChunkIndex: number;
  /** Maximum chunks selected for the coherent LoD render set. */
  maxChunks: number;
  /** Maximum source splats selected for the coherent LoD render set. */
  maxSplats: number;
  /** Maximum resident splats retained in decoded pages. */
  maxResidentSplats: number;
  /** Maximum concurrent chunk requests. */
  maxConcurrentChunkRequests: number;
  /** Whether loaded child splats should replace loaded parent LoD splats. */
  pruneLoadedLoDParents: boolean;
  /** Whether camera movement should schedule LoD reselection. */
  reselectOnViewChange: boolean;
  /** Render radius multiplier used to score projected child importance. */
  radiusScale: number;
  /** Gaussian support radius used by page engines and LoD scoring. */
  gaussianSupportRadius: number;
  /** Multiplier applied to screen-space LoD priority. */
  lodSplatScale: number;
  /** Render-radius multiplier applied after RAD LoD selection. */
  lodRenderScale: number;
  /** Normalized inner foveation radius that keeps full priority. */
  coneFov0: number;
  /** Normalized outer foveation radius where `coneFoveate` priority is reached. */
  coneFov: number;
  /** Relative priority retained for pages behind the active view. */
  behindFoveate: number;
  /** Relative priority retained near the edge of the active view cone. */
  coneFoveate: number;
  /** Maximum decoded RAD chunks retained after a selection pass. */
  maxCachedChunks: number;
  /** Fallback color supplied to page engines. */
  fallbackColor: Color;
  /** Splat engine props shared by all RAD page engines. */
  engineProps: Partial<SplatEngineProps>;
};

type RADRuntimeCallbacks = {
  /** Called when runtime progress changes. */
  onProgress: (progress: RADSplatLoadProgress) => void;
  /** Called when renderable page state changes. */
  onStateChange: () => void;
  /** Called when a runtime error belongs to the active source. */
  onError: (error: Error) => void;
};

type RADChunkSelectionPlan = {
  /** Loaded chunks selected for the current coherent LoD set. */
  selectedChunks: RADSplatLoadedChunk[];
  /** Optional row-level frontier selected from loaded RAD LoD nodes. */
  frontierChunks?: RADRenderFrontierChunk[];
  /** Missing chunk indices requested to refine the current LoD set. */
  missingChunkIndices: number[];
};

type RADChunkRequestPlanOptions = {
  /** Already-loaded RAD chunks keyed by source chunk index. */
  loadedByChunkIndex: Map<number, RADSplatLoadedChunk>;
  /** Source metadata for chunk range lookups. */
  metadata: RADSplatMetadataLike;
  /** Chunks that are already pending, queued, or permanently failed. */
  unavailableChunkIndices: Set<number>;
  /** Runtime selection and priority options. */
  options: RADSplatChunkSelectionOptions;
  /** Maximum chunk indices to include in the request plan. */
  maxRequestChunkCount: number;
};

type RADRenderPage = {
  /** Source chunk index represented by this page. */
  chunkIndex: number;
  /** Engine that owns this page's GPU resources. */
  engine: RADPageSplatEngine;
  /** Bounds for sorting page draw order. */
  bounds?: RADSplatBounds;
};

type RADRenderFrontierChunk = {
  /** Loaded source chunk retained by the coherent render frontier. */
  chunk: RADSplatLoadedChunk;
  /** Number of visible rows represented by this source chunk after LoD pruning. */
  visibleSplatCount: number;
  /** Optional local row indices that should remain active for this page. */
  visibleRows?: Uint32Array;
  /** Optional per-row opacity weights for active rows in this page. */
  rowWeights?: Float32Array;
};

type RADChildChunkGroup = {
  /** Combined priority for a single parent splat's unloaded child chunk range. */
  score: number;
  /** Missing chunks needed before this parent can atomically refine to children. */
  chunkIndices: number[];
};

type RADFrontierCandidate = {
  /** Loaded source chunk that owns this LoD node. */
  chunk: RADSplatLoadedChunk;
  /** Local row index inside the owning chunk. */
  rowIndex: number;
  /** Global RAD splat index for this LoD node. */
  globalSplatIndex: number;
  /** Consecutive global index for the first child node. */
  childStart: number;
  /** Number of direct child nodes in the LoD tree. */
  childCount: number;
  /** Projected screen-space splat radius after foveation. */
  pixelScale: number;
  /** Projected screen-space priority for refinement. */
  score: number;
};

type RADLoadedRenderFrontierPlan = {
  /** Loaded row frontier grouped by owning source chunk. */
  frontierChunks: RADRenderFrontierChunk[];
  /** Missing chunks needed before selected parents can refine. */
  missingChunkIndices: number[];
};

type RADChildFrontierCandidates = {
  /** Loaded child candidates that can be refined immediately. */
  childCandidates: RADFrontierCandidate[];
  /** Fraction of direct child rows that are currently loaded. */
  childCoverage: number;
  /** Whether any direct child row belongs to a missing page. */
  hasMissingChildren: boolean;
};

type RADStoredPage = {
  /** Source chunk index represented by this decoded page. */
  chunkIndex: number;
  /** Decoded source chunk retained for future LoD traversal. */
  loadedChunk: RADSplatLoadedChunk;
  /** Page bounds in source coordinates. */
  bounds?: RADSplatBounds;
  /** Last time this page was selected or traversed. */
  lastUsedMs: number;
};

type RADRenderRowSegment = {
  /** Frontier entry that owns the selected rows. */
  frontierChunk: RADRenderFrontierChunk;
  /** Offset into `visibleRows`, or source row offset when `visibleRows` is absent. */
  rowOffset: number;
  /** Number of source rows included in this segment. */
  rowCount: number;
};

type SplatRenderEngineLike = {
  /** Release all GPU resources owned by this render engine. */
  destroy: () => void;
  /** Update engine options and mark dependent state dirty when values change. */
  setProps: (props: Partial<SplatEngineProps>) => void;
  /** Update projection/sort state before rendering. */
  update: (props?: SplatEngineUpdateProps) => void;
  /** Return render bindings for a WebGPU render model. */
  getRenderBindings: () => SplatRenderBindings;
  /** Return deck.gl binary attributes for the WebGL fallback path. */
  getWebGLAttributes: () => SplatWebGLAttributes;
  /** Return the number of splats currently managed by this engine. */
  getSplatCount: () => number;
  /** Return the number of visible splats in the current render index buffer. */
  getRenderSplatCount: () => number;
};

type RADSplatChunkRangeLookup = {
  /** Global splat start per RAD chunk. */
  starts: number[];
  /** Global splat end per RAD chunk. */
  ends: number[];
};

type SplatPrimitiveLayerProps = LayerProps & {
  data: LayerDataSource<unknown>;
  sizeUnits?: Unit;
  radiusScale?: number;
  radiusMinPixels?: number;
  radiusMaxPixels?: number;
  alphaScale?: number;
  alphaCutoff?: number;
  screenSizeCutoffPixels?: number;
  gaussianSupportRadius?: number;
  kernel2DSize?: number;
  maxScreenSpaceSplatSize?: number;
  splatEngine?: SplatRenderEngineLike | null;
};

type SplatUniformProps = {
  sizeUnits: number;
  radiusScale: number;
  radiusMinPixels: number;
  radiusMaxPixels: number;
  alphaScale: number;
  alphaCutoff: number;
  screenSizeCutoffPixels: number;
  gaussianSupportRadius: number;
};

type DeckBinaryData = {
  length: number;
  attributes: Record<string, {value: TypedArray; size: number; type?: string}>;
};

type DrawOptions = {
  /** Shader module props supplied by deck.gl for this draw pass. */
  shaderModuleProps?: {
    /** Picking module uniforms for picking framebuffer passes. */
    picking?: {
      /** Whether this draw is writing to a picking framebuffer. */
      isActive?: boolean;
    };
  };
};

const defaultProps: DefaultProps<SplatLayerProps> = {
  id: 'splat-layer',
  data: {type: 'object', compare: false, value: null},
  sizeUnits: 'meters',
  radiusScale: {type: 'number', min: 0, value: 1},
  radiusMinPixels: {type: 'number', min: 0, value: 0},
  radiusMaxPixels: {type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER},
  alphaScale: {type: 'number', min: 0, value: 1},
  getColor: {type: 'color', value: DEFAULT_COLOR},
  renderMode: 'auto',
  sortMode: 'global',
  alphaCutoff: {type: 'number', min: 0, max: 1, value: 1 / 255},
  screenSizeCutoffPixels: {type: 'number', min: 0, value: 0},
  gaussianSupportRadius: {type: 'number', min: 0, value: 3},
  kernel2DSize: {type: 'number', min: 0, value: 0.3},
  maxScreenSpaceSplatSize: {type: 'number', min: 1, value: 1024}
};

const {data: _splatLayerDefaultData, ...splatLayerDefaultPropsWithoutData} = defaultProps;

const radSplatDefaultProps: DefaultProps<RADSplatLayerProps> = {
  ...splatLayerDefaultPropsWithoutData,
  data: {type: 'object', compare: false, value: null},
  id: 'rad-splat-layer',
  maxChunks: {type: 'number', min: 1, value: DEFAULT_RAD_SPLAT_MAX_CHUNKS},
  maxSplats: {type: 'number', min: 1, value: DEFAULT_RAD_SPLAT_MAX_SPLATS},
  lodSplatCount: {type: 'number', min: 1, value: DEFAULT_RAD_SPLAT_MAX_SPLATS},
  maxConcurrentChunkRequests: {
    type: 'number',
    min: 1,
    value: DEFAULT_RAD_SPLAT_MAX_CONCURRENT_CHUNK_REQUESTS
  },
  pruneLoadedLoDParents: true,
  lodSplatScale: {type: 'number', min: 0, value: 1},
  lodRenderScale: {type: 'number', min: 0, value: 1},
  coneFov0: {type: 'number', min: 0, value: 0.25},
  coneFov: {type: 'number', min: 0, value: 1},
  behindFoveate: {type: 'number', min: 0, max: 1, value: 0.2},
  coneFoveate: {type: 'number', min: 0, max: 1, value: 0.4},
  reselectOnViewChange: true,
  maxCachedChunks: {type: 'number', min: 1, value: 256},
  maxResidentSplats: {type: 'number', min: 1, value: DEFAULT_RAD_SPLAT_MAX_SPLATS * 2},
  maxPagedSplats: {type: 'number', min: 1, value: DEFAULT_RAD_SPLAT_MAX_SPLATS * 2}
};

const splatUniforms = {
  name: 'splat',
  source: '',
  vs: /* glsl */ `\
layout(std140) uniform splatUniforms {
  highp int sizeUnits;
  float radiusScale;
  float radiusMinPixels;
  float radiusMaxPixels;
  float alphaScale;
  float alphaCutoff;
  float screenSizeCutoffPixels;
  float gaussianSupportRadius;
} splat;
`,
  fs: '',
  uniformTypes: {
    sizeUnits: 'i32',
    radiusScale: 'f32',
    radiusMinPixels: 'f32',
    radiusMaxPixels: 'f32',
    alphaScale: 'f32',
    alphaCutoff: 'f32',
    screenSizeCutoffPixels: 'f32',
    gaussianSupportRadius: 'f32'
  }
} as const satisfies ShaderModule<SplatUniformProps>;

const source = /* wgsl */ `\
struct SplatUniforms {
  sizeUnits: i32,
  radiusScale: f32,
  radiusMinPixels: f32,
  radiusMaxPixels: f32,
  alphaScale: f32,
  alphaCutoff: f32,
  screenSizeCutoffPixels: f32,
  gaussianSupportRadius: f32,
};

@group(0) @binding(auto)
var<uniform> splat: SplatUniforms;

@group(0) @binding(auto) var<storage, read> splatPositions: array<f32>;
@group(0) @binding(auto) var<storage, read> splatColors: array<u32>;
@group(0) @binding(auto) var<storage, read> splatIndices: array<u32>;
@group(0) @binding(auto) var<storage, read> splatProjected: array<vec4<f32>>;

struct FragmentInputs {
  @builtin(position) position: vec4<f32>,
  @location(0) gaussianCoord: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) splatAlpha: f32,
  @location(3) supportRadius: f32,
};

@vertex
fn vertexMain(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> FragmentInputs {
  let corner = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, 1.0)
  )[vertexIndex];
  let splatIndex = splatIndices[instanceIndex];
  let positionIndex = splatIndex * 3u;
  let projectedBase = splatIndex * 2u;
  let projectedAxes = splatProjected[projectedBase];
  let projectedMetadata = splatProjected[projectedBase + 1u];
  let splatPosition = vec3<f32>(
    splatPositions[positionIndex],
    splatPositions[positionIndex + 1u],
    splatPositions[positionIndex + 2u]
  );
  let adjustedSplatAlpha = max(projectedMetadata.x, 0.0);
  let adjustedSupportRadius = splat.gaussianSupportRadius + max(adjustedSplatAlpha - 1.0, 0.0) * 0.7;
  let supportScale = adjustedSupportRadius * splat.radiusScale;
  let rawAxis0 = projectedAxes.xy * supportScale;
  let rawAxis1 = projectedAxes.zw * supportScale;
  let rawMaxAxisPixels = max(length(rawAxis0), length(rawAxis1));
  let clampedMaxAxisPixels = min(
    max(rawMaxAxisPixels, splat.radiusMinPixels),
    splat.radiusMaxPixels
  );
  let axisClampScale = clampedMaxAxisPixels / max(rawMaxAxisPixels, 0.000001);
  let axis0 = rawAxis0 * axisClampScale;
  let axis1 = rawAxis1 * axisClampScale;
  let sizeVisibility = select(
    0.0,
    1.0,
    rawMaxAxisPixels >= splat.screenSizeCutoffPixels
  );
  let visibleAlphaScale = layer.opacity * splat.alphaScale * projectedMetadata.y * sizeVisibility;
  let packedColor = splatColors[splatIndex];
  let color = vec4<f32>(
    f32(packedColor & 255u) / 255.0,
    f32((packedColor >> 8u) & 255u) / 255.0,
    f32((packedColor >> 16u) & 255u) / 255.0,
    visibleAlphaScale
  );
  var outputs: FragmentInputs;
  geometry.worldPosition = splatPosition;
  let gaussianCoord = corner * adjustedSupportRadius;
  geometry.uv = gaussianCoord;

  var clipPosition = project_position_to_clipspace(
    splatPosition,
    vec3<f32>(0.0, 0.0, 0.0),
    vec3<f32>(0.0, 0.0, 0.0)
  );
  let pixelOffset = corner.x * axis0 + corner.y * axis1;
  let clipOffset = project_pixel_size_to_clipspace(pixelOffset);
  clipPosition = vec4<f32>(
    clipPosition.x + clipOffset.x,
    clipPosition.y + clipOffset.y,
    clipPosition.z,
    clipPosition.w
  );

  outputs.position = clipPosition;
  outputs.gaussianCoord = gaussianCoord;
  outputs.color = color;
  outputs.splatAlpha = adjustedSplatAlpha;
  outputs.supportRadius = adjustedSupportRadius;
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  let radiusSquared = dot(inputs.gaussianCoord, inputs.gaussianCoord);
  let supportRadius = inputs.supportRadius;
  if (radiusSquared > supportRadius * supportRadius) {
    discard;
  }

  let standardAlpha = inputs.splatAlpha * exp(-0.5 * radiusSquared);
  let extendedArea = exp((inputs.splatAlpha * inputs.splatAlpha - 1.0) / 2.718281828459045);
  let extendedAlpha = 1.0 - pow(1.0 - exp(-0.5 * radiusSquared), extendedArea);
  let alpha = select(standardAlpha, extendedAlpha, inputs.splatAlpha > 1.0);
  let finalAlpha = inputs.color.a * alpha;
  let color = vec4<f32>(inputs.color.rgb * finalAlpha, finalAlpha);
  if (color.a <= splat.alphaCutoff) {
    discard;
  }

  return color;
}
`;

const vs = /* glsl */ `\
#version 300 es
#define SHADER_NAME splat-layer-vertex-shader

in vec3 positions;
in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceRadii;
in vec4 instanceColors;
in vec3 instancePickingColors;

out vec2 unitPosition;
out vec4 vColor;

void main(void) {
  geometry.worldPosition = instancePositions;
  geometry.uv = positions.xy;
  geometry.pickingColor = instancePickingColors;
  unitPosition = positions.xy;

  float radiusPixels = clamp(
    project_size_to_pixel(instanceRadii * splat.radiusScale, splat.sizeUnits),
    splat.radiusMinPixels,
    splat.radiusMaxPixels
  );

  gl_Position = project_position_to_clipspace(
    instancePositions,
    instancePositions64Low,
    vec3(0.0),
    geometry.position
  );
  DECKGL_FILTER_GL_POSITION(gl_Position, geometry);

  vec3 offset = vec3(positions.xy * radiusPixels, 0.0);
  DECKGL_FILTER_SIZE(offset, geometry);
  gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);

  vColor = vec4(instanceColors.rgb, instanceColors.a * layer.opacity * splat.alphaScale);
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`;

const fs = /* glsl */ `\
#version 300 es
#define SHADER_NAME splat-layer-fragment-shader

precision highp float;

in vec2 unitPosition;
in vec4 vColor;

out vec4 fragColor;

void main(void) {
  geometry.uv = unitPosition;
  float radiusSquared = dot(unitPosition, unitPosition);
  if (radiusSquared > 1.0) {
    discard;
  }

  float gaussianAlpha = exp(-6.0 * radiusSquared);
  float alpha = vColor.a * gaussianAlpha;
  fragColor = vec4(vColor.rgb * alpha, alpha);
  if (fragColor.a <= splat.alphaCutoff) {
    discard;
  }

  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

/** WebGPU vertex buffer layout for the storage-buffer driven render path. */
const WEBGPU_SPLAT_BUFFER_LAYOUT: BufferLayout[] = [];

/**
 * Renders GraphDECO-style Gaussian splat PLY data parsed as an Arrow table.
 *
 * The layer expects `POSITION`, `scale_0..2`, `opacity`, and `f_dc_0..2` columns.
 * Optional `f_rest_*` columns are evaluated as view-dependent spherical harmonic color.
 * `scale_*` and `opacity` encodings are read from `loaders_gl.gaussian_splats.*`
 * field metadata when available.
 */
export class SplatLayer extends CompositeLayer<SplatLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'SplatLayer';

  /** Default props shared across splat layers. */
  static defaultProps: DefaultProps = defaultProps;

  declare state: {
    /** WebGPU engine used when the GPU path is selected. */
    splatEngine?: SplatEngine;
    /** Last Arrow table uploaded to the WebGPU engine. */
    engineTable?: arrow.Table;
    /** Last fallback color uploaded to the WebGPU engine. */
    engineFallbackColor?: Color;
    /** Arrow table batches loaded so far from async data. */
    arrowTableBatches: ArrowTableBatch[];
    /** WebGPU engines matching `arrowTableBatches`, when the GPU path is active. */
    streamEngines: (SplatEngine | null)[];
    /** Fallback color used to upload current stream engines. */
    streamEngineFallbackColor?: Color;
    /** Monotonic stream identifier used to ignore stale async data. */
    streamId: number;
    /** Error raised while consuming the current async data stream. */
    streamError: Error | null;
    /** Async iterable currently being consumed. */
    streamingData: AsyncIterable<ArrowTableBatch> | null;
    /** Version incremented when the engine loads another async batch. */
    engineDataVersion: number;
  };

  /** Initializes state used for static and streaming splat rendering. */
  initializeState(): void {
    this.setState({
      arrowTableBatches: [],
      streamEngines: [],
      streamId: 0,
      streamError: null,
      streamingData: null,
      engineDataVersion: 0
    });
  }

  /** Updates the shared splat engine when layer props change. */
  updateState(params: UpdateParameters<this>): void {
    super.updateState(params);

    if (isAsyncIterable(this.props.data)) {
      const splatEngine = this.getOrCreateSplatEngine();
      splatEngine.setProps(this.getSplatEngineProps());
      if (params.changeFlags.dataChanged) {
        this.destroyStreamEngines();
        const streamId = (this.state.streamId || 0) + 1;
        this.setState({
          arrowTableBatches: [],
          streamId,
          streamError: null,
          streamingData: this.props.data
        });
        splatEngine.setData(this.props.data, this.props.getColor || DEFAULT_COLOR);
      }
      return;
    }

    this.destroyStreamEngines();

    if (!this.props.data) {
      this.destroySplatEngine();
      return;
    }

    const arrowTable = getArrowTable(this.props.data);
    const fallbackColor = this.props.getColor || DEFAULT_COLOR;
    const splatEngine = this.getOrCreateSplatEngine();
    splatEngine.setProps(this.getSplatEngineProps());

    if (
      params.changeFlags.dataChanged ||
      this.state.engineTable !== arrowTable ||
      this.state.engineFallbackColor !== fallbackColor ||
      params.changeFlags.propsChanged
    ) {
      splatEngine.setData(arrowTable, fallbackColor);
      this.setState({engineTable: arrowTable, engineFallbackColor: fallbackColor});
    }
  }

  /** Releases the WebGPU engine. */
  finalizeState(context: LayerContext): void {
    super.finalizeState(context);
    this.destroySplatEngine();
    this.destroyStreamEngines();
  }

  /** Renders the Arrow table through a Gaussian billboard primitive. */
  renderLayers(): Layer | Layer[] | null {
    if (!this.props.data) {
      return null;
    }

    if (isAsyncIterable(this.props.data)) {
      const {streamError, splatEngine} = this.state;
      if (streamError) {
        throw streamError;
      }

      return splatEngine && splatEngine.getSplatCount() > 0
        ? this.renderSplatPrimitiveLayer(null, 'splats', splatEngine)
        : null;
    }

    const arrowTable = getArrowTable(this.props.data);
    return this.renderSplatPrimitiveLayer(arrowTable, 'splats', this.state?.splatEngine || null);
  }

  private renderSplatPrimitiveLayer(
    arrowTable: arrow.Table | null,
    id: string,
    splatEngine: SplatEngine | null
  ): Layer {
    const splatData = splatEngine
      ? this.context.device.type === 'webgpu'
        ? {length: splatEngine.getSplatCount(), attributes: {}}
        : splatEngine.getWebGLAttributes()
      : getDeckBinaryDataFromGaussianSplatArrowTable(
          arrowTable!,
          this.props.getColor,
          this.props.gaussianSupportRadius
        );

    return new SplatPrimitiveLayer({
      ...this.getSubLayerProps({id}),
      data: splatData,
      sizeUnits: this.props.sizeUnits,
      radiusScale: this.props.radiusScale,
      radiusMinPixels: this.props.radiusMinPixels,
      radiusMaxPixels: this.props.radiusMaxPixels,
      alphaScale: this.props.alphaScale,
      alphaCutoff: this.props.alphaCutoff,
      screenSizeCutoffPixels: this.props.screenSizeCutoffPixels,
      gaussianSupportRadius: this.props.gaussianSupportRadius,
      kernel2DSize: this.props.kernel2DSize,
      maxScreenSpaceSplatSize: this.props.maxScreenSpaceSplatSize,
      splatEngine
    }) as unknown as Layer;
  }

  private shouldUseGpuEngine(): boolean {
    const renderMode = this.props.renderMode || 'auto';
    const device = this.context?.device;
    if (renderMode === 'cpu') {
      return false;
    }
    if (device?.type === 'webgpu') {
      return true;
    }
    if (renderMode === 'gpu') {
      throw new Error('SplatLayer renderMode "gpu" requires a WebGPU device.');
    }
    return false;
  }

  private getOrCreateSplatEngine(): SplatEngine {
    this.shouldUseGpuEngine();
    let splatEngine = this.state.splatEngine;
    if (!splatEngine) {
      splatEngine = new SplatEngine(this.context.device, this.getSplatEngineProps());
      this.setState({splatEngine});
    }
    return splatEngine;
  }

  private getSplatEngineProps() {
    return {
      sortMode: (this.props.sortMode || 'global') as SplatSortMode,
      alphaCutoff: this.props.alphaCutoff ?? 1 / 255,
      screenSizeCutoffPixels: this.props.screenSizeCutoffPixels ?? 0,
      gaussianSupportRadius: this.props.gaussianSupportRadius ?? 3,
      kernel2DSize: this.props.kernel2DSize ?? 0.3,
      maxScreenSpaceSplatSize: this.props.maxScreenSpaceSplatSize ?? 1024,
      onDataUpdate: () =>
        this.setState({engineDataVersion: (this.state.engineDataVersion || 0) + 1}),
      onDataError: (error: Error) => this.setState({streamError: error})
    };
  }

  private destroySplatEngine(): void {
    this.state.splatEngine?.destroy();
    this.setState({splatEngine: undefined, engineTable: undefined, engineFallbackColor: undefined});
  }

  private destroyStreamEngines(): void {
    this.destroyStreamEngineResources();
    this.setState({
      arrowTableBatches: [],
      streamEngines: [],
      streamEngineFallbackColor: undefined,
      streamError: null,
      streamingData: null,
      engineDataVersion: 0
    });
  }

  /** Releases per-batch WebGPU engines without clearing loaded async batch state. */
  private destroyStreamEngineResources(): void {
    for (const splatEngine of this.state.streamEngines || []) {
      splatEngine?.destroy();
    }
    this.setState({
      streamEngines: [],
      streamEngineFallbackColor: undefined
    });
  }
}

/**
 * Renders Spark RAD sources through a direct typed-array path.
 *
 * This layer bypasses Arrow materialization so larger RAD LoD windows can be decoded and uploaded
 * to the WebGPU splat engine without repeatedly concatenating Arrow tables.
 */
export class RADSplatLayer extends CompositeLayer<RADSplatLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'RADSplatLayer';

  /** Default props for direct RAD rendering. */
  static defaultProps: DefaultProps = radSplatDefaultProps;

  declare state: {
    /** Runtime retaining decoded pages and GPU page engines for the active RAD source. */
    runtime?: RADRuntime;
    /** Error raised by the current RAD load. */
    loadError: Error | null;
    /** Version incremented when RAD data is uploaded. */
    engineDataVersion: number;
  };

  /** Initializes state used for direct RAD rendering. */
  initializeState(): void {
    this.setState({
      loadError: null,
      engineDataVersion: 0
    });
  }

  /** Updates RAD scheduler state when props, state, or viewport buckets change. */
  shouldUpdateState(params: UpdateParameters<this>): boolean {
    return Boolean(
      params.changeFlags.propsOrDataChanged ||
        params.changeFlags.viewportChanged ||
        params.changeFlags.stateChanged
    );
  }

  /** Creates or updates the persistent RAD runtime without clearing it on viewport changes. */
  updateState(params: UpdateParameters<this>): void {
    super.updateState(params);

    const source = this.props.data;
    if (!source) {
      this.destroyRADRuntime();
      return;
    }

    let runtime = this.state.runtime;
    if (params.changeFlags.dataChanged || !runtime || runtime.source !== source) {
      runtime?.destroy();
      runtime = new RADRuntime(source, {
        onProgress: progress => this.reportRADLoadProgress(progress),
        onStateChange: () =>
          this.setState({engineDataVersion: (this.state.engineDataVersion || 0) + 1}),
        onError: error => this.setState({loadError: error})
      });
      this.setState({runtime, loadError: null});
    }

    runtime.update(this.getRADRuntimeUpdateOptions());
  }

  /** Releases the WebGPU engine. */
  finalizeState(context: LayerContext): void {
    super.finalizeState(context);
    this.destroyRADRuntime();
  }

  /** Renders uploaded RAD splats through the Gaussian billboard primitive. */
  renderLayers(): Layer | Layer[] | null {
    if (this.state.loadError) {
      throw this.state.loadError;
    }

    const renderPages = this.state.runtime
      ?.getRenderPages()
      .filter(renderPage => renderPage.engine.getSplatCount() > 0)
      .sort(
        (left, right) =>
          getRADSplatBoundsDepth(right.bounds, this.context.viewport, this.props.modelMatrix) -
            getRADSplatBoundsDepth(left.bounds, this.context.viewport, this.props.modelMatrix) ||
          left.chunkIndex - right.chunkIndex
      );
    return renderPages?.length
      ? renderPages.map(renderPage =>
          this.renderSplatPrimitiveLayer(`splats-${renderPage.chunkIndex}`, renderPage.engine)
        )
      : null;
  }

  /** Emits a RAD load progress callback when supplied. */
  private reportRADLoadProgress(progress: RADSplatLoadProgress): void {
    this.props.onLoadProgress?.(progress);
  }

  /** Renders the uploaded RAD data through a primitive splat layer. */
  private renderSplatPrimitiveLayer(id: string, splatEngine: SplatRenderEngineLike): Layer {
    const splatData =
      this.context.device.type === 'webgpu'
        ? {length: splatEngine.getSplatCount(), attributes: {}}
        : splatEngine.getWebGLAttributes();

    return new SplatPrimitiveLayer({
      ...this.getSubLayerProps({id}),
      data: splatData,
      sizeUnits: this.props.sizeUnits,
      radiusScale: this.getRADRenderRadiusScale(),
      radiusMinPixels: this.props.radiusMinPixels,
      radiusMaxPixels: this.props.radiusMaxPixels,
      alphaScale: this.props.alphaScale,
      alphaCutoff: this.props.alphaCutoff,
      screenSizeCutoffPixels: this.props.screenSizeCutoffPixels,
      gaussianSupportRadius: this.props.gaussianSupportRadius,
      kernel2DSize: this.props.kernel2DSize,
      maxScreenSpaceSplatSize: this.props.maxScreenSpaceSplatSize,
      splatEngine
    }) as unknown as Layer;
  }

  /** Ensures the current device can satisfy the requested RAD render mode. */
  private shouldUseGpuEngine(): boolean {
    const renderMode = this.props.renderMode || 'auto';
    const device = this.context?.device;
    if (renderMode === 'cpu') {
      return false;
    }
    if (device?.type === 'webgpu') {
      return true;
    }
    if (renderMode === 'gpu') {
      throw new Error('RADSplatLayer renderMode "gpu" requires a WebGPU device.');
    }
    return false;
  }

  /** Builds shared splat engine props from layer props. */
  private getSplatEngineProps() {
    return {
      sortMode: (this.props.sortMode || 'global') as SplatSortMode,
      alphaCutoff: this.props.alphaCutoff ?? 1 / 255,
      screenSizeCutoffPixels: this.props.screenSizeCutoffPixels ?? 0,
      gaussianSupportRadius: this.props.gaussianSupportRadius ?? 3,
      kernel2DSize: this.props.kernel2DSize ?? 0.3,
      maxScreenSpaceSplatSize: this.props.maxScreenSpaceSplatSize ?? 1024,
      onDataUpdate: () =>
        this.setState({engineDataVersion: (this.state.engineDataVersion || 0) + 1}),
      onDataError: (error: Error) => this.setState({loadError: error})
    };
  }

  /** Builds runtime update options from the current layer props and viewport. */
  private getRADRuntimeUpdateOptions(): RADRuntimeUpdateOptions {
    this.shouldUseGpuEngine();
    const maxSplats =
      this.props.lodSplatCount ?? this.props.maxSplats ?? DEFAULT_RAD_SPLAT_MAX_SPLATS;
    const maxResidentSplats =
      this.props.maxPagedSplats ??
      this.props.maxResidentSplats ??
      Math.max(maxSplats * 2, DEFAULT_RAD_SPLAT_MAX_SPLATS);
    return {
      device: this.context.device,
      viewport: this.context.viewport,
      modelMatrix: this.props.modelMatrix,
      startChunkIndex: this.props.startChunkIndex ?? 0,
      maxChunks: this.props.maxChunks ?? DEFAULT_RAD_SPLAT_MAX_CHUNKS,
      maxSplats,
      maxResidentSplats,
      maxConcurrentChunkRequests:
        this.props.maxConcurrentChunkRequests ?? DEFAULT_RAD_SPLAT_MAX_CONCURRENT_CHUNK_REQUESTS,
      pruneLoadedLoDParents: this.props.pruneLoadedLoDParents ?? true,
      reselectOnViewChange: this.props.reselectOnViewChange ?? true,
      radiusScale: this.getRADRenderRadiusScale(),
      gaussianSupportRadius: this.props.gaussianSupportRadius ?? 3,
      lodSplatScale: this.props.lodSplatScale ?? 1,
      lodRenderScale: this.props.lodRenderScale ?? 1,
      coneFov0: this.props.coneFov0 ?? 0.25,
      coneFov: this.props.coneFov ?? 1,
      behindFoveate: this.props.behindFoveate ?? 0.2,
      coneFoveate: this.props.coneFoveate ?? 0.4,
      maxCachedChunks: this.props.maxCachedChunks ?? 256,
      fallbackColor: this.props.getColor || DEFAULT_COLOR,
      engineProps: this.getSplatEngineProps()
    };
  }

  /** Return the effective RAD render radius scale including Spark-style render scale. */
  private getRADRenderRadiusScale(): number {
    return (this.props.radiusScale ?? 1) * (this.props.lodRenderScale ?? 1);
  }

  /** Releases the persistent RAD runtime. */
  private destroyRADRuntime(): void {
    this.state.runtime?.destroy();
    this.setState({
      runtime: undefined,
      loadError: null,
      engineDataVersion: 0
    });
  }
}

/** Runtime that keeps RAD chunks resident while camera-driven LoD selection changes. */
class RADRuntime {
  /** RAD source object backing this runtime. */
  readonly source: RADSplatSourceLike;

  private callbacks: RADRuntimeCallbacks;
  private pageStore = new RADPageStore();
  private renderStore = new RADRenderPageStore();
  private metadata: RADSplatMetadataLike | null = null;
  private metadataPromise: Promise<RADSplatMetadataLike> | null = null;
  private options: RADRuntimeUpdateOptions | null = null;
  private pendingChunkPromises = new Map<number, Promise<void>>();
  private failedChunkErrors = new Map<number, Error>();
  private queuedUploadChunks: RADSplatLoadedChunk[] = [];
  private queuedUploadChunkIndices = new Set<number>();
  private uploadScheduled = false;
  private selectionScheduled = false;
  private selectedChunkIndices: number[] = [];
  private visibleChunkIndices: number[] = [];
  private visibleSplatCount = 0;
  private visibleBounds: RADSplatBounds | undefined;
  private loadStartMs = Date.now();
  private lastCommitTimeMs: number | undefined;
  /** Last wall-clock timestamp for a compacted render frontier commit. */
  private lastRenderCommitMs = 0;
  /** Latest selected frontier waiting for a throttled compact render commit. */
  private pendingRenderPlan: RADChunkSelectionPlan | null = null;
  /** Timer handle for the next throttled compact render commit. */
  private pendingRenderCommitTimer: ReturnType<typeof setTimeout> | null = null;
  private selectionSignature = '';
  private scheduleSerial = 0;
  private destroyed = false;

  constructor(source: RADSplatSourceLike, callbacks: RADRuntimeCallbacks) {
    this.source = source;
    this.callbacks = callbacks;
  }

  /** Update runtime inputs and schedule a cooperative LoD refinement pass when needed. */
  update(options: RADRuntimeUpdateOptions): void {
    if (this.destroyed) {
      return;
    }

    this.options = options;
    this.renderStore.setProps(options.engineProps);
    const selectionSignature = getRADRuntimeSelectionSignature(options);
    if (selectionSignature === this.selectionSignature) {
      return;
    }
    this.selectionSignature = selectionSignature;
    this.requestSelection();
  }

  /** Return page engines in the current coherent render frontier. */
  getRenderPages(): RADRenderPage[] {
    return this.renderStore.getRenderPages();
  }

  /** Release all resident GPU resources and ignore pending async work. */
  destroy(): void {
    this.destroyed = true;
    this.scheduleSerial++;
    this.pendingChunkPromises.clear();
    this.failedChunkErrors.clear();
    this.queuedUploadChunks = [];
    this.queuedUploadChunkIndices.clear();
    if (this.pendingRenderCommitTimer) {
      clearTimeout(this.pendingRenderCommitTimer);
      this.pendingRenderCommitTimer = null;
    }
    this.pendingRenderPlan = null;
    this.pageStore.destroy();
    this.renderStore.destroy();
  }

  private requestSelection(): void {
    if (this.selectionScheduled || this.destroyed) {
      return;
    }
    this.selectionScheduled = true;
    const callback = () => {
      this.selectionScheduled = false;
      if (this.destroyed) {
        return;
      }
      void this.scheduleSelection(this.selectionSignature).catch(error => this.handleError(error));
    };
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(callback);
    } else {
      setTimeout(callback, 0);
    }
  }

  private async scheduleSelection(selectionSignature: string): Promise<void> {
    const serial = ++this.scheduleSerial;
    const metadata = await this.loadMetadata();
    if (!this.isActive(serial, selectionSignature)) {
      return;
    }

    const plan = this.selectChunks(metadata);
    const requestChunkIndices = this.getRequestChunkIndices(plan, metadata);
    if (plan.selectedChunks.length > 0) {
      const hasPendingLoadingWork =
        this.pendingChunkPromises.size > 0 ||
        this.queuedUploadChunks.length > 0 ||
        requestChunkIndices.length > 0;
      this.commitSelection(plan, hasPendingLoadingWork);
    } else if (this.visibleChunkIndices.length === 0) {
      this.emitProgress(true);
    }

    this.requestMissingChunks(requestChunkIndices);
    this.evictUnusedPages();
    this.emitProgress(this.pendingChunkPromises.size > 0 || requestChunkIndices.length > 0);
  }

  private async loadMetadata(): Promise<RADSplatMetadataLike> {
    if (this.metadata) {
      return this.metadata;
    }
    if (!this.metadataPromise) {
      this.metadataPromise = this.source.getMetadata().then(metadata => {
        this.metadata = metadata;
        return metadata;
      });
    }
    return await this.metadataPromise;
  }

  private selectChunks(metadata: RADSplatMetadataLike): RADChunkSelectionPlan {
    const options = this.options;
    if (!options || metadata.chunks.length === 0) {
      return {selectedChunks: [], missingChunkIndices: []};
    }

    const residentChunks = this.pageStore.getLoadedChunkMap();
    const selectedChunks: RADSplatLoadedChunk[] = [];
    const selectedByChunkIndex = new Map<number, RADSplatLoadedChunk>();
    const missingChunkIndices: number[] = [];
    const missingChunkIndexSet = new Set<number>();
    const pendingChunkIndices = new Set([
      ...this.pendingChunkPromises.keys(),
      ...this.failedChunkErrors.keys(),
      ...this.queuedUploadChunkIndices
    ]);
    const firstChunkIndex = Math.min(
      Math.max(Math.floor(options.startChunkIndex), 0),
      metadata.chunks.length - 1
    );
    const loadedRenderFrontier = getRADLoadedRenderFrontier(
      residentChunks,
      metadata,
      firstChunkIndex,
      pendingChunkIndices,
      options
    );
    if (loadedRenderFrontier) {
      return {
        selectedChunks: loadedRenderFrontier.frontierChunks.map(({chunk}) => chunk),
        frontierChunks: loadedRenderFrontier.frontierChunks,
        missingChunkIndices: loadedRenderFrontier.missingChunkIndices
      };
    }

    let frontier = metadata.chunks.length > 0 ? [firstChunkIndex] : [];
    let selectedSplatCount = 0;

    while (
      frontier.length > 0 &&
      selectedChunks.length < Math.max(Math.floor(options.maxChunks), 1) &&
      selectedSplatCount < Math.max(Math.floor(options.maxSplats), 1)
    ) {
      const remainingChunkCount = Math.max(
        Math.floor(options.maxChunks) - selectedChunks.length,
        1
      );
      const chunkIndices = getRADNextChunkIndices(
        frontier,
        metadata,
        selectedByChunkIndex,
        pendingChunkIndices,
        remainingChunkCount,
        Math.max(Math.floor(options.maxSplats) - selectedSplatCount, 1)
      );
      if (!chunkIndices.length) {
        break;
      }

      let addedResidentChunk = false;
      let addedMissingChunk = false;
      for (const chunkIndex of chunkIndices) {
        const loadedChunk = residentChunks.get(chunkIndex);
        if (!loadedChunk) {
          if (!missingChunkIndexSet.has(chunkIndex) && !pendingChunkIndices.has(chunkIndex)) {
            missingChunkIndexSet.add(chunkIndex);
            pendingChunkIndices.add(chunkIndex);
            missingChunkIndices.push(chunkIndex);
            addedMissingChunk = true;
          }
          continue;
        }

        selectedByChunkIndex.set(chunkIndex, loadedChunk);
        selectedChunks.push(loadedChunk);
        selectedSplatCount += loadedChunk.splats.splatCount;
        addedResidentChunk = true;
        if (
          selectedChunks.length >= Math.floor(options.maxChunks) ||
          selectedSplatCount >= Math.floor(options.maxSplats)
        ) {
          break;
        }
      }
      if (addedResidentChunk) {
        frontier = getRADCameraPrioritizedChildChunkIndices(
          selectedChunks,
          selectedByChunkIndex,
          metadata,
          options
        );
      } else if (addedMissingChunk) {
        break;
      } else {
        break;
      }

      if (
        !frontier.length &&
        selectedChunks.length < Math.floor(options.maxChunks) &&
        selectedSplatCount < Math.floor(options.maxSplats)
      ) {
        frontier = getRADSplatChunkIndices(
          metadata,
          firstChunkIndex + 1,
          Math.floor(options.maxChunks) - selectedChunks.length,
          Math.floor(options.maxSplats) - selectedSplatCount
        ).filter(
          chunkIndex =>
            !selectedByChunkIndex.has(chunkIndex) &&
            !pendingChunkIndices.has(chunkIndex) &&
            !missingChunkIndexSet.has(chunkIndex)
        );
      }
    }

    return {selectedChunks, missingChunkIndices};
  }

  /** Return immediate missing chunks plus speculative child chunks that fill request capacity. */
  private getRequestChunkIndices(
    plan: RADChunkSelectionPlan,
    metadata: RADSplatMetadataLike
  ): number[] {
    const options = this.options;
    if (!options || plan.selectedChunks.length === 0) {
      return plan.missingChunkIndices;
    }

    return getRADChunkRequestIndices(plan.missingChunkIndices, plan.selectedChunks, {
      loadedByChunkIndex: this.pageStore.getLoadedChunkMap(),
      metadata,
      unavailableChunkIndices: this.getUnavailableChunkIndices(),
      options,
      maxRequestChunkCount:
        getRADMaxConcurrentChunkRequests(options.maxConcurrentChunkRequests) *
        DEFAULT_RAD_SPLAT_PREFETCH_CHUNK_MULTIPLIER
    });
  }

  /** Return chunk indices that should not be selected for a new request. */
  private getUnavailableChunkIndices(): Set<number> {
    return new Set([
      ...this.pendingChunkPromises.keys(),
      ...this.failedChunkErrors.keys(),
      ...this.queuedUploadChunkIndices
    ]);
  }

  /** Commit or defer the selected LoD frontier depending on current chunk loading pressure. */
  private commitSelection(plan: RADChunkSelectionPlan, hasPendingLoadingWork: boolean): void {
    if (this.shouldDeferRenderCommit(hasPendingLoadingWork)) {
      this.pendingRenderPlan = plan;
      this.scheduleDeferredRenderCommit();
      return;
    }
    if (this.pendingRenderCommitTimer) {
      clearTimeout(this.pendingRenderCommitTimer);
      this.pendingRenderCommitTimer = null;
    }
    this.pendingRenderPlan = null;
    this.applySelection(plan);
  }

  /** Return true when compact render page rebuilds should be batched during active loading. */
  private shouldDeferRenderCommit(hasPendingLoadingWork: boolean): boolean {
    if (!hasPendingLoadingWork || this.visibleChunkIndices.length === 0) {
      return false;
    }
    return Date.now() - this.lastRenderCommitMs < DEFAULT_RAD_RENDER_LOADING_COMMIT_INTERVAL_MS;
  }

  /** Schedule the latest pending LoD frontier for a batched compact render page rebuild. */
  private scheduleDeferredRenderCommit(): void {
    if (this.pendingRenderCommitTimer || this.destroyed) {
      return;
    }
    const elapsedMs = Date.now() - this.lastRenderCommitMs;
    const delayMs = Math.max(DEFAULT_RAD_RENDER_LOADING_COMMIT_INTERVAL_MS - elapsedMs, 0);
    this.pendingRenderCommitTimer = setTimeout(() => {
      this.pendingRenderCommitTimer = null;
      const pendingPlan = this.pendingRenderPlan;
      this.pendingRenderPlan = null;
      if (!pendingPlan || this.destroyed) {
        return;
      }
      this.applySelection(pendingPlan);
      this.emitProgress(this.pendingChunkPromises.size > 0 || this.queuedUploadChunks.length > 0);
    }, delayMs);
  }

  /** Apply the selected LoD frontier to visible state and compact render pages. */
  private applySelection(plan: RADChunkSelectionPlan): void {
    const options = this.options;
    const selectedChunks = plan.selectedChunks;
    const frontier: RADRenderFrontierChunk[] =
      plan.frontierChunks ??
      (options?.pruneLoadedLoDParents
        ? getRADRuntimeRenderFrontierLoadedChunks(selectedChunks)
        : selectedChunks.map(chunk => ({chunk, visibleSplatCount: chunk.splats.splatCount})));
    if (options) {
      this.renderStore.updateFrontier(
        options.device,
        frontier,
        options.engineProps,
        options.fallbackColor,
        options.gaussianSupportRadius
      );
    }
    const visibleChunkIndices = Array.from(new Set(frontier.map(({chunk}) => chunk.chunkIndex)));
    this.selectedChunkIndices = selectedChunks.map(chunk => chunk.chunkIndex);
    this.visibleChunkIndices = visibleChunkIndices;
    this.visibleSplatCount = frontier.reduce((total, entry) => total + entry.visibleSplatCount, 0);
    this.visibleBounds = getRADPageBounds(visibleChunkIndices, this.pageStore);
    this.lastCommitTimeMs = Date.now() - this.loadStartMs;
    this.lastRenderCommitMs = Date.now();
    this.callbacks.onStateChange();
  }

  private requestMissingChunks(chunkIndices: number[]): void {
    const options = this.options;
    if (!options) {
      return;
    }

    const maxConcurrentChunkRequests = getRADMaxConcurrentChunkRequests(
      options.maxConcurrentChunkRequests
    );
    const maxOutstandingChunkWork =
      maxConcurrentChunkRequests * DEFAULT_RAD_SPLAT_MAX_OUTSTANDING_CHUNK_WORK_MULTIPLIER;
    for (const chunkIndex of chunkIndices) {
      if (
        this.pendingChunkPromises.size >= maxConcurrentChunkRequests ||
        this.pendingChunkPromises.size + this.queuedUploadChunks.length >= maxOutstandingChunkWork
      ) {
        return;
      }
      if (
        this.pageStore.hasPage(chunkIndex) ||
        this.pendingChunkPromises.has(chunkIndex) ||
        this.failedChunkErrors.has(chunkIndex) ||
        this.queuedUploadChunkIndices.has(chunkIndex)
      ) {
        continue;
      }

      const requestPromise = loadRADSplatChunkWithRetries(this.source, chunkIndex)
        .then(chunk => {
          if (this.destroyed) {
            return;
          }
          this.enqueueUpload(chunk);
        })
        .catch(error => {
          const chunkError = error instanceof Error ? error : new Error(String(error));
          this.failedChunkErrors.set(chunkIndex, chunkError);
          this.handleError(chunkError);
        })
        .finally(() => {
          this.pendingChunkPromises.delete(chunkIndex);
          if (this.destroyed || !this.options) {
            return;
          }
          if (
            !this.failedChunkErrors.has(chunkIndex) &&
            !this.queuedUploadChunkIndices.has(chunkIndex)
          ) {
            this.requestSelection();
          }
        });
      this.pendingChunkPromises.set(chunkIndex, requestPromise);
    }
  }

  private enqueueUpload(chunk: RADSplatLoadedChunk): void {
    if (
      this.pageStore.hasPage(chunk.chunkIndex) ||
      this.queuedUploadChunkIndices.has(chunk.chunkIndex)
    ) {
      return;
    }
    this.queuedUploadChunkIndices.add(chunk.chunkIndex);
    this.queuedUploadChunks.push(chunk);
    this.scheduleUpload();
    this.emitProgress(true);
  }

  private scheduleUpload(): void {
    if (this.uploadScheduled || this.destroyed) {
      return;
    }
    this.uploadScheduled = true;
    const callback = () => this.processQueuedUpload();
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(callback);
    } else {
      setTimeout(callback, 0);
    }
  }

  private processQueuedUpload(): void {
    this.uploadScheduled = false;
    if (this.destroyed) {
      return;
    }

    const chunk = this.queuedUploadChunks.shift();
    if (!chunk) {
      return;
    }
    this.queuedUploadChunkIndices.delete(chunk.chunkIndex);

    const uploadOptions = this.options;
    if (uploadOptions && !this.pageStore.hasPage(chunk.chunkIndex)) {
      this.pageStore.storeChunk(chunk);
      this.callbacks.onStateChange();
      this.requestSelection();
      this.emitProgress(this.pendingChunkPromises.size > 0 || this.queuedUploadChunks.length > 0);
    }

    if (this.queuedUploadChunks.length > 0) {
      this.scheduleUpload();
    }
  }

  private evictUnusedPages(): void {
    const options = this.options;
    if (!options) {
      return;
    }
    this.pageStore.evict(
      options.maxCachedChunks,
      options.maxResidentSplats,
      new Set(this.visibleChunkIndices)
    );
  }

  private emitProgress(isLoading: boolean): void {
    const metadata = this.metadata;
    this.callbacks.onProgress({
      isLoading,
      loadedChunkCount: this.pageStore.getPageCount(),
      selectedChunkCount: this.selectedChunkIndices.length,
      loadedSplatCount: this.pageStore.getResidentSplatCount(),
      visibleSplatCount: this.visibleSplatCount,
      totalSplatCount: metadata?.count ?? 0,
      loadTimeMs:
        !isLoading && this.pageStore.getPageCount() > 0 ? Date.now() - this.loadStartMs : undefined,
      bounds: this.visibleBounds,
      residentChunkCount: this.pageStore.getPageCount(),
      residentSplatCount: this.pageStore.getResidentSplatCount(),
      requestedChunkCount: this.pendingChunkPromises.size + this.queuedUploadChunks.length,
      evictedChunkCount: this.pageStore.evictedChunkCount,
      lastUploadTimeMs: this.renderStore.lastUploadTimeMs ?? this.pageStore.lastUploadTimeMs,
      lastCommitTimeMs: this.lastCommitTimeMs
    });
  }

  private handleError(error: unknown): void {
    if (this.destroyed) {
      return;
    }
    const runtimeError = error instanceof Error ? error : new Error(String(error));
    this.callbacks.onError(runtimeError);
    this.callbacks.onProgress({
      isLoading: false,
      loadedChunkCount: this.pageStore.getPageCount(),
      selectedChunkCount: this.selectedChunkIndices.length,
      loadedSplatCount: this.pageStore.getResidentSplatCount(),
      visibleSplatCount: this.visibleSplatCount,
      totalSplatCount: this.metadata?.count ?? 0,
      error: runtimeError.message
    });
  }

  private isActive(serial: number, selectionSignature: string): boolean {
    return (
      !this.destroyed &&
      serial === this.scheduleSerial &&
      selectionSignature === this.selectionSignature &&
      Boolean(this.options)
    );
  }
}

/** Store of decoded RAD source pages keyed by source chunk index. */
class RADPageStore {
  private pages = new Map<number, RADStoredPage>();

  /** Number of resident pages evicted since the page store was created. */
  evictedChunkCount = 0;
  /** Duration for the latest decoded page store operation. */
  lastUploadTimeMs: number | undefined;

  /** Store one decoded chunk if it is not already resident. */
  storeChunk(chunk: RADSplatLoadedChunk): RADStoredPage {
    const existingPage = this.pages.get(chunk.chunkIndex);
    if (existingPage) {
      existingPage.lastUsedMs = Date.now();
      return existingPage;
    }

    const startTimeMs = Date.now();
    const page: RADStoredPage = {
      chunkIndex: chunk.chunkIndex,
      loadedChunk: chunk,
      bounds: getRADSplatBounds(chunk.splats.positions),
      lastUsedMs: Date.now()
    };
    this.lastUploadTimeMs = Date.now() - startTimeMs;
    this.pages.set(chunk.chunkIndex, page);
    return page;
  }

  /** Return true when a source chunk has a resident page. */
  hasPage(chunkIndex: number): boolean {
    return this.pages.has(chunkIndex);
  }

  /** Return source page bounds by source chunk index. */
  getPageBounds(chunkIndex: number): RADSplatBounds | undefined {
    const page = this.pages.get(chunkIndex);
    if (page) {
      page.lastUsedMs = Date.now();
    }
    return page?.bounds;
  }

  /** Return resident decoded chunks keyed by source chunk index. */
  getLoadedChunkMap(): Map<number, RADSplatLoadedChunk> {
    const loadedChunks = new Map<number, RADSplatLoadedChunk>();
    for (const [chunkIndex, page] of this.pages) {
      loadedChunks.set(chunkIndex, page.loadedChunk);
    }
    return loadedChunks;
  }

  /** Return resident page count. */
  getPageCount(): number {
    return this.pages.size;
  }

  /** Return decoded splat count across all resident pages. */
  getResidentSplatCount(): number {
    let splatCount = 0;
    for (const page of this.pages.values()) {
      splatCount += page.loadedChunk.splats.splatCount;
    }
    return splatCount;
  }

  /** Evict least-recently-used pages outside the protected render set. */
  evict(
    maxCachedChunks: number,
    maxResidentSplats: number,
    protectedChunkIndices: Set<number>
  ): void {
    const maxPageCount = Math.max(Math.floor(maxCachedChunks), protectedChunkIndices.size, 1);
    const maxSplatCount = Math.max(Math.floor(maxResidentSplats), 1);
    if (this.pages.size <= maxPageCount && this.getResidentSplatCount() <= maxSplatCount) {
      return;
    }

    const evictablePages = Array.from(this.pages.values())
      .filter(page => !protectedChunkIndices.has(page.chunkIndex))
      .sort((left, right) => left.lastUsedMs - right.lastUsedMs);
    for (const page of evictablePages) {
      if (this.pages.size <= maxPageCount && this.getResidentSplatCount() <= maxSplatCount) {
        return;
      }
      this.pages.delete(page.chunkIndex);
      this.evictedChunkCount++;
    }
  }

  /** Release every resident page. */
  destroy(): void {
    this.pages.clear();
  }
}

/** Store of WebGPU render pages built from the current RAD frontier. */
class RADRenderPageStore {
  /** Current render pages exposed to deck.gl sublayers. */
  private activePages: RADPageSplatEngine[] = [];
  /** Reusable render pages keyed by source chunk index for tile and unsorted rendering. */
  private sourcePages = new Map<number, RADPageSplatEngine>();
  /** Compacted render pages used when a single globally sorted page is requested. */
  private compactedPages: RADPageSplatEngine[] = [];
  /** Signature for the current compacted frontier. */
  private compactedSignature = '';
  /** Signature for props baked into uploaded splat attributes. */
  private uploadSignature = '';

  /** Upload duration for the latest render frontier update. */
  lastUploadTimeMs: number | undefined;

  /** Update props on every resident render page engine. */
  setProps(props: Partial<SplatEngineProps>): void {
    for (const page of this.activePages) {
      page.setProps(props);
    }
  }

  /** Return current render pages. */
  getRenderPages(): RADRenderPage[] {
    return this.activePages.map(page => ({
      chunkIndex: page.chunkIndex,
      engine: page,
      bounds: page.bounds
    }));
  }

  /** Update render pages when the row frontier changes. */
  updateFrontier(
    device: Device,
    frontier: RADRenderFrontierChunk[],
    engineProps: Partial<SplatEngineProps>,
    fallbackColor: Color,
    gaussianSupportRadius: number
  ): void {
    const uploadSignature = getRADRenderUploadSignature(fallbackColor, gaussianSupportRadius);
    if (uploadSignature !== this.uploadSignature) {
      this.destroy();
      this.uploadSignature = uploadSignature;
    }

    if (engineProps.sortMode === 'global') {
      this.updateCompactedFrontier(
        device,
        frontier,
        engineProps,
        fallbackColor,
        gaussianSupportRadius
      );
      return;
    }

    this.updateSourceFrontier(device, frontier, engineProps, fallbackColor, gaussianSupportRadius);
  }

  /** Rebuild compacted render pages for globally sorted rendering. */
  private updateCompactedFrontier(
    device: Device,
    frontier: RADRenderFrontierChunk[],
    engineProps: Partial<SplatEngineProps>,
    fallbackColor: Color,
    gaussianSupportRadius: number
  ): void {
    this.destroySourcePages();
    const signature = getRADRenderFrontierSignature(frontier, fallbackColor, gaussianSupportRadius);
    if (signature === this.compactedSignature) {
      this.setProps(engineProps);
      this.activePages = this.compactedPages;
      return;
    }

    const startTimeMs = Date.now();
    this.destroyCompactedPages();
    const maxRenderPageSplatCount = getRADRenderPageSplatCount(frontier, engineProps.sortMode);
    const compactedChunks = createRADCompactedRenderChunks(frontier, maxRenderPageSplatCount);
    this.compactedPages = compactedChunks.map(
      (splats, pageIndex) =>
        new RADPageSplatEngine(
          device,
          {chunkIndex: pageIndex, splats},
          engineProps,
          fallbackColor,
          gaussianSupportRadius
        )
    );
    this.activePages = this.compactedPages;
    this.compactedSignature = signature;
    this.lastUploadTimeMs = Date.now() - startTimeMs;
  }

  /** Reuse source chunk pages while updating active rows for tile and unsorted rendering. */
  private updateSourceFrontier(
    device: Device,
    frontier: RADRenderFrontierChunk[],
    engineProps: Partial<SplatEngineProps>,
    fallbackColor: Color,
    gaussianSupportRadius: number
  ): void {
    const startTimeMs = Date.now();
    this.destroyCompactedPages();

    const activeChunkIndices = new Set<number>();
    const activePages: RADPageSplatEngine[] = [];
    for (const frontierChunk of frontier) {
      const chunkIndex = frontierChunk.chunk.chunkIndex;
      activeChunkIndices.add(chunkIndex);
      let page = this.sourcePages.get(chunkIndex);
      if (!page) {
        page = new RADPageSplatEngine(
          device,
          frontierChunk.chunk,
          engineProps,
          fallbackColor,
          gaussianSupportRadius
        );
        this.sourcePages.set(chunkIndex, page);
      } else {
        page.setProps(engineProps);
      }
      page.setActiveRows(frontierChunk.visibleRows, frontierChunk.rowWeights);
      page.touch();
      activePages.push(page);
    }

    for (const [chunkIndex, page] of this.sourcePages) {
      if (!activeChunkIndices.has(chunkIndex)) {
        page.destroy();
        this.sourcePages.delete(chunkIndex);
      }
    }
    this.activePages = activePages;
    this.lastUploadTimeMs = Date.now() - startTimeMs;
  }

  /** Release all render page engines. */
  destroy(): void {
    this.destroySourcePages();
    this.destroyCompactedPages();
    this.activePages = [];
    this.uploadSignature = '';
  }

  /** Release source chunk page engines. */
  private destroySourcePages(): void {
    for (const page of this.sourcePages.values()) {
      page.destroy();
    }
    this.sourcePages.clear();
  }

  /** Release compacted page engines. */
  private destroyCompactedPages(): void {
    for (const page of this.compactedPages) {
      page.destroy();
    }
    this.compactedPages = [];
    this.compactedSignature = '';
  }
}

/** Stable GPU page for one RAD source chunk or compacted render batch. */
class RADPageSplatEngine implements SplatRenderEngineLike {
  /** Render page index represented by this engine. */
  readonly chunkIndex: number;
  /** Decoded source chunk or compacted batch uploaded to this render page. */
  readonly loadedChunk: RADSplatLoadedChunk;
  /** Page bounds in source coordinates. */
  readonly bounds?: RADSplatBounds;
  /** Last time this page was selected or rendered. */
  lastUsedMs = Date.now();

  private splatEngine: SplatEngine;
  private activeRowsSignature = '';

  constructor(
    device: Device,
    loadedChunk: RADSplatLoadedChunk,
    engineProps: Partial<SplatEngineProps>,
    fallbackColor: Color,
    gaussianSupportRadius: number
  ) {
    this.chunkIndex = loadedChunk.chunkIndex;
    this.loadedChunk = loadedChunk;
    this.bounds = getRADSplatBounds(loadedChunk.splats.positions);
    this.splatEngine = new SplatEngine(device, engineProps);
    const splatData = getGaussianSplatDataFromValues(
      loadedChunk.splats,
      fallbackColor,
      gaussianSupportRadius
    );
    this.splatEngine.setSplatData(splatData);
  }

  /** Mark this page as recently used. */
  touch(): void {
    this.lastUsedMs = Date.now();
  }

  destroy(): void {
    this.splatEngine.destroy();
  }

  setProps(props: Partial<SplatEngineProps>): void {
    this.splatEngine.setProps(props);
  }

  /** Update the active row weights for this page without reuploading immutable splat attributes. */
  setActiveRows(rows?: Uint32Array, rowWeights?: Float32Array): void {
    const activeRowsSignature = rowWeights
      ? getRADActiveWeightsSignature(rowWeights)
      : getRADActiveRowsSignature(rows);
    if (activeRowsSignature === this.activeRowsSignature) {
      return;
    }
    this.activeRowsSignature = activeRowsSignature;
    if (rowWeights) {
      this.splatEngine.setActiveWeights(rowWeights);
    } else {
      this.splatEngine.setActiveIndices(rows);
    }
  }

  update(props: SplatEngineUpdateProps = {}): void {
    this.touch();
    this.splatEngine.update(props);
  }

  getRenderBindings(): SplatRenderBindings {
    return this.splatEngine.getRenderBindings();
  }

  getWebGLAttributes(): SplatWebGLAttributes {
    return this.splatEngine.getWebGLAttributes();
  }

  getSplatCount(): number {
    return this.splatEngine.getSplatCount();
  }

  getRenderSplatCount(): number {
    return this.splatEngine.getRenderSplatCount();
  }
}

/** Primitive Gaussian billboard layer used by {@link SplatLayer}. */
class SplatPrimitiveLayer extends Layer<Required<SplatPrimitiveLayerProps>> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'SplatPrimitiveLayer';

  /** Default props shared across primitive splat layers. */
  static defaultProps: DefaultProps = {
    sizeUnits: 'meters',
    radiusScale: {type: 'number', min: 0, value: 1},
    radiusMinPixels: {type: 'number', min: 0, value: 0},
    radiusMaxPixels: {type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER},
    alphaScale: {type: 'number', min: 0, value: 1},
    alphaCutoff: {type: 'number', min: 0, max: 1, value: 1 / 255},
    screenSizeCutoffPixels: {type: 'number', min: 0, value: 0},
    gaussianSupportRadius: {type: 'number', min: 0, value: 3},
    kernel2DSize: {type: 'number', min: 0, value: 0.3},
    maxScreenSpaceSplatSize: {type: 'number', min: 1, value: 1024},
    splatEngine: null
  };

  state: {
    model?: Model;
  } = {};

  /** Returns splat shaders. */
  getShaders() {
    if (this.context.device.type === 'webgpu') {
      return super.getShaders({
        source,
        modules: [project32, splatUniforms]
      });
    }

    return super.getShaders({
      vs,
      fs,
      modules: [project32, color, picking, splatUniforms]
    });
  }

  /** Registers binary attributes consumed by the primitive shader. */
  initializeState(): void {
    if (this.context.device.type === 'webgpu') {
      return;
    }

    this.getAttributeManager()!.addInstanced({
      instancePositions: {
        size: 3,
        type: 'float64',
        fp64: this.use64bitPositions(),
        accessor: 'getPosition'
      },
      instanceRadii: {
        size: 1,
        accessor: 'getRadius',
        defaultValue: 1
      },
      instanceColors: {
        size: this.props.colorFormat.length,
        type: 'unorm8',
        accessor: 'getColor',
        defaultValue: DEFAULT_COLOR
      }
    });
  }

  /** Rebuilds the luma model when deck.gl shader extensions change. */
  updateState(params: UpdateParameters<this>): void {
    super.updateState(params);

    if (!this.state.model || params.changeFlags.extensionsChanged) {
      this.state.model?.destroy();
      this.state.model = this._getModel();
      this.getAttributeManager()!.invalidateAll();
    }
  }

  /** Draws all splat billboards. */
  draw(options: DrawOptions = {}): void {
    if (this.context.device.type === 'webgpu' && options.shaderModuleProps?.picking?.isActive) {
      return;
    }

    const {
      sizeUnits,
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      alphaScale,
      alphaCutoff,
      screenSizeCutoffPixels,
      gaussianSupportRadius
    } = this.props;
    const splatProps: SplatUniformProps = {
      sizeUnits: UNIT[sizeUnits],
      radiusScale,
      radiusMinPixels,
      radiusMaxPixels,
      alphaScale,
      alphaCutoff,
      screenSizeCutoffPixels,
      gaussianSupportRadius
    };
    const model = this.state.model;
    if (!model) {
      return;
    }
    this.props.splatEngine?.update(
      getSplatEngineUpdateProps(
        this.context.viewport,
        this.props.radiusScale,
        this.props.modelMatrix
      )
    );
    if (this.context.device.type === 'webgpu') {
      const splatEngine = this.props.splatEngine;
      if (!splatEngine) {
        return;
      }
      model.setBindings(splatEngine.getRenderBindings());
      model.setInstanceCount(splatEngine.getRenderSplatCount());
      model.setVertexCount(4);
    }
    model.shaderInputs.setProps({splat: splatProps});
    model.draw(this.context.renderPass);
  }

  /** Applies attribute buffers while preserving the explicit WebGPU buffer layout. */
  protected _setModelAttributes(
    model: Model,
    changedAttributes: {[id: string]: Attribute},
    bufferLayoutChanged = false
  ): void {
    super._setModelAttributes(
      model,
      changedAttributes,
      this.context.device.type === 'webgpu' ? false : bufferLayoutChanged
    );
  }

  /** Builds the instanced billboard model. */
  protected _getModel(): Model {
    const bufferLayout =
      this.context.device.type === 'webgpu'
        ? WEBGPU_SPLAT_BUFFER_LAYOUT
        : this.getAttributeManager()!.getBufferLayouts();

    return new Model(this.context.device, {
      ...this.getShaders(),
      id: this.props.id,
      bufferLayout,
      geometry:
        this.context.device.type === 'webgpu'
          ? null
          : new Geometry({
              topology: 'triangle-strip',
              attributes: {
                positions: {
                  size: 3,
                  value: new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0])
                }
              }
            }),
      topology: 'triangle-strip',
      vertexCount: 4,
      instanceCount: this.props.splatEngine?.getRenderSplatCount() ?? 0,
      isInstanced: true
    });
  }
}

/** Build a runtime scheduler signature that may trigger reselection without clearing resident pages. */
function getRADRuntimeSelectionSignature(options: RADRuntimeUpdateOptions): string {
  return [
    options.startChunkIndex,
    options.maxChunks,
    options.maxSplats,
    options.maxResidentSplats,
    options.maxConcurrentChunkRequests,
    options.pruneLoadedLoDParents,
    options.lodSplatScale,
    options.lodRenderScale,
    options.coneFov0,
    options.coneFov,
    options.behindFoveate,
    options.coneFoveate,
    options.maxCachedChunks,
    options.radiusScale,
    options.gaussianSupportRadius,
    options.reselectOnViewChange ? getRADViewportLoadSignature(options.viewport) : 'static'
  ].join('|');
}

/** Select RAD chunk indices from a contiguous LoD window. */
function getRADSplatChunkIndices(
  metadata: RADSplatMetadataLike,
  startChunkIndex: number,
  maxChunks: number,
  maxSplats: number
): number[] {
  const chunkIndices: number[] = [];
  let estimatedSplatCount = 0;
  for (
    let chunkIndex = Math.max(Math.floor(startChunkIndex), 0);
    chunkIndex < metadata.chunks.length &&
    chunkIndices.length < maxChunks &&
    estimatedSplatCount < maxSplats;
    chunkIndex++
  ) {
    const chunk = metadata.chunks[chunkIndex];
    chunkIndices.push(chunkIndex);
    estimatedSplatCount += chunk?.count ?? metadata.chunkSize ?? 0;
  }
  return chunkIndices;
}

/** Return the next LoD traversal chunk batch without materially exceeding the splat budget. */
function getRADNextChunkIndices(
  frontier: number[],
  metadata: RADSplatMetadataLike,
  loadedByChunkIndex: Map<number, RADSplatLoadedChunk>,
  queuedChunkIndices: Set<number>,
  maxChunkCount: number,
  remainingSplatCount: number
): number[] {
  const chunkIndices: number[] = [];
  let estimatedSplatCount = 0;

  for (const chunkIndex of frontier) {
    if (
      chunkIndex < 0 ||
      chunkIndex >= metadata.chunks.length ||
      loadedByChunkIndex.has(chunkIndex) ||
      queuedChunkIndices.has(chunkIndex)
    ) {
      continue;
    }

    const chunkSplatCount = getRADEstimatedChunkSplatCount(metadata, chunkIndex);
    if (chunkIndices.length > 0 && estimatedSplatCount + chunkSplatCount > remainingSplatCount) {
      continue;
    }
    chunkIndices.push(chunkIndex);
    estimatedSplatCount += chunkSplatCount;
    if (chunkIndices.length >= maxChunkCount || estimatedSplatCount >= remainingSplatCount) {
      break;
    }
  }

  return chunkIndices;
}

/** Return a metadata-estimated decoded splat count for one RAD chunk. */
function getRADEstimatedChunkSplatCount(
  metadata: RADSplatMetadataLike,
  chunkIndex: number
): number {
  return metadata.chunks[chunkIndex]?.count ?? metadata.chunkSize ?? 0;
}

/** Fetch and decode one RAD chunk with bounded transient retry tolerance. */
async function loadRADSplatChunkWithRetries(
  source: RADSplatSourceLike,
  chunkIndex: number
): Promise<RADSplatLoadedChunk> {
  let lastError: unknown;
  for (let attemptIndex = 0; attemptIndex <= DEFAULT_RAD_SPLAT_CHUNK_RETRY_COUNT; attemptIndex++) {
    const abortController =
      typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const timeout =
      abortController &&
      setTimeout(() => abortController.abort(), DEFAULT_RAD_SPLAT_CHUNK_TIMEOUT_MS);
    try {
      const splats = await source.getChunkSplats(chunkIndex, {
        signal: abortController?.signal,
        radChunk: {
          includeLoDTree: true,
          includeSphericalHarmonics: true
        }
      });
      return {chunkIndex, splats};
    } catch (error) {
      lastError = error;
      if (attemptIndex >= DEFAULT_RAD_SPLAT_CHUNK_RETRY_COUNT) {
        break;
      }
      await waitRADChunkRetryDelay(DEFAULT_RAD_SPLAT_CHUNK_RETRY_DELAY_MS * (attemptIndex + 1));
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`RADSplatLayer failed to load RAD chunk ${chunkIndex}: ${message}`);
}

/** Wait before retrying a failed RAD chunk request. */
function waitRADChunkRetryDelay(delayMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

/** Return a positive integer RAD chunk request concurrency limit. */
function getRADMaxConcurrentChunkRequests(maxConcurrentChunkRequests: number): number {
  return Number.isFinite(maxConcurrentChunkRequests) && maxConcurrentChunkRequests > 0
    ? Math.floor(maxConcurrentChunkRequests)
    : DEFAULT_RAD_SPLAT_MAX_CONCURRENT_CHUNK_REQUESTS;
}

/** Return immediate and speculative RAD chunk requests in priority order. */
function getRADChunkRequestIndices(
  immediateChunkIndices: number[],
  selectedChunks: RADSplatLoadedChunk[],
  requestOptions: RADChunkRequestPlanOptions
): number[] {
  const requestChunkIndices: number[] = [];
  const requestedChunkIndices = new Set<number>();
  const maxRequestChunkCount = Math.max(Math.floor(requestOptions.maxRequestChunkCount), 1);

  const addRequestChunkIndex = (chunkIndex: number): void => {
    if (
      requestChunkIndices.length >= maxRequestChunkCount ||
      requestedChunkIndices.has(chunkIndex) ||
      requestOptions.loadedByChunkIndex.has(chunkIndex) ||
      requestOptions.unavailableChunkIndices.has(chunkIndex)
    ) {
      return;
    }
    requestedChunkIndices.add(chunkIndex);
    requestChunkIndices.push(chunkIndex);
  };

  for (const chunkIndex of immediateChunkIndices) {
    addRequestChunkIndex(chunkIndex);
  }

  if (requestChunkIndices.length >= maxRequestChunkCount || selectedChunks.length === 0) {
    return requestChunkIndices;
  }

  const prefetchChunkIndices = getRADCameraPrioritizedChildChunkIndices(
    selectedChunks,
    requestOptions.loadedByChunkIndex,
    requestOptions.metadata,
    requestOptions.options
  );
  for (const chunkIndex of prefetchChunkIndices) {
    addRequestChunkIndex(chunkIndex);
    if (requestChunkIndices.length >= maxRequestChunkCount) {
      break;
    }
  }

  return requestChunkIndices;
}

/** Return child chunks ordered by current camera importance. */
function getRADCameraPrioritizedChildChunkIndices(
  loadedChunks: RADSplatLoadedChunk[],
  loadedByChunkIndex: Map<number, RADSplatLoadedChunk>,
  metadata: RADSplatMetadataLike,
  options: RADSplatChunkSelectionOptions
): number[] {
  const childChunkGroups: RADChildChunkGroup[] = [];
  const modelViewProjectionMatrix = getModelViewProjectionMatrix(
    options.viewport,
    options.modelMatrix
  );
  const viewportSize = getRADViewportSize(options.viewport);
  const chunkRangeLookup = getRADSplatChunkRangeLookup(metadata);
  const loadedSplatCount = loadedChunks.reduce(
    (total, loadedChunk) => total + loadedChunk.splats.splatCount,
    0
  );
  const rowStride = Math.max(Math.ceil(loadedSplatCount / DEFAULT_RAD_PRIORITY_MAX_SCORED_ROWS), 1);

  for (const loadedChunk of loadedChunks) {
    const childCounts = loadedChunk.splats.loaderData?.childCounts;
    const childStarts = loadedChunk.splats.loaderData?.childStarts;
    if (!(childCounts instanceof Uint16Array) || !(childStarts instanceof Uint32Array)) {
      continue;
    }

    for (let rowIndex = 0; rowIndex < loadedChunk.splats.splatCount; rowIndex += rowStride) {
      const childCount = childCounts[rowIndex];
      if (childCount <= 0) {
        continue;
      }
      const childStart = childStarts[rowIndex];
      const childChunkIndices = getRADSplatChunkIndicesForGlobalRange(
        chunkRangeLookup,
        childStart,
        childCount
      ).filter(childChunkIndex => !loadedByChunkIndex.has(childChunkIndex));
      if (!childChunkIndices.length) {
        continue;
      }

      let score = modelViewProjectionMatrix
        ? getRADProjectedSplatScore(
            loadedChunk.splats,
            rowIndex,
            modelViewProjectionMatrix,
            viewportSize,
            options.radiusScale,
            options.gaussianSupportRadius,
            childCount,
            options.lodSplatScale,
            options.lodRenderScale,
            options.coneFov0,
            options.coneFov,
            options.behindFoveate,
            options.coneFoveate
          )
        : childCount;
      score = score > 0 ? score : childCount;
      childChunkGroups.push({score, chunkIndices: childChunkIndices});
    }
  }

  const orderedChunkIndices: number[] = [];
  const queuedChunkIndices = new Set<number>();
  childChunkGroups.sort(
    (leftGroup, rightGroup) =>
      rightGroup.score - leftGroup.score || leftGroup.chunkIndices[0] - rightGroup.chunkIndices[0]
  );
  for (const childChunkGroup of childChunkGroups) {
    for (const childChunkIndex of childChunkGroup.chunkIndices) {
      if (queuedChunkIndices.has(childChunkIndex)) {
        continue;
      }
      queuedChunkIndices.add(childChunkIndex);
      orderedChunkIndices.push(childChunkIndex);
    }
  }
  return orderedChunkIndices;
}

/** Return source chunk indices overlapping a global splat range. */
function getRADSplatChunkIndicesForGlobalRange(
  chunkRangeLookup: RADSplatChunkRangeLookup,
  start: number,
  count: number
): number[] {
  const end = start + count;
  const chunkIndices: number[] = [];
  let low = 0;
  let high = chunkRangeLookup.ends.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (chunkRangeLookup.ends[middle] <= start) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  for (let chunkIndex = low; chunkIndex < chunkRangeLookup.starts.length; chunkIndex++) {
    if (chunkRangeLookup.starts[chunkIndex] >= end) {
      break;
    }
    chunkIndices.push(chunkIndex);
  }

  return chunkIndices;
}

/** Build global splat start/end lookup tables for RAD chunk metadata. */
function getRADSplatChunkRangeLookup(metadata: RADSplatMetadataLike): RADSplatChunkRangeLookup {
  const starts = new Array<number>(metadata.chunks.length);
  const ends = new Array<number>(metadata.chunks.length);
  let previousChunkEnd = 0;

  for (let chunkIndex = 0; chunkIndex < metadata.chunks.length; chunkIndex++) {
    const chunk = metadata.chunks[chunkIndex];
    const chunkStart = chunk.base ?? previousChunkEnd;
    const chunkEnd = chunkStart + (chunk.count ?? metadata.chunkSize ?? 0);
    starts[chunkIndex] = chunkStart;
    ends[chunkIndex] = chunkEnd;
    previousChunkEnd = chunkEnd;
  }

  return {starts, ends};
}

/** Select a Spark-style row frontier from already resident RAD LoD chunks. */
function getRADLoadedRenderFrontier(
  loadedByChunkIndex: Map<number, RADSplatLoadedChunk>,
  metadata: RADSplatMetadataLike,
  firstChunkIndex: number,
  pendingChunkIndices: Set<number>,
  options: RADSplatChunkSelectionOptions
): RADLoadedRenderFrontierPlan | null {
  const modelViewProjectionMatrix = getModelViewProjectionMatrix(
    options.viewport,
    options.modelMatrix
  );
  if (!modelViewProjectionMatrix) {
    return null;
  }

  const chunkRangeLookup = getRADSplatChunkRangeLookup(metadata);
  const rootGlobalSplatIndex = chunkRangeLookup.starts[firstChunkIndex] ?? 0;
  const rootChunkIndex = getRADSplatChunkIndexForGlobalIndex(
    chunkRangeLookup,
    rootGlobalSplatIndex
  );
  if (rootChunkIndex < 0) {
    return null;
  }

  const rootChunk = loadedByChunkIndex.get(rootChunkIndex);
  if (!rootChunk) {
    return {
      frontierChunks: [],
      missingChunkIndices: pendingChunkIndices.has(rootChunkIndex) ? [] : [rootChunkIndex]
    };
  }
  if (!getRADLoDTreeArrays(rootChunk.splats)) {
    return null;
  }

  const viewportSize = getRADViewportSize(options.viewport);
  const rootCandidate = getRADFrontierCandidate(
    loadedByChunkIndex,
    chunkRangeLookup,
    rootGlobalSplatIndex,
    modelViewProjectionMatrix,
    viewportSize,
    options
  );
  if (!rootCandidate) {
    return null;
  }

  const candidateHeap: RADFrontierCandidate[] = [rootCandidate];
  const rowWeightsByChunkIndex = new Map<number, Map<number, number>>();
  const missingChunkIndexSet = new Set<number>();
  let outputRowCount = 0;
  const maxSplatCount = Math.max(Math.floor(options.maxSplats), 1);

  while (candidateHeap.length > 0) {
    const candidate = popRADFrontierCandidate(candidateHeap);
    if (!candidate) {
      break;
    }

    const canRefine =
      candidate.childCount > 0 && candidate.pixelScale >= DEFAULT_RAD_LOD_MIN_PROJECTED_PIXELS;

    if (canRefine) {
      const childFrontier = getRADLoadedChildFrontierCandidates(
        candidate,
        loadedByChunkIndex,
        chunkRangeLookup,
        pendingChunkIndices,
        missingChunkIndexSet,
        modelViewProjectionMatrix,
        viewportSize,
        options
      );

      const replacementRowCount = childFrontier.childCandidates.length;
      if (
        !childFrontier.hasMissingChildren &&
        childFrontier.childCandidates.length > 0 &&
        outputRowCount + candidateHeap.length + replacementRowCount <= maxSplatCount
      ) {
        for (const childCandidate of childFrontier.childCandidates) {
          pushRADFrontierCandidate(candidateHeap, childCandidate);
        }
        continue;
      }
    }

    addRADFrontierRow(rowWeightsByChunkIndex, candidate);
    outputRowCount++;
  }

  return {
    frontierChunks: createRADRenderFrontierChunks(loadedByChunkIndex, rowWeightsByChunkIndex),
    missingChunkIndices: Array.from(missingChunkIndexSet)
  };
}

/** Return the direct child node candidates currently loaded for one frontier parent. */
function getRADLoadedChildFrontierCandidates(
  candidate: RADFrontierCandidate,
  loadedByChunkIndex: Map<number, RADSplatLoadedChunk>,
  chunkRangeLookup: RADSplatChunkRangeLookup,
  pendingChunkIndices: Set<number>,
  missingChunkIndexSet: Set<number>,
  modelViewProjectionMatrix: readonly number[],
  viewportSize: readonly [number, number],
  options: RADSplatChunkSelectionOptions
): RADChildFrontierCandidates {
  const childEnd = candidate.childStart + candidate.childCount;
  const childCandidates: RADFrontierCandidate[] = [];
  let loadedChildCount = 0;
  let hasMissingChildren = false;

  for (
    let childGlobalSplatIndex = candidate.childStart;
    childGlobalSplatIndex < childEnd;
    childGlobalSplatIndex++
  ) {
    const childCandidate = getRADFrontierCandidate(
      loadedByChunkIndex,
      chunkRangeLookup,
      childGlobalSplatIndex,
      modelViewProjectionMatrix,
      viewportSize,
      options
    );
    if (!childCandidate) {
      const childChunkIndex = getRADSplatChunkIndexForGlobalIndex(
        chunkRangeLookup,
        childGlobalSplatIndex
      );
      if (childChunkIndex >= 0 && !pendingChunkIndices.has(childChunkIndex)) {
        missingChunkIndexSet.add(childChunkIndex);
      }
      hasMissingChildren = true;
      continue;
    }
    loadedChildCount++;
    childCandidates.push(childCandidate);
  }

  return {
    childCandidates,
    childCoverage: candidate.childCount > 0 ? loadedChildCount / candidate.childCount : 1,
    hasMissingChildren
  };
}

/** Return one resident RAD LoD node candidate by global splat index. */
function getRADFrontierCandidate(
  loadedByChunkIndex: Map<number, RADSplatLoadedChunk>,
  chunkRangeLookup: RADSplatChunkRangeLookup,
  globalSplatIndex: number,
  modelViewProjectionMatrix: readonly number[],
  viewportSize: readonly [number, number],
  options: RADSplatChunkSelectionOptions
): RADFrontierCandidate | null {
  const chunkIndex = getRADSplatChunkIndexForGlobalIndex(chunkRangeLookup, globalSplatIndex);
  const chunk = loadedByChunkIndex.get(chunkIndex);
  if (!chunk) {
    return null;
  }

  const rowIndex = globalSplatIndex - getRADSplatBase(chunk.splats);
  const lodTree = getRADLoDTreeArrays(chunk.splats);
  if (!lodTree || rowIndex < 0 || rowIndex >= chunk.splats.splatCount) {
    return null;
  }
  const childCount = lodTree.childCounts[rowIndex];
  const pixelScale = getRADProjectedSplatPixelScale(
    chunk.splats,
    rowIndex,
    modelViewProjectionMatrix,
    viewportSize,
    options.radiusScale,
    options.gaussianSupportRadius,
    options.lodSplatScale,
    options.lodRenderScale,
    options.coneFov0,
    options.coneFov,
    options.behindFoveate,
    options.coneFoveate
  );

  return {
    chunk,
    rowIndex,
    globalSplatIndex,
    childStart: lodTree.childStarts[rowIndex],
    childCount,
    pixelScale,
    score: pixelScale * Math.max(Math.sqrt(childCount), 1)
  };
}

/** Return typed LoD child arrays when a decoded RAD chunk contains tree metadata. */
function getRADLoDTreeArrays(
  splats: RADSplatChunkValues
): {childCounts: Uint16Array; childStarts: Uint32Array} | null {
  const childCounts = splats.loaderData?.childCounts;
  const childStarts = splats.loaderData?.childStarts;
  return childCounts instanceof Uint16Array && childStarts instanceof Uint32Array
    ? {childCounts, childStarts}
    : null;
}

/** Return the source chunk index that owns a global RAD splat index. */
function getRADSplatChunkIndexForGlobalIndex(
  chunkRangeLookup: RADSplatChunkRangeLookup,
  globalSplatIndex: number
): number {
  let low = 0;
  let high = chunkRangeLookup.ends.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (chunkRangeLookup.ends[middle] <= globalSplatIndex) {
      low = middle + 1;
    } else {
      high = middle;
    }
  }

  return low < chunkRangeLookup.starts.length &&
    chunkRangeLookup.starts[low] <= globalSplatIndex &&
    globalSplatIndex < chunkRangeLookup.ends[low]
    ? low
    : -1;
}

/** Add a candidate to the max heap ordered by projected LoD score. */
function pushRADFrontierCandidate(
  heap: RADFrontierCandidate[],
  candidate: RADFrontierCandidate
): void {
  heap.push(candidate);
  let index = heap.length - 1;
  while (index > 0) {
    const parentIndex = Math.floor((index - 1) / 2);
    if (compareRADFrontierCandidates(heap[parentIndex], candidate) >= 0) {
      break;
    }
    heap[index] = heap[parentIndex];
    index = parentIndex;
  }
  heap[index] = candidate;
}

/** Remove the highest-priority candidate from a max heap. */
function popRADFrontierCandidate(heap: RADFrontierCandidate[]): RADFrontierCandidate | undefined {
  const result = heap[0];
  const tail = heap.pop();
  if (!tail || heap.length === 0) {
    return result;
  }

  let index = 0;
  while (true) {
    const leftChildIndex = index * 2 + 1;
    const rightChildIndex = leftChildIndex + 1;
    if (leftChildIndex >= heap.length) {
      break;
    }

    const bestChildIndex =
      rightChildIndex < heap.length &&
      compareRADFrontierCandidates(heap[rightChildIndex], heap[leftChildIndex]) > 0
        ? rightChildIndex
        : leftChildIndex;
    if (compareRADFrontierCandidates(heap[bestChildIndex], tail) <= 0) {
      break;
    }
    heap[index] = heap[bestChildIndex];
    index = bestChildIndex;
  }
  heap[index] = tail;
  return result;
}

/** Compare LoD candidates by score with stable global-index tie breaking. */
function compareRADFrontierCandidates(
  left: RADFrontierCandidate,
  right: RADFrontierCandidate
): number {
  return right.score === left.score
    ? right.globalSplatIndex - left.globalSplatIndex
    : left.score - right.score;
}

/** Add a selected LoD node row to the owning chunk group. */
function addRADFrontierRow(
  rowWeightsByChunkIndex: Map<number, Map<number, number>>,
  candidate: RADFrontierCandidate,
  weight = 1
): void {
  const chunkRows = rowWeightsByChunkIndex.get(candidate.chunk.chunkIndex) || new Map();
  chunkRows.set(candidate.rowIndex, Math.max(chunkRows.get(candidate.rowIndex) ?? 0, weight));
  rowWeightsByChunkIndex.set(candidate.chunk.chunkIndex, chunkRows);
}

/** Convert grouped local rows into render frontier chunks. */
function createRADRenderFrontierChunks(
  loadedByChunkIndex: Map<number, RADSplatLoadedChunk>,
  rowWeightsByChunkIndex: Map<number, Map<number, number>>
): RADRenderFrontierChunk[] {
  return Array.from(rowWeightsByChunkIndex.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([chunkIndex, rowWeightsByIndex]) => {
      const chunk = loadedByChunkIndex.get(chunkIndex);
      if (!chunk) {
        return null;
      }
      const rows = Array.from(rowWeightsByIndex.keys()).sort((left, right) => left - right);
      const rowWeights = new Float32Array(chunk.splats.splatCount);
      let hasPartialWeights = false;
      for (const rowIndex of rows) {
        const rowWeight = rowWeightsByIndex.get(rowIndex) ?? 0;
        rowWeights[rowIndex] = rowWeight;
        hasPartialWeights ||= rowWeight < 1;
      }
      const visibleRows =
        rows.length === chunk.splats.splatCount ? undefined : Uint32Array.from(rows);
      return {
        chunk,
        visibleSplatCount: rows.length,
        visibleRows,
        rowWeights: hasPartialWeights ? rowWeights : undefined
      };
    })
    .filter(Boolean) as RADRenderFrontierChunk[];
}

/** Return a stable signature for a compacted RAD render frontier. */
function getRADRenderFrontierSignature(
  frontier: RADRenderFrontierChunk[],
  fallbackColor: Color,
  gaussianSupportRadius: number
): string {
  const frontierSignature = frontier
    .map(
      entry =>
        `${entry.chunk.chunkIndex}:${entry.visibleSplatCount}:` +
        `${getRADActiveRowsSignature(entry.visibleRows)}:` +
        `${entry.rowWeights ? getRADActiveWeightsSignature(entry.rowWeights) : 'weights-all'}`
    )
    .join('|');
  return [
    frontierSignature,
    getRADRenderUploadSignature(fallbackColor, gaussianSupportRadius)
  ].join('|');
}

/** Return a signature for splat props baked into uploaded render page attributes. */
function getRADRenderUploadSignature(fallbackColor: Color, gaussianSupportRadius: number): string {
  return [
    `fallback:${Array.from(fallbackColor).join(',')}`,
    `support:${gaussianSupportRadius}`
  ].join('|');
}

/** Return a render page size that preserves global per-splat sorting when requested. */
function getRADRenderPageSplatCount(
  frontier: RADRenderFrontierChunk[],
  sortMode?: SplatSortMode
): number {
  const visibleSplatCount = frontier.reduce(
    (total, entry) => total + Math.max(Math.floor(entry.visibleSplatCount), 0),
    0
  );
  return sortMode === 'global'
    ? Math.max(visibleSplatCount, 1)
    : DEFAULT_RAD_RENDER_PAGE_MAX_SPLATS;
}

/** Build compact render chunks containing only selected frontier rows. */
function createRADCompactedRenderChunks(
  frontier: RADRenderFrontierChunk[],
  maxPageSplatCount: number
): RADSplatChunkValues[] {
  const compactedChunks: RADSplatChunkValues[] = [];
  const pageSplatCount = Math.max(Math.floor(maxPageSplatCount), 1);
  const segments: RADRenderRowSegment[] = [];
  let currentPageSplatCount = 0;

  const flushSegments = () => {
    if (segments.length > 0 && currentPageSplatCount > 0) {
      compactedChunks.push(createRADCompactedRenderChunk(segments, currentPageSplatCount));
      segments.length = 0;
      currentPageSplatCount = 0;
    }
  };

  for (const frontierChunk of frontier) {
    let consumedRows = 0;
    const visibleSplatCount = Math.max(Math.floor(frontierChunk.visibleSplatCount), 0);
    while (consumedRows < visibleSplatCount) {
      if (currentPageSplatCount >= pageSplatCount) {
        flushSegments();
      }
      const remainingPageRows = pageSplatCount - currentPageSplatCount;
      const rowCount = Math.min(visibleSplatCount - consumedRows, remainingPageRows);
      segments.push({frontierChunk, rowOffset: consumedRows, rowCount});
      currentPageSplatCount += rowCount;
      consumedRows += rowCount;
    }
  }
  flushSegments();

  return compactedChunks;
}

/** Build one compact render chunk from selected row segments. */
function createRADCompactedRenderChunk(
  segments: RADRenderRowSegment[],
  splatCount: number
): RADSplatChunkValues {
  const sphericalHarmonicsComponentCount =
    getRADCompactedSphericalHarmonicsComponentCount(segments);
  const hasSphericalHarmonicDcs = segments.every(segment =>
    Boolean(segment.frontierChunk.chunk.splats.sphericalHarmonicDcs)
  );
  const positions = new Float32Array(splatCount * 3);
  const scales = new Float32Array(splatCount * 3);
  const rotations = new Float32Array(splatCount * 4);
  const colors = new Uint8Array(splatCount * 3);
  const sphericalHarmonicDcs = hasSphericalHarmonicDcs
    ? new Float32Array(splatCount * 3)
    : undefined;
  const opacities = new Float32Array(splatCount);
  const sphericalHarmonics = sphericalHarmonicsComponentCount
    ? new Float32Array(splatCount * sphericalHarmonicsComponentCount)
    : undefined;
  let outputRowIndex = 0;

  for (const segment of segments) {
    const splats = segment.frontierChunk.chunk.splats;
    const rows = segment.frontierChunk.visibleRows;
    const rowWeights = segment.frontierChunk.rowWeights;
    for (let segmentRowIndex = 0; segmentRowIndex < segment.rowCount; segmentRowIndex++) {
      const inputRowIndex = rows
        ? rows[segment.rowOffset + segmentRowIndex]
        : segment.rowOffset + segmentRowIndex;
      const outputPositionOffset = outputRowIndex * 3;
      const inputPositionOffset = inputRowIndex * 3;
      positions[outputPositionOffset] = splats.positions[inputPositionOffset];
      positions[outputPositionOffset + 1] = splats.positions[inputPositionOffset + 1];
      positions[outputPositionOffset + 2] = splats.positions[inputPositionOffset + 2];
      scales[outputPositionOffset] = splats.scales[inputPositionOffset];
      scales[outputPositionOffset + 1] = splats.scales[inputPositionOffset + 1];
      scales[outputPositionOffset + 2] = splats.scales[inputPositionOffset + 2];
      colors[outputPositionOffset] = splats.colors[inputPositionOffset];
      colors[outputPositionOffset + 1] = splats.colors[inputPositionOffset + 1];
      colors[outputPositionOffset + 2] = splats.colors[inputPositionOffset + 2];
      if (sphericalHarmonicDcs && splats.sphericalHarmonicDcs) {
        sphericalHarmonicDcs[outputPositionOffset] =
          splats.sphericalHarmonicDcs[inputPositionOffset];
        sphericalHarmonicDcs[outputPositionOffset + 1] =
          splats.sphericalHarmonicDcs[inputPositionOffset + 1];
        sphericalHarmonicDcs[outputPositionOffset + 2] =
          splats.sphericalHarmonicDcs[inputPositionOffset + 2];
      }

      const outputRotationOffset = outputRowIndex * 4;
      const inputRotationOffset = inputRowIndex * 4;
      rotations[outputRotationOffset] = splats.rotations[inputRotationOffset];
      rotations[outputRotationOffset + 1] = splats.rotations[inputRotationOffset + 1];
      rotations[outputRotationOffset + 2] = splats.rotations[inputRotationOffset + 2];
      rotations[outputRotationOffset + 3] = splats.rotations[inputRotationOffset + 3];

      const rowWeight = rowWeights ? rowWeights[inputRowIndex] : 1;
      opacities[outputRowIndex] = splats.opacities[inputRowIndex] * (rowWeight || 0);

      if (sphericalHarmonics && splats.sphericalHarmonics) {
        const outputSphericalHarmonicOffset = outputRowIndex * sphericalHarmonicsComponentCount;
        const inputSphericalHarmonicOffset = inputRowIndex * sphericalHarmonicsComponentCount;
        for (
          let componentIndex = 0;
          componentIndex < sphericalHarmonicsComponentCount;
          componentIndex++
        ) {
          sphericalHarmonics[outputSphericalHarmonicOffset + componentIndex] =
            splats.sphericalHarmonics[inputSphericalHarmonicOffset + componentIndex];
        }
      }

      outputRowIndex++;
    }
  }

  return {
    splatCount,
    positions,
    scales,
    rotations,
    colors,
    sphericalHarmonicDcs,
    opacities,
    sphericalHarmonics,
    sphericalHarmonicsComponentCount: sphericalHarmonicsComponentCount || undefined,
    loaderData: {count: splatCount}
  };
}

/** Return the shared SH rest component count when all compacted segments provide it. */
function getRADCompactedSphericalHarmonicsComponentCount(segments: RADRenderRowSegment[]): number {
  const firstCount = segments[0]?.frontierChunk.chunk.splats.sphericalHarmonicsComponentCount ?? 0;
  if (!firstCount) {
    return 0;
  }
  return segments.every(segment => {
    const splats = segment.frontierChunk.chunk.splats;
    return splats.sphericalHarmonics && splats.sphericalHarmonicsComponentCount === firstCount;
  })
    ? firstCount
    : 0;
}

/** Score one loaded parent row by projected radius and viewport centrality. */
function getRADProjectedSplatScore(
  splats: RADSplatChunkValues,
  rowIndex: number,
  modelViewProjectionMatrix: readonly number[],
  viewportSize: readonly [number, number],
  radiusScale: number,
  gaussianSupportRadius: number,
  childCount: number,
  lodSplatScale: number,
  lodRenderScale: number,
  coneFov0: number,
  coneFov: number,
  behindFoveate: number,
  coneFoveate: number
): number {
  const pixelScale = getRADProjectedSplatPixelScale(
    splats,
    rowIndex,
    modelViewProjectionMatrix,
    viewportSize,
    radiusScale,
    gaussianSupportRadius,
    lodSplatScale,
    lodRenderScale,
    coneFov0,
    coneFov,
    behindFoveate,
    coneFoveate
  );
  const childPopulationPriority = Math.max(Math.sqrt(childCount), 1);
  return pixelScale * childPopulationPriority;
}

/** Return one LoD node's projected screen-space scale after foveation weighting. */
function getRADProjectedSplatPixelScale(
  splats: RADSplatChunkValues,
  rowIndex: number,
  modelViewProjectionMatrix: readonly number[],
  viewportSize: readonly [number, number],
  radiusScale: number,
  gaussianSupportRadius: number,
  lodSplatScale: number,
  lodRenderScale: number,
  coneFov0: number,
  coneFov: number,
  behindFoveate: number,
  coneFoveate: number
): number {
  const positionOffset = rowIndex * 3;
  const position: [number, number, number] = [
    splats.positions[positionOffset],
    splats.positions[positionOffset + 1],
    splats.positions[positionOffset + 2]
  ];
  const projectedCenter = projectRADPoint(position, modelViewProjectionMatrix, viewportSize);
  if (!projectedCenter) {
    return 0;
  }

  const scaleOffset = rowIndex * 3;
  const adjustedSupportRadius = getRADAdjustedGaussianSupportRadius(
    splats.opacities[rowIndex],
    gaussianSupportRadius
  );
  const sourceRadius =
    Math.max(
      Math.abs(splats.scales[scaleOffset]),
      Math.abs(splats.scales[scaleOffset + 1]),
      Math.abs(splats.scales[scaleOffset + 2]),
      Number.EPSILON
    ) *
    radiusScale *
    Math.max(lodRenderScale, 0) *
    adjustedSupportRadius;
  const projectedRadiusPixels = getRADProjectedRadiusPixels(
    position,
    sourceRadius,
    modelViewProjectionMatrix,
    viewportSize
  );
  const distanceFromCenter = Math.hypot(
    projectedCenter[0] - viewportSize[0] * 0.5,
    projectedCenter[1] - viewportSize[1] * 0.5
  );
  const normalizedDistance =
    distanceFromCenter / Math.max(Math.min(viewportSize[0], viewportSize[1]) * 0.5, 1);
  const innerCone = Math.max(Math.min(coneFov0, coneFov), 0);
  const outerCone = Math.max(coneFov, innerCone + 0.0001);
  const coneBlend = Math.min(
    Math.max((normalizedDistance - innerCone) / (outerCone - innerCone), 0),
    1
  );
  const conePriority = Math.max(
    Math.min(coneFoveate, 1),
    1 - coneBlend * (1 - Math.min(coneFoveate, 1))
  );
  const insideViewport =
    projectedCenter[0] >= 0 &&
    projectedCenter[0] <= viewportSize[0] &&
    projectedCenter[1] >= 0 &&
    projectedCenter[1] <= viewportSize[1];
  const viewportVisibility = insideViewport ? 1 : 0.05;
  const depthVisibility =
    projectedCenter[2] >= -1 && projectedCenter[2] <= 1
      ? 1
      : Math.min(Math.max(behindFoveate, 0), 1);
  const pixelScale =
    Math.max(projectedRadiusPixels, 0.0001) *
    Math.max(lodSplatScale, 0) *
    conePriority *
    viewportVisibility *
    depthVisibility;
  return Number.isFinite(pixelScale) ? pixelScale : 0;
}

/** Return an approximate projected screen radius for a local-space Gaussian radius. */
function getRADProjectedRadiusPixels(
  position: readonly [number, number, number],
  radius: number,
  modelViewProjectionMatrix: readonly number[],
  viewportSize: readonly [number, number]
): number {
  const projectedCenter = projectRADPoint(position, modelViewProjectionMatrix, viewportSize);
  if (!projectedCenter) {
    return 0;
  }

  let projectedRadiusPixels = 0;
  for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
    const endpoint: [number, number, number] = [position[0], position[1], position[2]];
    endpoint[axisIndex] += radius;
    const projectedEndpoint = projectRADPoint(endpoint, modelViewProjectionMatrix, viewportSize);
    if (projectedEndpoint) {
      projectedRadiusPixels = Math.max(
        projectedRadiusPixels,
        Math.hypot(
          projectedEndpoint[0] - projectedCenter[0],
          projectedEndpoint[1] - projectedCenter[1]
        )
      );
    }
  }
  return projectedRadiusPixels;
}

/** Project a local-space RAD point into viewport pixels and normalized depth. */
function projectRADPoint(
  position: readonly [number, number, number],
  modelViewProjectionMatrix: readonly number[],
  viewportSize: readonly [number, number]
): [number, number, number] | null {
  if (modelViewProjectionMatrix.length < 16) {
    return null;
  }

  const clipX =
    modelViewProjectionMatrix[0] * position[0] +
    modelViewProjectionMatrix[4] * position[1] +
    modelViewProjectionMatrix[8] * position[2] +
    modelViewProjectionMatrix[12];
  const clipY =
    modelViewProjectionMatrix[1] * position[0] +
    modelViewProjectionMatrix[5] * position[1] +
    modelViewProjectionMatrix[9] * position[2] +
    modelViewProjectionMatrix[13];
  const clipZ =
    modelViewProjectionMatrix[2] * position[0] +
    modelViewProjectionMatrix[6] * position[1] +
    modelViewProjectionMatrix[10] * position[2] +
    modelViewProjectionMatrix[14];
  const clipW =
    modelViewProjectionMatrix[3] * position[0] +
    modelViewProjectionMatrix[7] * position[1] +
    modelViewProjectionMatrix[11] * position[2] +
    modelViewProjectionMatrix[15];
  if (!Number.isFinite(clipW) || Math.abs(clipW) < 1e-8) {
    return null;
  }

  const normalizedX = clipX / clipW;
  const normalizedY = clipY / clipW;
  const normalizedZ = clipZ / clipW;
  const projectedPoint: [number, number, number] = [
    (normalizedX * 0.5 + 0.5) * viewportSize[0],
    (0.5 - normalizedY * 0.5) * viewportSize[1],
    normalizedZ
  ];
  return projectedPoint.every(Number.isFinite) ? projectedPoint : null;
}

/** Return a finite viewport size for chunk scoring. */
function getRADViewportSize(viewport: any): [number, number] {
  return [Math.max(Number(viewport?.width) || 1, 1), Math.max(Number(viewport?.height) || 1, 1)];
}

/** Return a coarse viewport signature used to trigger RAD page reselection. */
function getRADViewportLoadSignature(viewport: any): string {
  const cameraPosition = getViewportWorldCameraPosition(viewport) || [0, 0, 0];
  const forwardDirection = getViewportForwardDirection(viewport) || [0, 0, -1];
  const fov = getRADViewportFov(viewport);
  return [
    ...cameraPosition.map(value => getRADSignatureBucket(value, 6)),
    ...forwardDirection.map(value => getRADSignatureBucket(value, 48)),
    getRADSignatureBucket(fov, 2),
    getRADSignatureBucket(Number(viewport?.zoom) || 0, 4),
    getRADSignatureBucket(Number(viewport?.pitch) || 0, 2),
    getRADSignatureBucket(Number(viewport?.bearing) || 0, 2),
    getRADSignatureBucket(Number(viewport?.width) || 1, 1 / 128),
    getRADSignatureBucket(Number(viewport?.height) || 1, 1 / 128)
  ].join(',');
}

/** Return the active vertical FoV from deck.gl viewport variants. */
function getRADViewportFov(viewport: any): number {
  const fov = Number(viewport?.fovy ?? viewport?.fov ?? viewport?.projectionProps?.fovy);
  return Number.isFinite(fov) ? fov : 50;
}

/** @internal Test-only entry point for viewport RAD load signatures. */
export function _getRADViewportLoadSignatureForTesting(viewport: any): string {
  return getRADViewportLoadSignature(viewport);
}

/** Return a rounded integer bucket for a continuous scheduler signal. */
function getRADSignatureBucket(value: number, scale: number): number {
  return Math.round(value * scale);
}

/** Return the Spark-style support radius expanded for merged LoD opacity values above one. */
function getRADAdjustedGaussianSupportRadius(
  opacity: number,
  gaussianSupportRadius: number
): number {
  const splatAlpha = getRADExpandedLoDOpacity(opacity);
  return gaussianSupportRadius + Math.max(splatAlpha - 1, 0) * 0.7;
}

/** Return Spark's expanded alpha domain for RAD merged LoD opacity values above one. */
function getRADExpandedLoDOpacity(opacity: number): number {
  return opacity > 1 ? Math.min(opacity * 4 - 3, 5) : opacity;
}

/** Return sorted global splat ranges represented by decoded chunks. */
function getLoadedRADSplatRanges(loadedChunks: RADSplatLoadedChunk[]): RADSplatLoadedRange[] {
  return loadedChunks
    .map(({chunkIndex, splats}) => {
      const base = getRADSplatBase(splats);
      return {
        start: base,
        end: base + splats.splatCount,
        chunkIndex
      };
    })
    .filter(range => range.end > range.start)
    .sort((left, right) => left.start - right.start);
}

/** Return the fraction of a global splat range that is resident. */
function getRADSplatRangeCoverage(
  start: number,
  end: number,
  loadedRanges: RADSplatLoadedRange[]
): number {
  const count = Math.max(end - start, 0);
  if (count === 0) {
    return 1;
  }

  let coveredCount = 0;
  let coveredEnd = start;
  for (const range of loadedRanges) {
    if (range.end <= coveredEnd) {
      continue;
    }
    if (range.start >= end) {
      break;
    }
    if (range.start > coveredEnd) {
      coveredEnd = range.start;
    }

    const overlapStart = Math.max(coveredEnd, start, range.start);
    const overlapEnd = Math.min(range.end, end);
    if (overlapEnd > overlapStart) {
      coveredCount += overlapEnd - overlapStart;
      coveredEnd = overlapEnd;
    }
    if (coveredEnd >= end) {
      break;
    }
  }

  return coveredCount / count;
}

/** Return an opacity weight for a parent splat with partially resident children. */
function getRADParentOpacityWeightForCoverage(childCoverage: number): number {
  if (childCoverage <= 0) {
    return 1;
  }
  return Math.max(
    DEFAULT_RAD_PARENT_MIN_PARTIAL_OPACITY_WEIGHT,
    1 / (1 + childCoverage * DEFAULT_RAD_PARENT_COVERAGE_FADE_SCALE)
  );
}

/** Return the first global splat index represented by decoded RAD chunk data. */
function getRADSplatBase(splats: RADSplatChunkValues): number {
  return typeof splats.loaderData?.base === 'number' ? splats.loaderData.base : 0;
}

/** Return a cheap signature for a page active-row set. */
function getRADActiveRowsSignature(rows?: Uint32Array): string {
  if (!rows) {
    return 'all';
  }

  let hash = 2166136261;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    hash ^= rows[rowIndex];
    hash = Math.imul(hash, 16777619);
  }
  return `${rows.length}:${rows[0] ?? 0}:${rows[rows.length - 1] ?? 0}:${hash >>> 0}`;
}

/** Return a cheap signature for a full-page active weight vector. */
function getRADActiveWeightsSignature(weights: Float32Array): string {
  let hash = 2166136261;
  for (let weightIndex = 0; weightIndex < weights.length; weightIndex++) {
    hash ^= Math.round(weights[weightIndex] * 255);
    hash = Math.imul(hash, 16777619);
  }
  return `${weights.length}:${hash >>> 0}`;
}

/** Return the active row frontier for the live page runtime. */
function getRADRuntimeRenderFrontierLoadedChunks(
  loadedChunks: RADSplatLoadedChunk[]
): RADRenderFrontierChunk[] {
  return getRADRenderFrontierLoadedChunks(loadedChunks);
}

/** Build a coherent loaded RAD frontier by suppressing partial descendants under retained parents. */
function getRADRenderFrontierSplatChunks(
  loadedChunks: RADSplatLoadedChunk[]
): RADSplatChunkValues[] {
  const sortedLoadedChunks = [...loadedChunks].sort(
    (left, right) =>
      getRADSplatBase(left.splats) - getRADSplatBase(right.splats) ||
      left.chunkIndex - right.chunkIndex
  );
  const loadedRanges = getLoadedRADSplatRanges(sortedLoadedChunks);
  const retainedChildRanges = getRADRetainedParentChildRanges(sortedLoadedChunks, loadedRanges);
  if (!retainedChildRanges.length) {
    return sortedLoadedChunks.map(chunk => pruneLoadedRADSplatParents(chunk.splats, loadedRanges));
  }

  const visibleChunks: RADSplatChunkValues[] = [];
  let retainedChildRangeIndex = 0;
  for (const loadedChunk of sortedLoadedChunks) {
    const splats = loadedChunk.splats;
    const childCounts = splats.loaderData?.childCounts;
    const childStarts = splats.loaderData?.childStarts;
    if (!(childCounts instanceof Uint16Array) || !(childStarts instanceof Uint32Array)) {
      visibleChunks.push(splats);
      continue;
    }

    const base = getRADSplatBase(splats);
    const keepRows = new Uint32Array(splats.splatCount);
    let keepCount = 0;
    for (let rowIndex = 0; rowIndex < splats.splatCount; rowIndex++) {
      const globalSplatIndex = base + rowIndex;
      while (
        retainedChildRangeIndex < retainedChildRanges.length &&
        retainedChildRanges[retainedChildRangeIndex].end <= globalSplatIndex
      ) {
        retainedChildRangeIndex++;
      }
      const retainedChildRange = retainedChildRanges[retainedChildRangeIndex];
      if (
        retainedChildRange &&
        retainedChildRange.start <= globalSplatIndex &&
        globalSplatIndex < retainedChildRange.end
      ) {
        continue;
      }

      const childCount = childCounts[rowIndex];
      const childStart = childStarts[rowIndex];
      const childCoverage = getRADSplatRangeCoverage(
        childStart,
        childStart + childCount,
        loadedRanges
      );
      if (childCount > 0 && childCoverage >= DEFAULT_RAD_PARENT_REPLACEMENT_COVERAGE) {
        continue;
      }
      keepRows[keepCount++] = rowIndex;
    }

    if (keepCount > 0) {
      visibleChunks.push(copyRADSplatRows(splats, keepRows.subarray(0, keepCount)));
    }
  }
  return visibleChunks;
}

/** Build a coherent RAD frontier while preserving source chunk page ownership. */
function getRADRenderFrontierLoadedChunks(
  loadedChunks: RADSplatLoadedChunk[]
): RADRenderFrontierChunk[] {
  const sortedLoadedChunks = [...loadedChunks].sort(
    (left, right) =>
      getRADSplatBase(left.splats) - getRADSplatBase(right.splats) ||
      left.chunkIndex - right.chunkIndex
  );
  const loadedRanges = getLoadedRADSplatRanges(sortedLoadedChunks);
  const retainedChildRanges = getRADRetainedParentChildRanges(sortedLoadedChunks, loadedRanges);
  const visibleChunks: RADRenderFrontierChunk[] = [];
  let retainedChildRangeIndex = 0;

  for (const loadedChunk of sortedLoadedChunks) {
    const splats = loadedChunk.splats;
    const childCounts = splats.loaderData?.childCounts;
    const childStarts = splats.loaderData?.childStarts;
    if (!(childCounts instanceof Uint16Array) || !(childStarts instanceof Uint32Array)) {
      visibleChunks.push({chunk: loadedChunk, visibleSplatCount: splats.splatCount});
      continue;
    }

    const base = getRADSplatBase(splats);
    const visibleRows = new Uint32Array(splats.splatCount);
    const rowWeights = new Float32Array(splats.splatCount);
    let hasPartialWeights = false;
    let visibleSplatCount = 0;
    for (let rowIndex = 0; rowIndex < splats.splatCount; rowIndex++) {
      const globalSplatIndex = base + rowIndex;
      while (
        retainedChildRangeIndex < retainedChildRanges.length &&
        retainedChildRanges[retainedChildRangeIndex].end <= globalSplatIndex
      ) {
        retainedChildRangeIndex++;
      }
      const retainedChildRange = retainedChildRanges[retainedChildRangeIndex];
      if (
        retainedChildRange &&
        retainedChildRange.start <= globalSplatIndex &&
        globalSplatIndex < retainedChildRange.end
      ) {
        continue;
      }

      const childCount = childCounts[rowIndex];
      const childStart = childStarts[rowIndex];
      const childCoverage = getRADSplatRangeCoverage(
        childStart,
        childStart + childCount,
        loadedRanges
      );
      if (childCount > 0 && childCoverage >= DEFAULT_RAD_PARENT_REPLACEMENT_COVERAGE) {
        continue;
      }
      visibleRows[visibleSplatCount] = rowIndex;
      const rowWeight = childCount > 0 ? getRADParentOpacityWeightForCoverage(childCoverage) : 1;
      rowWeights[rowIndex] = rowWeight;
      hasPartialWeights ||= rowWeight < 1;
      visibleSplatCount++;
    }

    if (visibleSplatCount > 0) {
      visibleChunks.push({
        chunk: loadedChunk,
        visibleSplatCount,
        visibleRows:
          visibleSplatCount === splats.splatCount
            ? undefined
            : visibleRows.subarray(0, visibleSplatCount),
        rowWeights: hasPartialWeights ? rowWeights : undefined
      });
    }
  }
  return visibleChunks;
}

/** @internal Test-only entry point for building a loaded RAD render frontier. */
export function _getRADRenderFrontierSplatChunksForTesting(loadedChunks: any[]): any[] {
  return getRADRenderFrontierSplatChunks(loadedChunks as RADSplatLoadedChunk[]);
}

/** @internal Test-only entry point for building the row-level loaded RAD LoD frontier. */
export function _getRADLoadedRenderFrontierForTesting(
  loadedChunks: any[],
  metadata: any,
  options: any
): any[] {
  const loadedByChunkIndex = new Map<number, RADSplatLoadedChunk>(
    (loadedChunks as RADSplatLoadedChunk[]).map(chunk => [chunk.chunkIndex, chunk])
  );
  return (
    getRADLoadedRenderFrontier(
      loadedByChunkIndex,
      metadata,
      options.startChunkIndex,
      new Set(),
      options
    )?.frontierChunks || []
  );
}

/** @internal Test-only entry point for compacting selected RAD render frontier rows. */
export function _getRADCompactedRenderChunksForTesting(
  frontierChunks: any[],
  maxPageSplatCount: number
): any[] {
  return createRADCompactedRenderChunks(
    frontierChunks as RADRenderFrontierChunk[],
    maxPageSplatCount
  );
}

/** @internal Test-only entry point for render frontier cache signatures. */
export function _getRADRenderFrontierSignatureForTesting(
  frontierChunks: any[],
  fallbackColor: Color = DEFAULT_COLOR,
  gaussianSupportRadius: number = 3
): string {
  return getRADRenderFrontierSignature(
    frontierChunks as RADRenderFrontierChunk[],
    fallbackColor,
    gaussianSupportRadius
  );
}

/** @internal Test-only entry point for RAD render page sizing. */
export function _getRADRenderPageSplatCountForTesting(
  frontierChunks: any[],
  sortMode?: SplatSortMode
): number {
  return getRADRenderPageSplatCount(frontierChunks as RADRenderFrontierChunk[], sortMode);
}

/** @internal Test-only entry point for RAD chunk request prefetch planning. */
export function _getRADChunkRequestIndicesForTesting(
  immediateChunkIndices: number[],
  selectedChunks: any[],
  loadedChunks: any[],
  metadata: any,
  unavailableChunkIndices: number[] = [],
  options: Partial<RADSplatChunkSelectionOptions> = {},
  maxRequestChunkCount: number = 8
): number[] {
  const defaultOptions: RADSplatChunkSelectionOptions = {
    startChunkIndex: 0,
    maxChunks: 8,
    maxSplats: 8,
    maxConcurrentChunkRequests: 8,
    radiusScale: 1,
    gaussianSupportRadius: 3,
    lodSplatScale: 1,
    lodRenderScale: 1,
    coneFov0: 0.25,
    coneFov: 1,
    behindFoveate: 0.2,
    coneFoveate: 0.4,
    maxCachedChunks: 16
  };
  return getRADChunkRequestIndices(immediateChunkIndices, selectedChunks as RADSplatLoadedChunk[], {
    loadedByChunkIndex: new Map(
      (loadedChunks as RADSplatLoadedChunk[]).map(chunk => [chunk.chunkIndex, chunk])
    ),
    metadata: metadata as RADSplatMetadataLike,
    unavailableChunkIndices: new Set(unavailableChunkIndices),
    options: {...defaultOptions, ...options},
    maxRequestChunkCount
  });
}

/** Build merged child ranges whose parents remain in the current loaded frontier. */
function getRADRetainedParentChildRanges(
  loadedChunks: RADSplatLoadedChunk[],
  loadedRanges: RADSplatLoadedRange[]
): RADSplatRange[] {
  const retainedChildRanges: RADSplatRange[] = [];
  for (const loadedChunk of loadedChunks) {
    const childCounts = loadedChunk.splats.loaderData?.childCounts;
    const childStarts = loadedChunk.splats.loaderData?.childStarts;
    if (!(childCounts instanceof Uint16Array) || !(childStarts instanceof Uint32Array)) {
      continue;
    }

    for (let rowIndex = 0; rowIndex < loadedChunk.splats.splatCount; rowIndex++) {
      const childCount = childCounts[rowIndex];
      if (childCount <= 0) {
        continue;
      }
      const childStart = childStarts[rowIndex];
      const childEnd = childStart + childCount;
      const childCoverage = getRADSplatRangeCoverage(childStart, childEnd, loadedRanges);
      if (
        childCount <= DEFAULT_RAD_FRONTIER_MAX_SUPPRESSED_CHILD_SPLATS &&
        childCoverage < DEFAULT_RAD_CHILD_SUPPRESSION_COVERAGE
      ) {
        retainedChildRanges.push({start: childStart, end: childEnd});
      }
    }
  }
  return mergeRADSplatRanges(retainedChildRanges);
}

/** Merge sorted and overlapping global RAD ranges. */
function mergeRADSplatRanges(ranges: RADSplatRange[]): RADSplatRange[] {
  if (ranges.length <= 1) {
    return ranges;
  }
  const sortedRanges = [...ranges].sort((left, right) => left.start - right.start);
  const mergedRanges: RADSplatRange[] = [];
  for (const range of sortedRanges) {
    const lastRange = mergedRanges[mergedRanges.length - 1];
    if (lastRange && range.start <= lastRange.end) {
      lastRange.end = Math.max(lastRange.end, range.end);
    } else {
      mergedRanges.push({...range});
    }
  }
  return mergedRanges;
}

/** Remove parent LoD rows when their child rows are present in the loaded chunk window. */
function pruneLoadedRADSplatParents(
  splats: RADSplatChunkValues,
  loadedRanges: RADSplatLoadedRange[]
): RADSplatChunkValues {
  const childCounts = splats.loaderData?.childCounts;
  const childStarts = splats.loaderData?.childStarts;
  if (!(childCounts instanceof Uint16Array) || !(childStarts instanceof Uint32Array)) {
    return splats;
  }

  const keepRows = new Uint32Array(splats.splatCount);
  let keepCount = 0;
  for (let rowIndex = 0; rowIndex < splats.splatCount; rowIndex++) {
    const childCount = childCounts[rowIndex];
    const childStart = childStarts[rowIndex];
    const childCoverage = getRADSplatRangeCoverage(
      childStart,
      childStart + childCount,
      loadedRanges
    );
    if (childCount > 0 && childCoverage >= DEFAULT_RAD_PARENT_REPLACEMENT_COVERAGE) {
      continue;
    }
    keepRows[keepCount++] = rowIndex;
  }
  if (keepCount === splats.splatCount) {
    return splats;
  }

  return copyRADSplatRows(splats, keepRows.subarray(0, keepCount));
}

/** Copy selected RAD rows while preserving optional LoD and SH metadata. */
function copyRADSplatRows(splats: RADSplatChunkValues, keptRows: Uint32Array): RADSplatChunkValues {
  if (keptRows.length === splats.splatCount) {
    return splats;
  }

  const childCounts = splats.loaderData?.childCounts;
  const childStarts = splats.loaderData?.childStarts;
  const sphericalHarmonicsComponentCount = splats.sphericalHarmonicsComponentCount ?? 0;
  return {
    ...splats,
    splatCount: keptRows.length,
    positions: copyInterleavedRows(splats.positions, 3, keptRows),
    scales: copyInterleavedRows(splats.scales, 3, keptRows),
    rotations: copyInterleavedRows(splats.rotations, 4, keptRows),
    colors: copyInterleavedRows(splats.colors, 3, keptRows),
    sphericalHarmonicDcs: splats.sphericalHarmonicDcs
      ? copyInterleavedRows(splats.sphericalHarmonicDcs, 3, keptRows)
      : undefined,
    opacities: copyInterleavedRows(splats.opacities, 1, keptRows),
    sphericalHarmonics:
      splats.sphericalHarmonics && sphericalHarmonicsComponentCount
        ? copyInterleavedRows(splats.sphericalHarmonics, sphericalHarmonicsComponentCount, keptRows)
        : undefined,
    loaderData: {
      ...splats.loaderData,
      count: keptRows.length,
      childCounts:
        childCounts instanceof Uint16Array
          ? copyInterleavedRows(childCounts, 1, keptRows)
          : undefined,
      childStarts:
        childStarts instanceof Uint32Array
          ? copyInterleavedRows(childStarts, 1, keptRows)
          : undefined
    }
  };
}

/** Copy selected rows from an interleaved typed array. */
function copyInterleavedRows<T extends Float32Array | Uint8Array | Uint16Array | Uint32Array>(
  values: T,
  itemSize: number,
  rows: Uint32Array
): T {
  const copiedValues = new (values.constructor as {new (length: number): T})(
    rows.length * itemSize
  );
  for (let outputRowIndex = 0; outputRowIndex < rows.length; outputRowIndex++) {
    const inputOffset = rows[outputRowIndex] * itemSize;
    const outputOffset = outputRowIndex * itemSize;
    copiedValues.set(values.subarray(inputOffset, inputOffset + itemSize), outputOffset);
  }
  return copiedValues;
}

/** Return combined bounds for resident decoded source pages. */
function getRADPageBounds(
  chunkIndices: number[],
  pageStore: RADPageStore
): RADSplatBounds | undefined {
  let bounds: RADSplatBounds | undefined;
  for (const chunkIndex of chunkIndices) {
    const pageBounds = pageStore.getPageBounds(chunkIndex);
    if (!pageBounds) {
      continue;
    }
    bounds = bounds ? unionRADSplatBounds(bounds, pageBounds) : pageBounds;
  }
  return bounds;
}

/** Return finite bounds for interleaved splat positions. */
function getRADSplatBounds(positions: Float32Array): RADSplatBounds | undefined {
  if (positions.length < 3) {
    return undefined;
  }

  const mins: [number, number, number] = [Infinity, Infinity, Infinity];
  const maxs: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let positionIndex = 0; positionIndex < positions.length; positionIndex += 3) {
    for (let axisIndex = 0; axisIndex < 3; axisIndex++) {
      const value = positions[positionIndex + axisIndex];
      mins[axisIndex] = Math.min(mins[axisIndex], value);
      maxs[axisIndex] = Math.max(maxs[axisIndex], value);
    }
  }
  return mins.every(Number.isFinite) && maxs.every(Number.isFinite) ? {mins, maxs} : undefined;
}

/** Return the union of two finite RAD bounds objects. */
function unionRADSplatBounds(left: RADSplatBounds, right: RADSplatBounds): RADSplatBounds {
  return {
    mins: [
      Math.min(left.mins[0], right.mins[0]),
      Math.min(left.mins[1], right.mins[1]),
      Math.min(left.mins[2], right.mins[2])
    ],
    maxs: [
      Math.max(left.maxs[0], right.maxs[0]),
      Math.max(left.maxs[1], right.maxs[1]),
      Math.max(left.maxs[2], right.maxs[2])
    ]
  };
}

/** Return normalized depth for a RAD bounds center so split engines can draw far-to-near. */
function getRADSplatBoundsDepth(
  bounds: RADSplatBounds | undefined,
  viewport: any,
  modelMatrix?: Matrix4Like | null
): number {
  if (!bounds) {
    return 0;
  }
  const modelViewProjectionMatrix = getModelViewProjectionMatrix(viewport, modelMatrix);
  if (!modelViewProjectionMatrix) {
    return 0;
  }
  const center: [number, number, number] = [
    (bounds.mins[0] + bounds.maxs[0]) * 0.5,
    (bounds.mins[1] + bounds.maxs[1]) * 0.5,
    (bounds.mins[2] + bounds.maxs[2]) * 0.5
  ];
  const projectedCenter = projectRADPoint(center, modelViewProjectionMatrix, [1, 1]);
  return projectedCenter?.[2] ?? 0;
}

/** Build draw-time engine inputs from the active deck.gl viewport. */
function getSplatEngineUpdateProps(
  viewport: any,
  radiusScale: number,
  modelMatrix?: Matrix4Like | null
) {
  if (!viewport) {
    return {radiusScale};
  }
  const hasModelMatrix = hasNonIdentityModelMatrix(modelMatrix);

  return {
    modelViewProjectionMatrix: getModelViewProjectionMatrix(viewport, modelMatrix),
    viewportSize: [viewport.width || 1, viewport.height || 1] as [number, number],
    cullingVolume: hasModelMatrix ? undefined : getCullingVolume(viewport),
    radiusScale,
    viewOrigin: getViewportCameraPosition(viewport, modelMatrix)
  };
}

/** Return a viewport camera position suitable for view-dependent splat color. */
function getViewportCameraPosition(
  viewport: any,
  modelMatrix?: Matrix4Like | null
): [number, number, number] | undefined {
  const cameraPosition = getViewportWorldCameraPosition(viewport);
  if (!cameraPosition || !hasNonIdentityModelMatrix(modelMatrix)) {
    return cameraPosition;
  }

  try {
    const modelMatrixInverse = new Matrix4(modelMatrix as any).invert();
    const localCameraPosition = modelMatrixInverse.transformAsPoint(cameraPosition);
    return [
      Number(localCameraPosition[0]),
      Number(localCameraPosition[1]),
      Number(localCameraPosition[2])
    ];
  } catch {
    return cameraPosition;
  }
}

/** Return a viewport camera position in deck world coordinates. */
function getViewportWorldCameraPosition(viewport: any): [number, number, number] | undefined {
  const cameraPosition = viewport.cameraPosition;
  if (cameraPosition && cameraPosition.length >= 3) {
    return [Number(cameraPosition[0]), Number(cameraPosition[1]), Number(cameraPosition[2])];
  }

  const viewMatrix = viewport.viewMatrix;
  if (viewMatrix && viewMatrix.length >= 16) {
    const translationX = Number(viewMatrix[12]);
    const translationY = Number(viewMatrix[13]);
    const translationZ = Number(viewMatrix[14]);
    const position: [number, number, number] = [
      -(
        Number(viewMatrix[0]) * translationX +
        Number(viewMatrix[1]) * translationY +
        Number(viewMatrix[2]) * translationZ
      ),
      -(
        Number(viewMatrix[4]) * translationX +
        Number(viewMatrix[5]) * translationY +
        Number(viewMatrix[6]) * translationZ
      ),
      -(
        Number(viewMatrix[8]) * translationX +
        Number(viewMatrix[9]) * translationY +
        Number(viewMatrix[10]) * translationZ
      )
    ];
    if (position.every(Number.isFinite)) {
      return position;
    }
  }
  return undefined;
}

/** Return the viewport forward direction in world coordinates. */
function getViewportForwardDirection(viewport: any): [number, number, number] | undefined {
  const viewMatrix = viewport?.viewMatrix;
  if (!viewMatrix || viewMatrix.length < 16) {
    return undefined;
  }
  const forwardDirection: [number, number, number] = [
    -Number(viewMatrix[2]),
    -Number(viewMatrix[6]),
    -Number(viewMatrix[10])
  ];
  const length = Math.hypot(forwardDirection[0], forwardDirection[1], forwardDirection[2]);
  if (!Number.isFinite(length) || length <= 0) {
    return undefined;
  }
  return [forwardDirection[0] / length, forwardDirection[1] / length, forwardDirection[2] / length];
}

/** Combine a viewport projection with a layer model transform when present. */
function getModelViewProjectionMatrix(
  viewport: any,
  modelMatrix?: Matrix4Like | null
): readonly number[] | undefined {
  const viewProjectionMatrix = viewport?.viewProjectionMatrix;
  if (!viewProjectionMatrix || !hasNonIdentityModelMatrix(modelMatrix)) {
    return viewProjectionMatrix;
  }
  return new Matrix4(viewProjectionMatrix).multiplyRight(modelMatrix as any);
}

/** Returns true when a layer model matrix applies a non-identity transform. */
function hasNonIdentityModelMatrix(modelMatrix?: Matrix4Like | null): boolean {
  if (!modelMatrix || modelMatrix.length < 16) {
    return false;
  }
  for (let index = 0; index < 16; index++) {
    if (Math.abs(Number(modelMatrix[index]) - IDENTITY_MODEL_MATRIX[index]) > 1e-12) {
      return true;
    }
  }
  return false;
}

/** Build a math.gl frustum culling volume from a deck.gl viewport. */
function getCullingVolume(viewport: any): CullingVolume | undefined {
  if (typeof viewport.getFrustumPlanes !== 'function') {
    return undefined;
  }

  const planes = Object.values(viewport.getFrustumPlanes()).map(
    ({normal, distance}: any) => new Plane(normal.clone().negate(), distance)
  );
  return new CullingVolume(planes);
}

/** Returns true when data can be consumed as async Arrow table batches. */
function isAsyncIterable(data: unknown): data is AsyncIterable<ArrowTableBatch> {
  return Boolean(
    data && typeof (data as AsyncIterable<ArrowTableBatch>)[Symbol.asyncIterator] === 'function'
  );
}

/** Convert a Gaussian splat Arrow table into deck.gl binary attributes. */
function getDeckBinaryDataFromGaussianSplatArrowTable(
  table: arrow.Table,
  fallbackColor: Color = DEFAULT_COLOR,
  gaussianSupportRadius: number = 3
): DeckBinaryData {
  const splatData = getGaussianSplatDataFromArrowTable(table, fallbackColor, gaussianSupportRadius);

  return {
    length: splatData.length,
    attributes: {
      getPosition: {value: splatData.positions, size: 3},
      getRadius: {value: splatData.radii, size: 1},
      getColor: {value: splatData.colors, size: 4, type: 'unorm8'}
    }
  };
}
