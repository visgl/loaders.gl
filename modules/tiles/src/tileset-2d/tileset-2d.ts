// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {RequestScheduler, type TileSource, type TileSourceMetadata} from '@loaders.gl/loader-utils';
import type {Matrix4} from '@math.gl/core';
import {Stats} from '@probe.gl/stats';
import {SharedTile2DHeader} from './tile-2d-header';
import type {Tileset2DAdapter, Tileset2DTileContext} from './adapter';
import type {TileIndex, TileLoadProps, ZRange} from './types';

/** Never show ancestor or descendant placeholder tiles. */
export const STRATEGY_NEVER = 'never';
/** Prefer non-overlapping loaded tiles while replacements stream in. */
export const STRATEGY_REPLACE = 'no-overlap';
/** Prefer the best currently available loaded ancestor or descendant tiles. */
export const STRATEGY_DEFAULT = 'best-available';

/** Function form of a refinement strategy. */
export type RefinementStrategyFunction = (tiles: SharedTile2DHeader[]) => void;

/** Strategy controlling how parent and child placeholder tiles are displayed while content loads. */
export type RefinementStrategy =
  | typeof STRATEGY_NEVER
  | typeof STRATEGY_REPLACE
  | typeof STRATEGY_DEFAULT
  | RefinementStrategyFunction;

/** Core configuration shared by all {@link Tileset2D} instances. */
export type Tileset2DBaseProps<DataT = any, ViewStateT = unknown> = {
  /** Callback used to load tile payloads. */
  getTileData: (props: TileLoadProps) => Promise<DataT | null> | DataT | null;
  /** Adapter used to compute tile traversal and tile metadata. */
  adapter?: Tileset2DAdapter<ViewStateT> | null;
  /** Bounding box limiting tile generation. */
  extent?: number[] | null;
  /** Tile size in pixels. */
  tileSize?: number;
  /** Maximum zoom level to request. */
  maxZoom?: number | null;
  /** Minimum zoom level to request. */
  minZoom?: number | null;
  /** Maximum number of tiles kept in cache. */
  maxCacheSize?: number | null;
  /** Maximum bytes kept in cache. */
  maxCacheByteSize?: number | null;
  /** Placeholder refinement strategy. */
  refinementStrategy?: RefinementStrategy;
  /** Elevation range used by geospatial tile selection. */
  zRange?: ZRange | null;
  /** Maximum concurrent tile requests. */
  maxRequests?: number;
  /** Debounce interval applied before issuing queued requests. */
  debounceTime?: number;
  /** Integer zoom offset applied when choosing tile levels. */
  zoomOffset?: number;
  /** Callback fired when a tile loads successfully. */
  onTileLoad?: (tile: SharedTile2DHeader<DataT>) => void;
  /** Callback fired when a tile is evicted from cache. */
  onTileUnload?: (tile: SharedTile2DHeader<DataT>) => void;
  /** Callback fired when a tile request fails. */
  onTileError?: (err: any, tile: SharedTile2DHeader<DataT>) => void;
};

/** Options for creating a shared tile cache that can be reused by multiple layers and views. */
export type Tileset2DProps<DataT = any, ViewStateT = unknown> = Omit<
  Tileset2DBaseProps<DataT, ViewStateT>,
  'getTileData'
> & {
  /** Optional tile loader used when not sourcing data from a loaders.gl TileSource. */
  getTileData?: (props: TileLoadProps) => Promise<DataT | null> | DataT | null;
  /** Optional loaders.gl TileSource backing this shared tileset. */
  tileSource?: TileSource | null;
};

/** Subscription callbacks emitted by {@link Tileset2D}. */
export type Tile2DListener<DataT = any> = {
  /** Fired after a tile loads successfully. */
  onTileLoad?: (tile: SharedTile2DHeader<DataT>) => void;
  /** Fired after a tile request fails. */
  onTileError?: (error: any, tile: SharedTile2DHeader<DataT>) => void;
  /** Fired after a tile is evicted from cache. */
  onTileUnload?: (tile: SharedTile2DHeader<DataT>) => void;
  /** Fired when metadata or effective configuration changes. */
  onUpdate?: () => void;
  /** Fired when asynchronous metadata initialization fails. */
  onError?: (error: Error) => void;
  /** Fired after live tileset counters are recomputed. */
  onStatsChange?: (stats: Stats) => void;
};

