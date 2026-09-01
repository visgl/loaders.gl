// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Matrix4, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {Stats} from '@probe.gl/stats';
import {RequestScheduler, Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {TilesetCache} from './tileset-cache';
import {calculateTransformProps} from '../helpers/transform-utils';
import {getFrameState, limitSelectedTiles, updateCameraMotionState} from '../helpers/frame-state';
import type {CameraMotionState, FrameState} from '../helpers/frame-state';
import {
  calculateDynamicScreenSpaceErrorDensity,
  updateRootTransformForDynamicScreenSpaceError
} from '../helpers/tiles-3d-lod';
import {interpolateLinearly} from '../helpers/tiles-3d-request-priority';
import type {FoveatedInterpolationCallback} from '../helpers/tiles-3d-request-priority';

import type {GeospatialViewport, Viewport} from '../../types';
import {Tile3D} from './tile-3d';
import {TILESET_TYPE} from '../../constants';
import type {TilesetSpatialOptions, TilesetSpatialReference} from '../../spatial/spatial-types';
import {
  applyTilesetSpatialOptions,
  createTilesetSpatialReference
} from '../../spatial/spatial-types';

import {TilesetTraverser} from './tileset-traverser';
import {
  isTileset3DSource,
  TileContentLoadResult,
  TilesetContentFormats,
  TilesetJSON,
  Tileset3DSource,
  TilesetSourceMetadata
} from './tileset-source';

export type {TilesetJSON} from './tileset-source';

export type Tileset3DProps = {
  throttleRequests?: boolean;
  maxRequests?: number;
  loadOptions?: LoaderOptions;
  loadTiles?: boolean;
  basePath?: string;
  /**
   * Soft target, in bytes, for cached tile content that is not required by the current frame.
   * The listed default applies to 3D Tiles; I3S retains its existing 32 MiB default.
   * @default 536870912
   */
  cacheBytes?: number;
  /**
   * Additional bytes that the current-frame working set may use before memory-adjusted SSE rises.
   * The listed default applies to 3D Tiles; I3S retains its existing 1 MiB default.
   * @default 536870912
   */
  maximumCacheOverflowBytes?: number;
  /**
   * Soft cache target in mebibytes.
   * @deprecated Use {@link Tileset3DProps.cacheBytes}; when both are supplied, `cacheBytes` wins.
   */
  maximumMemoryUsage?: number;
  /**
   * Cache overflow headroom in mebibytes.
   * @deprecated Use {@link Tileset3DProps.maximumCacheOverflowBytes}; when both are supplied, the
   * byte-native option wins.
   */
  memoryCacheOverflow?: number;
  maximumTilesSelected?: number;
  debounceTime?: number;

  description?: string;
  attributions?: string[];

  ellipsoid?: object;
  modelMatrix?: Matrix4;
  /** Automatic CRS output options and expert source-metadata recovery overrides. */
  spatial?: TilesetSpatialOptions;

  maximumScreenSpaceError?: number;
  /**
   * Enables replacement traversal that may skip hierarchy levels while retaining ready ancestors
   * as coverage. This trades temporary overdraw for faster refinement on deep trees.
   * @default false
   */
  skipLevelOfDetail?: boolean;
  /** Enables perspective dynamic SSE to reduce distant, horizon-facing refinement. */
  dynamicScreenSpaceError?: boolean;
  /** Base dynamic SSE fog density in inverse meters. */
  dynamicScreenSpaceErrorDensity?: number;
  /** Maximum dynamic SSE reduction in logical/CSS pixels. */
  dynamicScreenSpaceErrorFactor?: number;
  /** Fraction of tileset height at which dynamic SSE begins to fade, clamped to `[0, 1]`. */
  dynamicScreenSpaceErrorHeightFalloff?: number;
  /**
   * Enables adaptive LOD reduction when estimated tile memory exceeds the overflow ceiling.
   * Defaults to `true` for 3D Tiles and retains the existing `false` default for I3S.
   */
  memoryAdjustedScreenSpaceError?: boolean;
  viewportTraversersMap?: any;
  updateTransforms?: boolean;
  viewDistanceScale?: number;
  /** Reduced viewport-height fraction used to prioritize coarse initial coverage; `0` disables it. */
  progressiveResolutionHeightFraction?: number;
  /** Whether requests nearer the center of a perspective viewport receive higher priority. */
  foveatedScreenSpaceError?: boolean;
  /** Fraction of the perspective field of view that receives no foveated SSE relaxation. */
  foveatedConeSize?: number;
  /** Minimum logical-pixel SSE relaxation immediately outside the foveated cone. */
  foveatedMinimumScreenSpaceErrorRelaxation?: number;
  /** Function that increases SSE relaxation from the foveated cone toward the viewport edge. */
  foveatedInterpolationCallback?: FoveatedInterpolationCallback;
  /** Seconds peripheral requests may wait after the camera moves. */
  foveatedTimeDelay?: number;

  onTileLoad?: (tile: Tile3D) => any;
  onTileUnload?: (tile: Tile3D) => any;
  onTileError?: (tile: Tile3D, message: string, url: string) => any;
  /** Called when a format-specific source operation fails. */
  onSourceError?: (error: Error, source: Tileset3DSource, tile?: Tile3D | null) => any;
  /** Called when tileset initialization fails before traversal can begin. */
  onTilesetError?: (error: Error, tileset: Tileset3D) => any;
  contentLoader?: (tile: Tile3D) => Promise<void>;
  onTraversalComplete?: (selectedTiles: Tile3D[]) => Tile3D[];
  onUpdate?: () => void;
};

type Props = {
  description: string;
  ellipsoid: object;
  modelMatrix: Matrix4;
  throttleRequests: boolean;
  maxRequests: number;
  /** Soft target, in bytes, for evictable cached tile content. */
  cacheBytes: number;
  /** Current-frame headroom, in bytes, before memory-adjusted SSE rises. */
  maximumCacheOverflowBytes: number;
  /** @deprecated Byte-native code should use `cacheBytes`. */
  maximumMemoryUsage: number;
  /** @deprecated Byte-native code should use `maximumCacheOverflowBytes`. */
  memoryCacheOverflow: number;
  maximumTilesSelected: number;
  debounceTime: number;
  onTileLoad: (tile: Tile3D) => void;
  onTileUnload: (tile: Tile3D) => void;
  onTileError: (tile: Tile3D, message: string, url: string) => void;
  onSourceError: (error: Error, source: Tileset3DSource, tile?: Tile3D | null) => void;
  onTilesetError: (error: Error, tileset: Tileset3D) => void;
  onTraversalComplete: (selectedTiles: Tile3D[]) => Tile3D[];
  onUpdate: () => void;
  maximumScreenSpaceError: number;
  /** Whether replacement traversal may skip levels while retaining ancestor coverage. */
  skipLevelOfDetail: boolean;
  /** Whether perspective dynamic SSE is enabled. */
  dynamicScreenSpaceError: boolean;
  /** Base dynamic SSE fog density in inverse meters. */
  dynamicScreenSpaceErrorDensity: number;
  /** Maximum dynamic SSE reduction in logical/CSS pixels. */
  dynamicScreenSpaceErrorFactor: number;
  /** Fraction of tileset height at which dynamic SSE begins to fade. */
  dynamicScreenSpaceErrorHeightFalloff: number;
  /** Whether cache pressure may adapt the active SSE threshold. */
  memoryAdjustedScreenSpaceError: boolean;
  viewportTraversersMap: Record<string, any> | null;
  attributions: string[];
  loadTiles: boolean;
  loadOptions: LoaderOptions;
  updateTransforms: boolean;
  viewDistanceScale: number;
  /** Reduced viewport-height fraction used to prioritize coarse initial coverage. */
  progressiveResolutionHeightFraction: number;
  /** Whether perspective requests are prioritized around the viewport center. */
  foveatedScreenSpaceError: boolean;
  /** Fraction of the perspective field of view with no foveated SSE relaxation. */
  foveatedConeSize: number;
  /** Minimum logical-pixel SSE relaxation outside the foveated cone. */
  foveatedMinimumScreenSpaceErrorRelaxation: number;
  /** Function used to interpolate foveated SSE relaxation. */
  foveatedInterpolationCallback: FoveatedInterpolationCallback;
  /** Seconds eligible peripheral requests wait after camera movement. */
  foveatedTimeDelay: number;
  basePath: string;
  contentLoader?: (tile: Tile3D) => Promise<void>;
  i3s: Record<string, any>;
  /** Automatic CRS output options and expert source-metadata recovery overrides. */
  spatial: TilesetSpatialOptions;
};

const BYTES_PER_MEBIBYTE = 1024 * 1024;
const DEFAULT_CACHE_BYTES = 512 * BYTES_PER_MEBIBYTE;
const DEFAULT_MAXIMUM_CACHE_OVERFLOW_BYTES = 512 * BYTES_PER_MEBIBYTE;
const DEFAULT_I3S_CACHE_BYTES = 32 * BYTES_PER_MEBIBYTE;
const DEFAULT_I3S_MAXIMUM_CACHE_OVERFLOW_BYTES = BYTES_PER_MEBIBYTE;

/**
 * Validates a byte-based tile-cache budget.
 *
 * Fractions are accepted because JavaScript memory estimates are numbers, but negative, infinite,
 * and `NaN` values cannot define a stable cache threshold.
 *
 * @param value - Proposed cache budget in bytes.
 * @param optionName - Public option name used in an actionable error message.
 * @returns The validated byte budget.
 */
function validateCacheByteLength(value: number, optionName: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${optionName} must be a finite number greater than or equal to 0`);
  }
  return value;
}

/**
 * Resolves the base cache target from byte-native or deprecated mebibyte options.
 *
 * The byte-native option takes precedence so mixed migration configurations are deterministic.
 * The fallback is already expressed in bytes and is used for both construction and runtime updates.
 *
 * @param options - Options that may contain byte-native or deprecated cache values.
 * @param fallbackCacheBytes - Existing or default cache target in bytes.
 * @returns The resolved and validated cache target in bytes.
 */
function resolveCacheBytes(options: Tileset3DProps, fallbackCacheBytes: number): number {
  const cacheBytes =
    options.cacheBytes ??
    (options.maximumMemoryUsage !== undefined
      ? options.maximumMemoryUsage * BYTES_PER_MEBIBYTE
      : fallbackCacheBytes);
  return validateCacheByteLength(cacheBytes, 'cacheBytes');
}

/**
 * Resolves cache overflow headroom from byte-native or deprecated mebibyte options.
 *
 * The byte-native option takes precedence so callers can migrate the two cache controls
 * independently without unit ambiguity.
 *
 * @param options - Options that may contain byte-native or deprecated overflow values.
 * @param fallbackOverflowBytes - Existing or default overflow headroom in bytes.
 * @returns The resolved and validated overflow headroom in bytes.
 */
function resolveMaximumCacheOverflowBytes(
  options: Tileset3DProps,
  fallbackOverflowBytes: number
): number {
  const maximumCacheOverflowBytes =
    options.maximumCacheOverflowBytes ??
    (options.memoryCacheOverflow !== undefined
      ? options.memoryCacheOverflow * BYTES_PER_MEBIBYTE
      : fallbackOverflowBytes);
  return validateCacheByteLength(maximumCacheOverflowBytes, 'maximumCacheOverflowBytes');
}

const DEFAULT_PROPS: Props = {
  description: '',
  ellipsoid: Ellipsoid.WGS84,
  modelMatrix: new Matrix4(),
  throttleRequests: true,
  maxRequests: 64,
  cacheBytes: DEFAULT_CACHE_BYTES,
  maximumCacheOverflowBytes: DEFAULT_MAXIMUM_CACHE_OVERFLOW_BYTES,
  maximumMemoryUsage: DEFAULT_CACHE_BYTES / BYTES_PER_MEBIBYTE,
  memoryCacheOverflow: DEFAULT_MAXIMUM_CACHE_OVERFLOW_BYTES / BYTES_PER_MEBIBYTE,
  maximumTilesSelected: 0,
  debounceTime: 0,
  onTileLoad: () => {},
  onTileUnload: () => {},
  onTileError: () => {},
  onSourceError: () => {},
  onTilesetError: () => {},
  onTraversalComplete: (selectedTiles: Tile3D[]) => selectedTiles,
  onUpdate: () => {},
  contentLoader: undefined,
  viewDistanceScale: 1.0,
  progressiveResolutionHeightFraction: 0.3,
  foveatedScreenSpaceError: true,
  foveatedConeSize: 0.1,
  foveatedMinimumScreenSpaceErrorRelaxation: 0,
  foveatedInterpolationCallback: interpolateLinearly,
  foveatedTimeDelay: 0.2,
  maximumScreenSpaceError: 8,
  skipLevelOfDetail: false,
  dynamicScreenSpaceError: true,
  dynamicScreenSpaceErrorDensity: 2.0e-4,
  dynamicScreenSpaceErrorFactor: 24,
  dynamicScreenSpaceErrorHeightFalloff: 0.25,
  memoryAdjustedScreenSpaceError: true,
  loadTiles: true,
  updateTransforms: true,
  viewportTraversersMap: null,
  loadOptions: {fetch: {}},
  attributions: [],
  basePath: '',
  i3s: {},
  spatial: {}
};

const TILES_TOTAL = 'Tiles In Tileset(s)';
const TILES_IN_MEMORY = 'Tiles In Memory';
const TILES_IN_VIEW = 'Tiles In View';
const TILES_RENDERABLE = 'Tiles To Render';
const TILES_LOADED = 'Tiles Loaded';
const TILES_LOADING = 'Tiles Loading';
const TILES_UNLOADED = 'Tiles Unloaded';
const TILES_LOAD_FAILED = 'Failed Tile Loads';
const POINTS_COUNT = 'Points/Vertices';
const TILES_GPU_MEMORY = 'Tile Memory Use';
const MAXIMUM_SSE = 'Maximum Screen Space Error';

/**
 * Shared runtime for tile traversal, selection, cache management, and request scheduling.
 *
 * Format-specific loading behavior is delegated to a {@link Tileset3DSource} implementation.
 */
export class Tileset3D {
  options: Props;
  loadOptions: LoaderOptions;
  /** Source implementation responsible for format-specific initialization and loading. */
  source: Tileset3DSource;

  type: TILESET_TYPE;
  tileset: TilesetJSON | null;
  loader: Loader;
  url: string;
  basePath: string;
  modelMatrix: Matrix4;
  ellipsoid: any;
  lodMetricType: string;
  lodMetricValue: number;
  refine: string;
  root: Tile3D | null = null;
  roots: Record<string, Tile3D> = {};
  asset: Record<string, any> = {};
  /** Inline metadata schema declared by the source tileset, when present. */
  schema: Record<string, any> | null = null;
  /** External metadata schema URI declared by the source tileset, when present. */
  schemaUri: string | null = null;
  /** Metadata groups declared by the source tileset, in source order. */
  groups: Array<Record<string, any>> = [];
  /** Tileset-wide metadata entity, preserved without property-table decoding. */
  metadata: Record<string, any> | null = null;
  /** Tileset statistics metadata, preserved for application-level inspection. */
  statistics: unknown = null;
  /** Normalized source and target coordinate reference system metadata. */
  spatialReference: TilesetSpatialReference = createTilesetSpatialReference({});

  description = '';
  properties: any;
  extras: any = null;
  attributions: any = {};
  credits: any = {};

  stats: Stats;
  contentFormats: TilesetContentFormats;

  cartographicCenter: Vector3 | null = null;
  cartesianCenter: Vector3 | null = null;
  zoom = 1;
  boundingVolume: any = null;

  /** Effective dynamic SSE density calculated for the most recently traversed viewport. */
  dynamicScreenSpaceErrorComputedDensity = 0;

  /** Estimated bytes currently retained by loaded tile content. */
  gpuMemoryUsageInBytes = 0;
  /** Active SSE threshold after optional cache-pressure adjustment, in logical/CSS pixels. */
  memoryAdjustedScreenSpaceError = 0.0;

  private _cacheBytes = DEFAULT_CACHE_BYTES;
  private _maximumCacheOverflowBytes = DEFAULT_MAXIMUM_CACHE_OVERFLOW_BYTES;

  _frameNumber = 0;
  private _tiles: Record<string, Tile3D> = {};
  private _pendingCount = 0;

  selectedTiles: Tile3D[] = [];

  traverseCounter = 0;
  geometricError = 0;
  private lastUpdatedVieports: Viewport[] | Viewport | null = null;
  private _requestedTiles: Tile3D[] = [];
  private _emptyTiles: Tile3D[] = [];
  private frameStateData: any = {};
  /** Last camera pose retained independently for each viewport. */
  private _cameraMotionStates: Record<string, CameraMotionState> = {};
  /** Pending traversal that releases requests after camera motion settles. */
  private _deferredTraversalTimeout: ReturnType<typeof setTimeout> | null = null;

  _traverser: TilesetTraverser;
  _cache = new TilesetCache();
  _requestScheduler: RequestScheduler;

  private _heldTiles: Set<string> = new Set();
  private updatePromise: Promise<number> | null = null;
  tilesetInitializationPromise: Promise<void>;

  /**
   * Creates a tileset runtime from an explicit source implementation.
   * @param source Source-backed tileset implementation.
   * @param options Traversal and runtime options.
   */
  constructor(source: Tileset3DSource, options?: Tileset3DProps) {
    if (!isTileset3DSource(source)) {
      throw new Error('Tileset3D requires a Tileset3DSource instance');
    }

    const suppliedOptions = options || {};
    const usesTiles3DCacheDefaults = source.type === TILESET_TYPE.TILES3D;
    const defaultCacheBytes = usesTiles3DCacheDefaults
      ? DEFAULT_PROPS.cacheBytes
      : DEFAULT_I3S_CACHE_BYTES;
    const defaultMaximumCacheOverflowBytes = usesTiles3DCacheDefaults
      ? DEFAULT_PROPS.maximumCacheOverflowBytes
      : DEFAULT_I3S_MAXIMUM_CACHE_OVERFLOW_BYTES;
    const cacheBytes = resolveCacheBytes(suppliedOptions, defaultCacheBytes);
    const maximumCacheOverflowBytes = resolveMaximumCacheOverflowBytes(
      suppliedOptions,
      defaultMaximumCacheOverflowBytes
    );
    this.options = {
      ...DEFAULT_PROPS,
      ...suppliedOptions,
      cacheBytes,
      maximumCacheOverflowBytes,
      maximumMemoryUsage: cacheBytes / BYTES_PER_MEBIBYTE,
      memoryCacheOverflow: maximumCacheOverflowBytes / BYTES_PER_MEBIBYTE,
      memoryAdjustedScreenSpaceError:
        suppliedOptions.memoryAdjustedScreenSpaceError ?? usesTiles3DCacheDefaults
    };
    this.loadOptions = this.options.loadOptions || {};
    this.source = source;

    this.tileset = null;
    this.loader = this.source.loader;
    this.type = this.source.type;
    this.url = this.source.url;
    this.basePath = this.source.basePath;
    this.modelMatrix = this.options.modelMatrix;
    this.ellipsoid = this.options.ellipsoid;
    this.lodMetricType = '';
    this.lodMetricValue = 0;
    this.refine = '';
    this.contentFormats = this.source.contentFormats;

    this._traverser = this._initializeTraverser();
    this._requestScheduler = new RequestScheduler({
      throttleRequests: this.options.throttleRequests,
      maxRequests: this.options.maxRequests
    });

    this.memoryAdjustedScreenSpaceError = this.options.maximumScreenSpaceError;
    this._cacheBytes = cacheBytes;
    this._maximumCacheOverflowBytes = maximumCacheOverflowBytes;
    const metadata = this._getSourceMetadata();
    if (metadata) {
      this.spatialReference = applyTilesetSpatialOptions(
        metadata.spatialReference,
        this.options.spatial
      );
    }

    this.stats = new Stats({id: this.url});
    this._initializeStats();

    this.tilesetInitializationPromise = this._initializeTileSet();
  }

  destroy(): void {
    this._clearDeferredTraversal();
    this.source.destroy?.();
    this._destroy();
  }

  isLoaded(): boolean {
    return this._pendingCount === 0 && this._frameNumber !== 0 && this._requestedTiles.length === 0;
  }

  get tiles(): object[] {
    return Object.values(this._tiles);
  }

  get frameNumber(): number {
    return this._frameNumber;
  }

  /**
   * Gets or sets the soft target, in bytes, for cached tile content not needed this frame.
   *
   * Current-frame tiles remain protected even when their estimated memory exceeds this target.
   * Reducing the value makes unused least-recently-used tiles eligible for eviction on the next
   * traversal.
   * @default 536870912 for 3D Tiles; 33554432 for I3S
   */
  get cacheBytes(): number {
    return this._cacheBytes;
  }

  set cacheBytes(value: number) {
    this._cacheBytes = validateCacheByteLength(value, 'cacheBytes');
    this.options.cacheBytes = this._cacheBytes;
    this.options.maximumMemoryUsage = this._cacheBytes / BYTES_PER_MEBIBYTE;
  }

  /**
   * Gets or sets the additional current-frame headroom, in bytes, before memory-adjusted SSE rises.
   *
   * The pressure ceiling is `cacheBytes + maximumCacheOverflowBytes`. This value does not change
   * the base target used to evict tiles that were not touched in the current frame.
   * @default 536870912 for 3D Tiles; 1048576 for I3S
   */
  get maximumCacheOverflowBytes(): number {
    return this._maximumCacheOverflowBytes;
  }

  set maximumCacheOverflowBytes(value: number) {
    this._maximumCacheOverflowBytes = validateCacheByteLength(value, 'maximumCacheOverflowBytes');
    this.options.maximumCacheOverflowBytes = this._maximumCacheOverflowBytes;
    this.options.memoryCacheOverflow = this._maximumCacheOverflowBytes / BYTES_PER_MEBIBYTE;
  }

  /**
   * Gets or sets the soft cache target in mebibytes.
   * @deprecated Use {@link Tileset3D.cacheBytes}. Assignments remain synchronized for compatibility.
   */
  get maximumMemoryUsage(): number {
    return this.cacheBytes / BYTES_PER_MEBIBYTE;
  }

  set maximumMemoryUsage(value: number) {
    this.cacheBytes = validateCacheByteLength(value * BYTES_PER_MEBIBYTE, 'maximumMemoryUsage');
  }

  get queryParams(): string {
    const rootUrl = this.source.getTileUrl(this.url);
    const queryIndex = rootUrl.indexOf('?');
    return queryIndex >= 0 ? rootUrl.slice(queryIndex + 1) : '';
  }

  /**
   * Updates traversal and runtime options, synchronizing byte-native and deprecated cache values.
   *
   * For each budget, the byte-native option takes precedence when both unit forms are supplied.
   * Unspecified budgets retain their current byte values, avoiding repeated MiB conversion.
   *
   * @param props - Partial runtime options to apply.
   */
  setProps(props: Tileset3DProps): void {
    const cacheBytes = resolveCacheBytes(props, this.cacheBytes);
    const maximumCacheOverflowBytes = resolveMaximumCacheOverflowBytes(
      props,
      this.maximumCacheOverflowBytes
    );
    this.options = {
      ...this.options,
      ...props,
      cacheBytes,
      maximumCacheOverflowBytes,
      maximumMemoryUsage: cacheBytes / BYTES_PER_MEBIBYTE,
      memoryCacheOverflow: maximumCacheOverflowBytes / BYTES_PER_MEBIBYTE
    };
    this._cacheBytes = cacheBytes;
    this._maximumCacheOverflowBytes = maximumCacheOverflowBytes;
  }

  getTileUrl(tilePath: string): string {
    return this.source.getTileUrl(tilePath);
  }

  hasExtension(extensionName: string): boolean {
    return Boolean(this.source.hasExtension?.(extensionName));
  }

  update(viewports: Viewport[] | Viewport | null = null): void {
    this.tilesetInitializationPromise.then(() => {
      if (!viewports && this.lastUpdatedVieports) {
        viewports = this.lastUpdatedVieports;
      } else {
        this.lastUpdatedVieports = viewports;
      }
      if (viewports) {
        this.doUpdate(viewports);
      }
    });
  }

  async selectTiles(viewports: Viewport[] | Viewport | null = null): Promise<number> {
    await this.tilesetInitializationPromise;
    if (viewports) {
      this.lastUpdatedVieports = viewports;
    }
    if (!this.updatePromise) {
      this.updatePromise = new Promise<number>(resolve => {
        setTimeout(() => {
          if (this.lastUpdatedVieports) {
            this.doUpdate(this.lastUpdatedVieports);
          }
          resolve(this._frameNumber);
          this.updatePromise = null;
        }, this.options.debounceTime);
      });
    }
    return this.updatePromise;
  }

  /**
   * Moves the active LOD threshold toward the configured SSE or away from cache pressure.
   *
   * Usage below {@link Tileset3D.cacheBytes} restores quality in two-percent steps. Usage above
   * `cacheBytes + maximumCacheOverflowBytes` reduces refinement in two-percent steps. Values in
   * the overflow window leave the threshold unchanged, preventing rapid load/evict oscillation.
   */
  adjustScreenSpaceError(): void {
    if (this.gpuMemoryUsageInBytes < this.cacheBytes) {
      this.memoryAdjustedScreenSpaceError = Math.max(
        this.memoryAdjustedScreenSpaceError / 1.02,
        this.options.maximumScreenSpaceError
      );
    } else if (this.gpuMemoryUsageInBytes > this.cacheBytes + this.maximumCacheOverflowBytes) {
      this.memoryAdjustedScreenSpaceError *= 1.02;
    }
  }

  private doUpdate(viewports: Viewport[] | Viewport): void {
    if ('loadTiles' in this.options && !this.options.loadTiles) {
      return;
    }
    if (this.traverseCounter > 0) {
      return;
    }
    const preparedViewports = viewports instanceof Array ? viewports : [viewports];

    this._cache.reset();
    this._frameNumber++;
    this.traverseCounter = preparedViewports.length;
    const currentTime = Date.now();
    let minimumDeferredTraversalDelay = Number.POSITIVE_INFINITY;
    const viewportsToTraverse: string[] = [];
    for (const viewport of preparedViewports) {
      const id = viewport.id;
      if (this._needTraverse(id)) {
        viewportsToTraverse.push(id);
      } else {
        this.traverseCounter--;
      }
    }

    for (const viewport of preparedViewports) {
      const id = viewport.id;
      if (!this.roots[id]) {
        this.roots[id] = this._initializeTileHeaders(this.tileset, null);
      }

      if (!viewportsToTraverse.includes(id)) {
        continue;
      }
      const frameState = getFrameState(viewport as GeospatialViewport, this._frameNumber);
      const root = this.roots[id];
      const cameraMotionUpdate = updateCameraMotionState(
        this._cameraMotionStates[id],
        frameState.camera.position,
        frameState.camera.direction,
        currentTime
      );
      this._cameraMotionStates[id] = cameraMotionUpdate.state;
      frameState.camera.timeSinceMovement = cameraMotionUpdate.timeSinceMovement;
      // Dynamic SSE reads the root's inverse computed transform before traversal updates tile
      // visibility. Refresh it from the current tileset model matrix here so animated local
      // box/sphere tilesets never calculate their height falloff one transform behind the frame.
      updateRootTransformForDynamicScreenSpaceError(root, this.modelMatrix);
      frameState.dynamicScreenSpaceErrorDensity =
        this.type === TILESET_TYPE.TILES3D &&
        this.options.dynamicScreenSpaceError &&
        !frameState.viewport.orthographic
          ? calculateDynamicScreenSpaceErrorDensity(root, frameState, this.options)
          : 0;
      // Keep the legacy diagnostic field, but traversal reads the per-viewport frame value above.
      this.dynamicScreenSpaceErrorComputedDensity = frameState.dynamicScreenSpaceErrorDensity;
      this._traverser.traverse(root, frameState, this.options);
      if (Object.keys(this._traverser.deferredTiles).length > 0) {
        minimumDeferredTraversalDelay = Math.min(
          minimumDeferredTraversalDelay,
          Math.max(this.options.foveatedTimeDelay - cameraMotionUpdate.timeSinceMovement, 0)
        );
      }
    }

    if (Number.isFinite(minimumDeferredTraversalDelay)) {
      this._scheduleDeferredTraversal(minimumDeferredTraversalDelay);
    } else {
      this._clearDeferredTraversal();
    }
  }

  /**
   * Schedules one follow-up traversal when the moving-camera deferral window expires.
   *
   * Replacing an existing timer ensures continuing camera movement pushes the retry window forward
   * instead of creating a queue of redundant traversals.
   *
   * @param delayInSeconds - Remaining stationary delay before deferred requests become eligible.
   */
  private _scheduleDeferredTraversal(delayInSeconds: number): void {
    this._clearDeferredTraversal();
    this._deferredTraversalTimeout = setTimeout(
      () => {
        this._deferredTraversalTimeout = null;
        this.selectTiles().catch((error: unknown) => {
          const traversalError = error instanceof Error ? error : new Error(String(error));
          this._onTilesetError(traversalError);
        });
      },
      Math.max(delayInSeconds * 1000, 0)
    );
  }

  /** Clears a pending moving-camera follow-up traversal. */
  private _clearDeferredTraversal(): void {
    if (this._deferredTraversalTimeout !== null) {
      clearTimeout(this._deferredTraversalTimeout);
      this._deferredTraversalTimeout = null;
    }
  }

  _needTraverse(viewportId: string): boolean {
    let traverserId = viewportId;
    if (this.options.viewportTraversersMap) {
      traverserId = this.options.viewportTraversersMap[viewportId];
    }
    return traverserId === viewportId;
  }

  _onTraversalEnd(frameState: FrameState): void {
    const id = frameState.viewport.id;
    if (!this.frameStateData[id]) {
      this.frameStateData[id] = {selectedTiles: [], _requestedTiles: [], _emptyTiles: []};
    }
    const currentFrameStateData = this.frameStateData[id];
    const selectedTiles = Object.values(this._traverser.selectedTiles);
    const [filteredSelectedTiles, unselectedTiles] = limitSelectedTiles(
      selectedTiles,
      frameState,
      this.options.maximumTilesSelected
    );
    currentFrameStateData.selectedTiles = filteredSelectedTiles;
    for (const tile of unselectedTiles) {
      tile.unselect();
    }

    currentFrameStateData._requestedTiles = Object.values(this._traverser.requestedTiles);
    currentFrameStateData._emptyTiles = Object.values(this._traverser.emptyTiles);

    this.traverseCounter--;
    if (this.traverseCounter > 0) {
      return;
    }

    this._updateTiles();
  }

  _updateTiles(): void {
    const previousSelectedTiles = this.selectedTiles;
    this.selectedTiles = [];
    this._requestedTiles = [];
    this._emptyTiles = [];

    for (const frameStateKey in this.frameStateData) {
      const frameStateDataValue = this.frameStateData[frameStateKey];
      this.selectedTiles = this.selectedTiles.concat(frameStateDataValue.selectedTiles);
      this._requestedTiles = this._requestedTiles.concat(frameStateDataValue._requestedTiles);
      this._emptyTiles = this._emptyTiles.concat(frameStateDataValue._emptyTiles);
    }

    this.selectedTiles = this.options.onTraversalComplete(this.selectedTiles);

    const selectedIds = new Set(this.selectedTiles.map(tile => tile.id));
    const hasUndrawnTiles = this.selectedTiles.some(tile => !tile.tileDrawn);

    let heldBackCount = 0;
    if (hasUndrawnTiles) {
      for (const tileId of selectedIds) {
        this._heldTiles.add(tileId);
      }
      for (const tileId of this._heldTiles) {
        if (selectedIds.has(tileId)) continue;

        const tile = this._tiles[tileId];
        if (tile && tile.contentAvailable) {
          tile._selectedFrame = this._frameNumber;
          this.selectedTiles.push(tile);
          heldBackCount++;
        } else {
          this._heldTiles.delete(tileId);
        }
      }
    } else {
      this._heldTiles = selectedIds;
    }

    if (heldBackCount > 0) {
      setTimeout(() => {
        this.selectTiles();
      }, 0);
    }

    for (const tile of this.selectedTiles) {
      this._tiles[tile.id] = tile;
    }

    this._loadTiles();
    this._unloadTiles();
    this._updateStats();

    if (this._tilesChanged(previousSelectedTiles, this.selectedTiles)) {
      this.options.onUpdate();
    }
  }

  _tilesChanged(oldSelectedTiles: Tile3D[], selectedTiles: Tile3D[]): boolean {
    if (oldSelectedTiles.length !== selectedTiles.length) {
      return true;
    }
    const oldSet = new Set(oldSelectedTiles.map(tile => tile.id));
    const newSet = new Set(selectedTiles.map(tile => tile.id));
    let changed = oldSelectedTiles.some(tile => !newSet.has(tile.id));
    changed = changed || selectedTiles.some(tile => !oldSet.has(tile.id));
    return changed;
  }

  _loadTiles(): void {
    this._requestedTiles.sort((tileA, tileB) => tileA._priority - tileB._priority);
    for (const tile of this._requestedTiles) {
      if (tile.contentUnloaded) {
        this._loadTile(tile);
      }
    }
  }

  _unloadTiles(): void {
    this._cache.unloadTiles(this, (tileset, tile) => tileset._unloadTile(tile));
    if (this.options.memoryAdjustedScreenSpaceError) {
      this.adjustScreenSpaceError();
    }
  }

  _updateStats(): void {
    let tilesRenderable = 0;
    let pointsRenderable = 0;
    for (const tile of this.selectedTiles) {
      if (tile.contentAvailable && tile.content) {
        tilesRenderable++;
        const contents = tile.contents.length ? tile.contents : [tile.content];
        for (const content of contents) {
          if (content.pointCount) {
            pointsRenderable += content.pointCount;
          } else {
            pointsRenderable += content.vertexCount || 0;
          }
        }
      }
    }

    this.stats.get(TILES_IN_VIEW).count = this.selectedTiles.length;
    this.stats.get(TILES_RENDERABLE).count = tilesRenderable;
    this.stats.get(POINTS_COUNT).count = pointsRenderable;
    this.stats.get(MAXIMUM_SSE).count = this.memoryAdjustedScreenSpaceError;
  }

  async _initializeTileSet(): Promise<void> {
    try {
      const initializePromise = this.source.initialize();
      const initialMetadata = this._getSourceMetadata();
      if (initialMetadata) {
        this._syncSourceState(initialMetadata);
      }
      if (
        initialMetadata?.tileset?.root &&
        typeof initialMetadata.tileset.root.then !== 'function' &&
        !this.source.prepareTileset
      ) {
        this.root = this._initializeTileHeaders(initialMetadata.tileset, null);
        this._applyViewState();
      }

      await initializePromise;
      const metadata = this.source.getMetadata();
      this._syncSourceState(metadata);
      await this.source.prepareTileset?.(this);
      if (!this.root) {
        this.root = this._initializeTileHeaders(metadata.tileset, null);
      }
      this._applyViewState();
    } catch (error: unknown) {
      const sourceError = error instanceof Error ? error : new Error(String(error));
      this._onSourceError(sourceError, this.root);
      this._onTilesetError(sourceError);
      throw sourceError;
    }
  }

  _initializeStats(): void {
    this.stats.get(TILES_TOTAL);
    this.stats.get(TILES_LOADING);
    this.stats.get(TILES_IN_MEMORY);
    this.stats.get(TILES_IN_VIEW);
    this.stats.get(TILES_RENDERABLE);
    this.stats.get(TILES_LOADED);
    this.stats.get(TILES_UNLOADED);
    this.stats.get(TILES_LOAD_FAILED);
    this.stats.get(POINTS_COUNT);
    this.stats.get(TILES_GPU_MEMORY, 'memory');
    this.stats.get(MAXIMUM_SSE);
  }

  _initializeTileHeaders(tilesetJson: TilesetJSON, parentTileHeader?: Tile3D | null): Tile3D {
    return this.source.initializeTileHeaders(this, tilesetJson, parentTileHeader);
  }

  _initializeTraverser(): TilesetTraverser {
    return this.source.createTraverser({
      basePath: this.basePath,
      onTraversalEnd: this._onTraversalEnd.bind(this)
    });
  }

  _destroyTileHeaders(parentTile: Tile3D): void {
    this._destroySubtree(parentTile);
  }

  async _loadTile(tile: Tile3D): Promise<void> {
    let loadResult: TileContentLoadResult | null = null;
    try {
      this._onStartTileLoading();
      loadResult = await tile.loadContent();
    } catch (error: unknown) {
      const tileError = error instanceof Error ? error : new Error('load failed');
      this._onSourceError(tileError, tile);
      this._onTileLoadError(tile, tileError);
    } finally {
      this._onEndTileLoading();
      this._onTileLoad(tile, loadResult);
    }
  }

  /**
   * Loads a source-managed lazy child-header group and reports failures through tile callbacks.
   *
   * Subtree metadata shares the normal loading counters but is not reported as render content and
   * is not added to the GPU cache. Traversal is notified separately after the promise settles.
   *
   * @param tile - Runtime tile that owns the lazy subtree reference.
   * @param frameState - View state that made the subtree eligible for refinement.
   */
  async _loadTileChildren(tile: Tile3D, frameState: FrameState): Promise<void> {
    try {
      this._onStartTileLoading();
      await tile.loadChildren(frameState);
    } catch (error: unknown) {
      const tileError = error instanceof Error ? error : new Error('subtree load failed');
      this._onSourceError(tileError, tile);
      this._onTileLoadError(tile, tileError);
    } finally {
      this._onEndTileLoading();
    }
  }

  _onTileLoadError(tile: Tile3D, error: Error): void {
    this.stats.get(TILES_LOAD_FAILED).incrementCount();

    const message = error.message || error.toString();
    const url = tile.url;
    console.error(`A 3D tile failed to load: ${tile.url} ${message}`);
    this.options.onTileError(tile, message, url);
  }

  _onSourceError(error: Error, tile: Tile3D | null = null): void {
    this.options.onSourceError(error, this.source, tile);
  }

  _onTilesetError(error: Error): void {
    this.options.onTilesetError(error, this);
  }

  _onTileLoad(tile: Tile3D, loadResult: TileContentLoadResult | null): void {
    if (!loadResult?.loaded) {
      return;
    }

    if (tile.content) {
      calculateTransformProps(tile, tile.content);
    }

    this.source.onTileLoaded?.(this, tile, loadResult);
    this._syncSourceState(this.source.getMetadata());

    const totalTiles = this.source.getTilesTotalCount?.();
    if (totalTiles) {
      this.stats.get(TILES_TOTAL).reset();
      this.stats.get(TILES_TOTAL).addCount(totalTiles);
    }

    this._addTileToCache(tile);
    this.options.onTileLoad(tile);
  }

  _onStartTileLoading(): void {
    this._pendingCount++;
    this.stats.get(TILES_LOADING).incrementCount();
  }

  _onEndTileLoading(): void {
    this._pendingCount--;
    this.stats.get(TILES_LOADING).decrementCount();
  }

  _addTileToCache(tile: Tile3D): void {
    this._cache.add(this, tile, tileset => tileset._updateCacheStats(tile));
  }

  _updateCacheStats(tile: Tile3D): void {
    this.stats.get(TILES_LOADED).incrementCount();
    this.stats.get(TILES_IN_MEMORY).incrementCount();

    this.gpuMemoryUsageInBytes += tile.gpuMemoryUsageInBytes || 0;
    this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;

    if (this.options.memoryAdjustedScreenSpaceError) {
      this.adjustScreenSpaceError();
    }
  }

  _unloadTile(tile: Tile3D): void {
    this.gpuMemoryUsageInBytes -= tile.gpuMemoryUsageInBytes || 0;

    this.stats.get(TILES_IN_MEMORY).decrementCount();
    this.stats.get(TILES_UNLOADED).incrementCount();
    this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;

    this.options.onTileUnload(tile);
    tile.unloadContent();
  }

  _destroy(): void {
    const stack: Tile3D[] = [];

    if (this.root) {
      stack.push(this.root);
    }

    while (stack.length > 0) {
      const tile = stack.pop() as Tile3D;

      for (const child of tile.children) {
        stack.push(child);
      }

      this._destroyTile(tile);
    }
    this.root = null;
  }

  _destroySubtree(tile: Tile3D): void {
    const rootTile = tile;
    const stack: Tile3D[] = [rootTile];
    while (stack.length > 0) {
      tile = stack.pop() as Tile3D;
      for (const child of tile.children) {
        stack.push(child);
      }
      if (tile !== rootTile) {
        this._destroyTile(tile);
      }
    }
    rootTile.children = [];
  }

  _destroyTile(tile: Tile3D): void {
    this._cache.unloadTile(this, tile);
    this._unloadTile(tile);
    tile.destroy();
  }

  private _syncSourceState(metadata: TilesetSourceMetadata): void {
    this.tileset = metadata.tileset;
    this.loader = metadata.loader;
    this.type = metadata.type;
    this.url = metadata.url;
    this.basePath = metadata.basePath;
    this.lodMetricType = metadata.lodMetricType;
    this.lodMetricValue = metadata.lodMetricValue;
    this.refine = metadata.refine;
    this.contentFormats = this.source.contentFormats;
    this.asset = this.source.asset || this.asset;
    const tileset = metadata.tileset as Record<string, any>;
    this.schema = tileset.schema || null;
    this.schemaUri = tileset.schemaUri || null;
    this.groups = tileset.groups || [];
    this.metadata = tileset.metadata || null;
    this.statistics = tileset.statistics ?? null;
    const spatialReference = applyTilesetSpatialOptions(
      metadata.spatialReference,
      this.options.spatial
    );
    this.spatialReference = preserveTransformedSpatialReference(
      this.spatialReference,
      spatialReference
    );
    this.properties = this.source.properties ?? this.properties;
    this.extras = this.source.extras ?? this.extras;
    if (this.options.attributions?.length) {
      this.credits = {attributions: this.options.attributions};
    } else {
      this.credits = this.source.credits || this.credits;
    }
  }

  private _applyViewState(): void {
    const viewState = this.source.getViewState(this.root);
    this.asset = viewState.asset || this.source.asset || {};
    this.properties = viewState.properties ?? this.source.properties;
    this.extras = viewState.extras ?? this.source.extras ?? null;
    this.credits = viewState.credits ||
      this.source.credits ||
      this.credits || {attributions: this.options.attributions || []};
    this.description = viewState.description || this.options.description || '';
    this.boundingVolume = viewState.boundingVolume || this.root?.boundingVolume || null;
    this.cartographicCenter = viewState.cartographicCenter || new Vector3();
    this.cartesianCenter = viewState.cartesianCenter || null;
    this.zoom = viewState.zoom || 1;
    this.geometricError = this.tileset?.geometricError || 0;
  }

  /**
   * Returns normalized source metadata when initialization has already populated it.
   */
  private _getSourceMetadata(): TilesetSourceMetadata | null {
    try {
      return this.source.getMetadata();
    } catch {
      return null;
    }
  }
}

/** Preserve a completed runtime operation when asynchronous source metadata describes the same request. */
function preserveTransformedSpatialReference(
  current: TilesetSpatialReference,
  next: TilesetSpatialReference
): TilesetSpatialReference {
  return current?.status === 'transformed' &&
    current.sourceCrs === next.sourceCrs &&
    current.targetCrs === next.targetCrs &&
    current.targetHeightReference === next.targetHeightReference &&
    current.outputCoordinates === next.outputCoordinates
    ? current
    : next;
}
