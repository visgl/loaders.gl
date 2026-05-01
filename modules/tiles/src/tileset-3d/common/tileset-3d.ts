// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Matrix4, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {Stats} from '@probe.gl/stats';
import {RequestScheduler, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {TilesetCache} from './tileset-cache';
import {calculateTransformProps} from '../helpers/transform-utils';
import {FrameState, getFrameState, limitSelectedTiles} from '../helpers/frame-state';

import type {GeospatialViewport, Viewport} from '../../types';
import {Tile3D} from './tile-3d';
import {TILESET_TYPE} from '../../constants';

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
  maximumMemoryUsage?: number;
  memoryCacheOverflow?: number;
  maximumTilesSelected?: number;
  debounceTime?: number;

  description?: string;
  attributions?: string[];

  ellipsoid?: object;
  modelMatrix?: Matrix4;

  maximumScreenSpaceError?: number;
  memoryAdjustedScreenSpaceError?: boolean;
  viewportTraversersMap?: any;
  updateTransforms?: boolean;
  viewDistanceScale?: number;

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
  maximumMemoryUsage: number;
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
  memoryAdjustedScreenSpaceError: boolean;
  viewportTraversersMap: Record<string, any> | null;
  attributions: string[];
  loadTiles: boolean;
  loadOptions: LoaderOptions;
  updateTransforms: boolean;
  viewDistanceScale: number;
  basePath: string;
  contentLoader?: (tile: Tile3D) => Promise<void>;
  i3s: Record<string, any>;
};

const DEFAULT_PROPS: Props = {
  description: '',
  ellipsoid: Ellipsoid.WGS84,
  modelMatrix: new Matrix4(),
  throttleRequests: true,
  maxRequests: 64,
  maximumMemoryUsage: 32,
  memoryCacheOverflow: 1,
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
  maximumScreenSpaceError: 8,
  memoryAdjustedScreenSpaceError: false,
  loadTiles: true,
  updateTransforms: true,
  viewportTraversersMap: null,
  loadOptions: {fetch: {}},
  attributions: [],
  basePath: '',
  i3s: {}
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
  loader: LoaderWithParser;
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

  dynamicScreenSpaceErrorComputedDensity = 0.0;

  maximumMemoryUsage = 32;
  gpuMemoryUsageInBytes = 0;
  memoryAdjustedScreenSpaceError = 0.0;

  private _cacheBytes = 0;
  private _cacheOverflowBytes = 0;

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
    this.options = {...DEFAULT_PROPS, ...options};
    this.loadOptions = this.options.loadOptions || {};

    if (!isTileset3DSource(source)) {
      throw new Error('Tileset3D requires a Tileset3DSource instance');
    }
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
    this._cacheBytes = this.options.maximumMemoryUsage * 1024 * 1024;
    this._cacheOverflowBytes = this.options.memoryCacheOverflow * 1024 * 1024;

    this.stats = new Stats({id: this.url});
    this._initializeStats();

    this.tilesetInitializationPromise = this._initializeTileSet();
  }

  destroy(): void {
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

  get queryParams(): string {
    const rootUrl = this.source.getTileUrl(this.url);
    const queryIndex = rootUrl.indexOf('?');
    return queryIndex >= 0 ? rootUrl.slice(queryIndex + 1) : '';
  }

  setProps(props: Tileset3DProps): void {
    this.options = {...this.options, ...props};
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

  adjustScreenSpaceError(): void {
    if (this.gpuMemoryUsageInBytes < this._cacheBytes) {
      this.memoryAdjustedScreenSpaceError = Math.max(
        this.memoryAdjustedScreenSpaceError / 1.02,
        this.options.maximumScreenSpaceError
      );
    } else if (this.gpuMemoryUsageInBytes > this._cacheBytes + this._cacheOverflowBytes) {
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
      this._traverser.traverse(this.roots[id], frameState, this.options);
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
  }

  _updateStats(): void {
    let tilesRenderable = 0;
    let pointsRenderable = 0;
    for (const tile of this.selectedTiles) {
      if (tile.contentAvailable && tile.content) {
        tilesRenderable++;
        if (tile.content.pointCount) {
          pointsRenderable += tile.content.pointCount;
        } else {
          pointsRenderable += tile.content.vertexCount;
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
        typeof initialMetadata.tileset.root.then !== 'function'
      ) {
        this.root = this._initializeTileHeaders(initialMetadata.tileset, null);
        this._applyViewState();
      }

      await initializePromise;
      const metadata = this.source.getMetadata();
      this._syncSourceState(metadata);
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