type ConsumerState<DataT = any> = {
  selectedTiles: Set<SharedTile2DHeader<DataT>>;
  visibleTiles: Set<SharedTile2DHeader<DataT>>;
};

const DEFAULT_TILESET2D_PROPS: Omit<Required<Tileset2DProps>, 'getTileData'> = {
  adapter: null,
  extent: null,
  tileSize: 512,
  maxZoom: null,
  minZoom: null,
  maxCacheSize: 100,
  maxCacheByteSize: null,
  refinementStrategy: STRATEGY_DEFAULT,
  zRange: null,
  maxRequests: 6,
  debounceTime: 0,
  zoomOffset: 0,
  onTileLoad: () => {},
  onTileUnload: () => {},
  onTileError: () => {},
  tileSource: null
};

/** Shared tile cache and loading engine for one or more consumers. */
export class Tileset2D<DataT = any, ViewStateT = unknown> {
  /** Live counters describing shared tileset state. */
  readonly stats: Stats;
  /** Cached metadata returned by the backing TileSource, if any. */
  sourceMetadata: TileSourceMetadata | null = null;

  protected opts: Required<Tileset2DProps<DataT, ViewStateT>>;

  private _requestScheduler: RequestScheduler;
  private _cache: Map<string, SharedTile2DHeader<DataT>>;
  private _dirty: boolean;
  private _tiles: SharedTile2DHeader<DataT>[];
  private _cacheByteSize: number;
  private _unloadedTileCount: number;
  private _listeners = new Set<Tile2DListener<DataT>>();
  private _consumers = new Map<symbol, ConsumerState<DataT>>();
  private _explicitOptionKeys = new Set<string>();
  private _baseOpts: Partial<Tileset2DProps<DataT, ViewStateT>> = {};
  private _sourceMetadataOverrides: Partial<Tileset2DProps<DataT, ViewStateT>> = {};
  private _maxZoom?: number;
  private _minZoom?: number;
  private _lastTileContext: Tileset2DTileContext<ViewStateT> | null = null;

  /** Creates a tileset from either `getTileData` or a loaders.gl `TileSource`. */
  constructor(opts: Tileset2DProps<DataT, ViewStateT>) {
    this.stats = new Stats({
      id: 'Tileset2D',
      stats: [
        {name: 'Tiles In Cache'},
        {name: 'Cache Size'},
        {name: 'Visible Tiles'},
        {name: 'Selected Tiles'},
        {name: 'Loading Tiles'},
        {name: 'Unloaded Tiles'},
        {name: 'Consumers'}
      ]
    });
    this.opts = {
      ...DEFAULT_TILESET2D_PROPS,
      ...opts,
      getTileData: opts.getTileData || (() => null),
      tileSource: opts.tileSource
    } as Required<Tileset2DProps<DataT, ViewStateT>>;

    this._requestScheduler = new RequestScheduler({
      throttleRequests: this.opts.maxRequests > 0 || this.opts.debounceTime > 0,
      maxRequests: this.opts.maxRequests,
      debounceTime: this.opts.debounceTime
    });

    this._cache = new Map();
    this._tiles = [];
    this._dirty = false;
    this._cacheByteSize = 0;
    this._unloadedTileCount = 0;

    if (!this.opts.tileSource && !opts.getTileData) {
      throw new Error('Tileset2D requires either `getTileData` or `tileSource`.');
    }

    this.setOptions(opts);
    this._updateStats();

    if (this.opts.tileSource) {
      this._initializeTileSource(this.opts.tileSource).catch(() => {});
    }
  }

  /** Convenience factory for wrapping a loaders.gl `TileSource`. */
  static fromTileSource<DataT = any>(
    tileSource: TileSource,
    opts: Omit<Tileset2DProps<DataT>, 'tileSource' | 'getTileData'> = {}
  ): Tileset2D<DataT> {
    return new Tileset2D<DataT>({...opts, tileSource});
  }

  /** All tiles currently present in the shared cache. */
  get tiles(): SharedTile2DHeader<DataT>[] {
    return this._tiles;
  }

  /** Estimated byte size of all tile content currently retained in cache. */
  get cacheByteSize(): number {
    return this._cacheByteSize;
  }

  /** Union of tiles selected by all attached consumers. */
  get selectedTiles(): SharedTile2DHeader<DataT>[] {
    return Array.from(this._getSelectedTilesUnion());
  }

  /** Union of tiles contributing to the visible result across all consumers and views. */
  get visibleTiles(): SharedTile2DHeader<DataT>[] {
    const union = this._getVisibleTilesUnion();
    for (const tile of this._getSelectedTilesUnion()) {
      union.add(tile);
    }
    return Array.from(union);
  }

  /** Tiles currently loading anywhere in the shared cache. */
  get loadingTiles(): SharedTile2DHeader<DataT>[] {
    return Array.from(this._cache.values()).filter(tile => tile.isLoading);
  }

  /** Tiles retained in cache that do not currently have loaded content. */
  get unloadedTiles(): SharedTile2DHeader<DataT>[] {
    return Array.from(this._cache.values()).filter(tile => !tile.isLoaded);
  }

  /** Maximum resolved zoom level after applying metadata and explicit options. */
  get maxZoom(): number | undefined {
    return this._maxZoom;
  }

  /** Minimum resolved zoom level after applying metadata and explicit options. */
  get minZoom(): number | undefined {
    return this._minZoom;
  }

  /** Active refinement strategy for placeholder handling. */
  get refinementStrategy(): RefinementStrategy {
    return this.opts.refinementStrategy || STRATEGY_DEFAULT;
  }

  /** Adapter currently used for traversal and tile metadata. */
  get adapter(): Tileset2DAdapter<ViewStateT> | null {
    return this.opts.adapter;
  }

  /** Subscribes to tileset lifecycle events. */
  subscribe(listener: Tile2DListener<DataT>): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Registers a consumer so cache pruning can account for its selected tiles. */
  attachConsumer(id: symbol): void {
    this._consumers.set(id, {selectedTiles: new Set(), visibleTiles: new Set()});
    this._updateStats();
  }

  /** Unregisters a consumer and prunes unused requests and tiles. */
  detachConsumer(id: symbol): void {
    this._consumers.delete(id);
    this._pruneRequests();
    this._resizeCache();
    this._updateStats();
  }

  /** Updates tileset options and reapplies TileSource metadata overrides. */
  setOptions(opts: Partial<Tileset2DProps<DataT, ViewStateT>>): void {
    this._rememberExplicitOptions(opts);
    this._baseOpts = {...this._baseOpts, ...opts};
    this._applyResolvedOptions();
  }

  /** Aborts in-flight requests and clears the shared cache. */
  finalize(): void {
    for (const tile of this._cache.values()) {
      if (tile.isLoading) {
        tile.abort();
      }
    }
    this._cache.clear();
    this._tiles = [];
    this._consumers.clear();
    this._cacheByteSize = 0;
    this._unloadedTileCount = 0;
    this._updateStats();
  }

  /** Marks all retained tiles stale and drops unused cached tiles. */
  reloadAll(): void {
    const selectedTiles = this._getSelectedTilesUnion();
    for (const id of this._cache.keys()) {
      const tile = this._cache.get(id);
      if (tile && !selectedTiles.has(tile)) {
        this._cache.delete(id);
      } else if (tile) {
        tile.setNeedsReload();
      }
    }
    this._cacheByteSize = this._getCacheByteSize();
    this.prepareTiles();
    this._updateStats();
  }

  /** Updates the selected and visible tile sets for one consumer. */
  updateConsumer(
    id: symbol,
    selectedTiles: SharedTile2DHeader<DataT>[],
    visibleTiles: SharedTile2DHeader<DataT>[]
  ): void {
    this._consumers.set(id, {
      selectedTiles: new Set(selectedTiles),
      visibleTiles: new Set(visibleTiles)
    });
    this._pruneRequests();
    this._resizeCache();
    this._updateStats();
  }

  /** Rebuilds parent/child links if the cache changed since the last traversal. */
  prepareTiles(): void {
    if (this._dirty) {
      this._rebuildTree();
      this._syncTiles();
      this._dirty = false;
    }
  }

  /** Returns tile indices needed to cover a viewport. */
  getTileIndices({
    viewState,
    maxZoom,
    minZoom,
    zRange,
    modelMatrix,
    modelMatrixInverse
  }: {
    viewState: ViewStateT;
    maxZoom?: number;
    minZoom?: number;
    zRange: ZRange | null;
    modelMatrix?: Matrix4 | null;
    modelMatrixInverse?: Matrix4 | null;
  }): TileIndex[] {
    const {adapter, tileSize, extent, zoomOffset} = this.opts;
    if (!adapter) {
      throw new Error('Tileset2D requires an adapter before tile traversal can be used.');
    }
    this._lastTileContext = {viewState, tileSize};
    return adapter.getTileIndices({
      viewState,
      maxZoom,
      minZoom,
      zRange,
      tileSize,
      extent: normalizeBounds(extent),
      modelMatrix,
      modelMatrixInverse,
      zoomOffset
    });
  }

  /** Returns the stable cache id for a tile index. */
  getTileId(index: TileIndex): string {
    return `${index.x}-${index.y}-${index.z}`;
  }

  /** Returns the zoom level represented by a tile index. */
  getTileZoom(index: TileIndex): number {
    return index.z;
  }

  /** Returns derived metadata used to initialize a tile header. */
  getTileMetadata(index: TileIndex): Record<string, any> {
    if (!this._lastTileContext) {
      throw new Error('Tileset2D metadata requested before traversal context was set.');
    }
    if (!this.opts.adapter) {
      throw new Error('Tileset2D requires an adapter before tile metadata can be derived.');
    }
    return {bbox: this.opts.adapter.getTileBoundingBox(this._lastTileContext, index)};
  }

  /** Returns the parent tile index in the quadtree. */
  getParentIndex(index: TileIndex): TileIndex {
    return {x: Math.floor(index.x / 2), y: Math.floor(index.y / 2), z: index.z - 1};
  }

  /** Returns a cached tile and optionally creates and loads it on demand. */
  getTile(index: TileIndex, create: true): SharedTile2DHeader<DataT>;
  getTile(index: TileIndex, create?: false): SharedTile2DHeader<DataT> | undefined;
  getTile(index: TileIndex, create?: boolean): SharedTile2DHeader<DataT> | undefined {
    const id = this.getTileId(index);
    let tile = this._cache.get(id);
    let needsReload = false;

    if (!tile && create) {
      tile = new SharedTile2DHeader(index);
      Object.assign(tile, this.getTileMetadata(tile.index));
      Object.assign(tile, {id, zoom: this.getTileZoom(tile.index)});
      needsReload = true;
      this._cache.set(id, tile);
      this._dirty = true;
      this._updateStats();
    } else if (tile && tile.needsReload) {
      needsReload = true;
    }

    if (tile) {
      this._touchTile(id, tile);
    }

    if (tile && needsReload) {
      tile
        .loadData({
          getData: this.opts.getTileData,
          requestScheduler: this._requestScheduler,
          onLoad: this._handleTileLoad.bind(this),
          onError: this._handleTileError.bind(this)
        })
        .catch(() => {});
      this._updateStats();
    }

    return tile;
  }

  /** Loads metadata from a TileSource and reapplies derived option overrides. */
  private async _initializeTileSource(tileSource: TileSource): Promise<void> {
    try {
      this.sourceMetadata = await tileSource.getMetadata();
      this._sourceMetadataOverrides = this._getMetadataOverrides(this.sourceMetadata);
      this._applyResolvedOptions();
      this._notifyUpdate();
    } catch (error: any) {
      const normalizedError =
        error instanceof Error ? error : new Error(`TileSource metadata error: ${String(error)}`);
      this._notifyError(normalizedError);
    }
  }

  /** Tracks which options were explicitly set by the caller. */
  private _rememberExplicitOptions(opts: Partial<Tileset2DProps<DataT, ViewStateT>>): void {
    for (const key of Object.keys(opts)) {
      this._explicitOptionKeys.add(key);
    }
  }

  /** Resolves defaults, metadata overrides, and caller options into runtime settings. */
  private _applyResolvedOptions(): void {
    const resolvedOpts = {
      ...DEFAULT_TILESET2D_PROPS,
      ...this._sourceMetadataOverrides,
      ...this._baseOpts
    } as Required<Tileset2DProps<DataT, ViewStateT>>;

    if (resolvedOpts.tileSource) {
      const tileSource = resolvedOpts.tileSource;
      resolvedOpts.getTileData = (loadProps: TileLoadProps) =>
        tileSource.getTileData(loadProps) as Promise<DataT | null> | DataT | null;
    }

    this.opts = resolvedOpts;
    this._maxZoom =
      typeof this.opts.maxZoom === 'number' && Number.isFinite(this.opts.maxZoom)
        ? Math.floor(this.opts.maxZoom)
        : undefined;
    this._minZoom =
      typeof this.opts.minZoom === 'number' && Number.isFinite(this.opts.minZoom)
        ? Math.ceil(this.opts.minZoom)
        : undefined;
  }

  /** Maps TileSource metadata into supported tileset options. */
  private _getMetadataOverrides(
    metadata: TileSourceMetadata | null
  ): Partial<Tileset2DProps<DataT, ViewStateT>> {
    if (!metadata) {
      return {};
    }
    const overrides: Partial<Tileset2DProps<DataT, ViewStateT>> = {};
    if (!this._explicitOptionKeys.has('minZoom') && Number.isFinite(metadata.minZoom)) {
      overrides.minZoom = metadata.minZoom;
    }
    if (!this._explicitOptionKeys.has('maxZoom') && Number.isFinite(metadata.maxZoom)) {
      overrides.maxZoom = metadata.maxZoom;
    }
    if (!this._explicitOptionKeys.has('extent') && metadata.boundingBox) {
      overrides.extent = [
        metadata.boundingBox[0][0],
        metadata.boundingBox[0][1],
        metadata.boundingBox[1][0],
        metadata.boundingBox[1][1]
      ];
    }
    return overrides;
  }

  /** Handles successful tile loads. */
  private _handleTileLoad(tile: SharedTile2DHeader<DataT>): void {
    this.opts.onTileLoad?.(tile);
    this._cacheByteSize = this._getCacheByteSize();
    this._resizeCache();
    for (const listener of this._listeners) {
      listener.onTileLoad?.(tile);
    }
    this._updateStats();
  }

  /** Handles tile load failures. */
  private _handleTileError(error: any, tile: SharedTile2DHeader<DataT>): void {
    this.opts.onTileError?.(error, tile);
    for (const listener of this._listeners) {
      listener.onTileError?.(error, tile);
    }
    this._updateStats();
  }

  /** Handles tile eviction from cache. */
  private _handleTileUnload(tile: SharedTile2DHeader<DataT>): void {
    this._unloadedTileCount++;
    this.opts.onTileUnload?.(tile);
    for (const listener of this._listeners) {
      listener.onTileUnload?.(tile);
    }
    this._updateStats();
  }

  /** Notifies listeners that metadata or effective options changed. */
  private _notifyUpdate(): void {
    for (const listener of this._listeners) {
      listener.onUpdate?.();
    }
  }

  /** Notifies listeners about asynchronous metadata errors. */
  private _notifyError(error: Error): void {
    for (const listener of this._listeners) {
      listener.onError?.(error);
    }
  }

  /** Recomputes absolute counter stats and notifies listeners. */
  private _updateStats(): void {
    this._setStatCount('Tiles In Cache', this._cache.size);
    this._setStatCount('Cache Size', this.cacheByteSize);
    this._setStatCount('Visible Tiles', this.visibleTiles.length);
    this._setStatCount('Selected Tiles', this.selectedTiles.length);
    this._setStatCount('Loading Tiles', this.loadingTiles.length);
    this._setStatCount('Unloaded Tiles', this._unloadedTileCount);
    this._setStatCount('Consumers', this._consumers.size);

    for (const listener of this._listeners) {
      listener.onStatsChange?.(this.stats);
    }
  }

  /** Writes an absolute count into a probe.gl stat. */
  private _setStatCount(name: string, value: number): void {
    this.stats.get(name).reset().addCount(value);
  }

  /** Returns the union of selected tiles across all consumers. */
  private _getSelectedTilesUnion(): Set<SharedTile2DHeader<DataT>> {
    const union = new Set<SharedTile2DHeader<DataT>>();
    for (const consumer of this._consumers.values()) {
      for (const tile of consumer.selectedTiles) {
        union.add(tile);
      }
    }
    return union;
  }

  /** Returns the union of visible tiles across all consumers. */
  private _getVisibleTilesUnion(): Set<SharedTile2DHeader<DataT>> {
    const union = new Set<SharedTile2DHeader<DataT>>();
    for (const consumer of this._consumers.values()) {
      for (const tile of consumer.visibleTiles) {
        union.add(tile);
      }
    }
    return union;
  }

  /** Moves a touched tile to the back of the cache map for LRU eviction ordering. */
  private _touchTile(id: string, tile: SharedTile2DHeader<DataT>): void {
    this._cache.delete(id);
    this._cache.set(id, tile);
  }

  /** Computes the total byte size of all cached tile content. */
  private _getCacheByteSize(): number {
    let byteLength = 0;
    for (const tile of this._cache.values()) {
      byteLength += tile.byteLength;
    }
    return byteLength;
  }

  /** Cancels low-priority requests when consumers no longer need them. */
  private _pruneRequests(): void {
    const {maxRequests = 0} = this.opts;
    const selectedTiles = this._getSelectedTilesUnion();
    const visibleTiles = this._getVisibleTilesUnion();
    const abortCandidates: SharedTile2DHeader<DataT>[] = [];
    let ongoingRequestCount = 0;

    for (const tile of this._cache.values()) {
      if (tile.isLoading) {
        ongoingRequestCount++;
        if (!selectedTiles.has(tile) && !visibleTiles.has(tile)) {
          abortCandidates.push(tile);
        }
      }
    }

    while (maxRequests > 0 && ongoingRequestCount > maxRequests && abortCandidates.length > 0) {
      const tile = abortCandidates.shift();
      if (tile) {
        tile.abort();
      }
      ongoingRequestCount--;
    }
  }

  /** Rebuilds parent and child links for all cached tiles. */
  private _rebuildTree(): void {
    for (const tile of this._cache.values()) {
      tile.parent = null;
      if (tile.children) {
        tile.children.length = 0;
      }
    }
    for (const tile of this._cache.values()) {
      const parent = this._getNearestAncestor(tile);
      tile.parent = parent;
      if (parent?.children) {
        parent.children.push(tile);
      }
    }
  }

  /** Updates the sorted tile list used by traversal and rendering. */
  private _syncTiles(): void {
    this._tiles = Array.from(this._cache.values()).sort((tile1, tile2) => tile1.zoom - tile2.zoom);
  }

  /** Evicts unused cached tiles when configured cache limits are exceeded. */
  private _resizeCache(): void {
    const maxCacheSize = this.opts.maxCacheSize ?? 100;
    const maxCacheByteSize = this.opts.maxCacheByteSize ?? Infinity;
    const visibleTiles = this._getVisibleTilesUnion();
    const selectedTiles = this._getSelectedTilesUnion();
    const overflown = this._cache.size > maxCacheSize || this._cacheByteSize > maxCacheByteSize;

    if (overflown) {
      for (const [id, tile] of this._cache) {
        if (!visibleTiles.has(tile) && !selectedTiles.has(tile)) {
          this._cache.delete(id);
          this._cacheByteSize = this._getCacheByteSize();
          this._handleTileUnload(tile);
        }
        if (this._cache.size <= maxCacheSize && this._cacheByteSize <= maxCacheByteSize) {
          break;
        }
      }
      this._dirty = true;
    }

    if (this._dirty) {
      this._rebuildTree();
      this._syncTiles();
      this._dirty = false;
    }
  }

  /** Finds the nearest cached ancestor tile for placeholder rendering. */
  private _getNearestAncestor(tile: SharedTile2DHeader<DataT>): SharedTile2DHeader<DataT> | null {
    const {_minZoom = 0} = this;
    let index = tile.index;
    while (this.getTileZoom(index) > _minZoom) {
      index = this.getParentIndex(index);
      const parent = this.getTile(index);
      if (parent) {
        return parent;
      }
    }
    return null;
  }
}

function normalizeBounds(extent: number[] | null | undefined) {
  return extent && extent.length === 4 ? (extent as [number, number, number, number]) : undefined;
}
