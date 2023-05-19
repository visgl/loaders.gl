// loaders.gl, MIT license

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Matrix4, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {Stats} from '@probe.gl/stats';
import {RequestScheduler, path, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {TilesetCache} from './tileset-cache';
import {calculateTransformProps} from './helpers/transform-utils';
import {FrameState, getFrameState, limitSelectedTiles} from './helpers/frame-state';
import {getZoomFromBoundingVolume, getZoomFromExtent, getZoomFromFullExtent} from './helpers/zoom';

import type {GeospatialViewport, Viewport} from '../types';
import {Tile3D} from './tile-3d';
import {TILESET_TYPE} from '../constants';

import {TilesetTraverser} from './tileset-traverser';

// TODO - these should be moved into their respective modules
import {Tileset3DTraverser} from './format-3d-tiles/tileset-3d-traverser';
import {I3STilesetTraverser} from './format-i3s/i3s-tileset-traverser';

export type TilesetJSON = any;

/*
export type TilesetJSON = {
    loader;
    // could be  3d tiles, i3s
    type: 'I3S' | '3DTILES';
    /** The url to the top level tileset JSON file. *
    url: string;
    basePath?: string;
    // Geometric error when the tree is not rendered at all
    lodMetricType: string;
    lodMetricValue: number;
    root: {
      refine: string;
      [key: string]: unknown;
    },
    [key: string]: unknown;
};
*/

export type Tileset3DProps = {
  // loading
  throttleRequests?: boolean;
  maxRequests?: number;
  loadOptions?: LoaderOptions;
  loadTiles?: boolean;
  basePath?: string;
  maximumMemoryUsage?: number;
  maximumTilesSelected?: number;
  debounceTime?: number;

  // Metadata
  description?: string;
  attributions?: string[];

  // Transforms
  ellipsoid?: object;
  modelMatrix?: Matrix4;

  // Traversal
  maximumScreenSpaceError?: number;
  viewportTraversersMap?: any;
  updateTransforms?: boolean;
  viewDistanceScale?: number;

  // Callbacks
  onTileLoad?: (tile: Tile3D) => any;
  onTileUnload?: (tile: Tile3D) => any;
  onTileError?: (tile: Tile3D, message: string, url: string) => any;
  contentLoader?: (tile: Tile3D) => Promise<void>;
  onTraversalComplete?: (selectedTiles: Tile3D[]) => Tile3D[];
};

type Props = {
  description: string;
  ellipsoid: object;
  /** A 4x4 transformation matrix this transforms the entire tileset. */
  modelMatrix: Matrix4;
  /** Set to false to disable network request throttling */
  throttleRequests: boolean;
  /** Number of simultaneous requsts, if throttleRequests is true */
  maxRequests: number;
  maximumMemoryUsage: number;
  /** Maximum number limit of tiles selected for show. 0 means no limit */
  maximumTilesSelected: number;
  /** Delay time before the tileset traversal. It prevents traversal requests spam.*/
  debounceTime: number;
  /** Callback. Indicates this a tile's content was loaded */
  onTileLoad: (tile: Tile3D) => void;
  /** Callback. Indicates this a tile's content was unloaded (cache full) */
  onTileUnload: (tile: Tile3D) => void;
  /** Callback. Indicates this a tile's content failed to load */
  onTileError: (tile: Tile3D, message: string, url: string) => void;
  /** Callback. Allows post-process selectedTiles right after traversal. */
  onTraversalComplete: (selectedTiles: Tile3D[]) => Tile3D[];
  /** The maximum screen space error used to drive level of detail refinement. */
  maximumScreenSpaceError: number;
  viewportTraversersMap: Record<string, any> | null;
  attributions: string[];
  loadTiles: boolean;
  loadOptions: LoaderOptions;
  updateTransforms: boolean;
  /** View distance scale modifier */
  viewDistanceScale: number;
  basePath: string;
  /** Optional async tile content loader */
  contentLoader?: (tile: Tile3D) => Promise<void>;
  /** @todo I3S specific knowledge should be moved to I3S module */
  i3s: Record<string, any>;
};

const DEFAULT_PROPS: Props = {
  description: '',
  ellipsoid: Ellipsoid.WGS84,
  modelMatrix: new Matrix4(),
  throttleRequests: true,
  maxRequests: 64,
  maximumMemoryUsage: 32,
  maximumTilesSelected: 0,
  debounceTime: 0,
  onTileLoad: () => {},
  onTileUnload: () => {},
  onTileError: () => {},
  onTraversalComplete: (selectedTiles: Tile3D[]) => selectedTiles,
  contentLoader: undefined,
  viewDistanceScale: 1.0,
  maximumScreenSpaceError: 8,
  loadTiles: true,
  updateTransforms: true,
  viewportTraversersMap: null,
  loadOptions: {fetch: {}},
  attributions: [],
  basePath: '',
  i3s: {}
};

// Tracked Stats
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

/**
 * The Tileset loading and rendering flow is as below,
 * A rendered (i.e. deck.gl `Tile3DLayer`) triggers `tileset.update()` after a `tileset` is loaded
 * `tileset` starts traversing the tile tree and update `requestTiles` (tiles of which content need
 * to be fetched) and `selectedTiles` (tiles ready for rendering under the current viewport).
 * `Tile3DLayer` will update rendering based on `selectedTiles`.
 * `Tile3DLayer` also listens to `onTileLoad` callback and trigger another round of `update and then traversal`
 * when new tiles are loaded.

 * As I3S tileset have stored `tileHeader` file (metadata) and tile content files (geometry, texture, ...) separately.
 * During each traversal, it issues `tilHeader` requests if that `tileHeader` is not yet fetched,
 * after the tile header is fulfilled, it will resume the traversal starting from the tile just fetched (not root).

 * Tile3DLayer
 *      |
 *  await load(tileset)
 *      |
 *  tileset.update()
 *      |                async load tileHeader
 *  tileset.traverse() -------------------------- Queued
 *      |        resume traversal after fetched  |
 *      |----------------------------------------|
 *      |
 *      |                     async load tile content
 * tilset.requestedTiles  ----------------------------- RequestScheduler
 *                                                             |
 * tilset.selectedTiles (ready for rendering)                  |
 *      |         Listen to                                    |
 *   Tile3DLayer ----------- onTileLoad  ----------------------|
 *      |                         |   notify new tile is available
 *   updateLayers                 |
 *                       tileset.update // trigger another round of update
*/
export class Tileset3D {
  // props: Tileset3DProps;
  options: Props;
  loadOptions: LoaderOptions;

  type: string;
  tileset: TilesetJSON;
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
  /** @todo any->unknown */
  asset: Record<string, any> = {};

  // Metadata for the entire tileset
  description: string = '';
  properties: any;

  extras: any = null;
  attributions: any = {};
  credits: any = {};

  stats: Stats;

  /** flags that contain information about data types in nested tiles */
  contentFormats = {draco: false, meshopt: false, dds: false, ktx2: false};

  // view props
  cartographicCenter: Vector3 | null = null;
  cartesianCenter: Vector3 | null = null;
  zoom: number = 1;
  boundingVolume: any = null;

  /** Updated based on the camera position and direction */
  dynamicScreenSpaceErrorComputedDensity: number = 0.0;

  // METRICS

  /**
   * The maximum amount of GPU memory (in MB) that may be used to cache tiles
   * Tiles not in view are unloaded to enforce private
   */
  maximumMemoryUsage: number = 32;

  /** The total amount of GPU memory in bytes used by the tileset. */
  gpuMemoryUsageInBytes: number = 0;

  /** Update tracker. increase in each update cycle. */
  _frameNumber: number = 0;
  private _queryParams: Record<string, string> = {};
  private _extensionsUsed: string[] = [];
  private _tiles: Record<string, Tile3D> = {};

  /** counter for tracking tiles requests */
  private _pendingCount: number = 0;

  /** Hold traversal results */
  selectedTiles: Tile3D[] = [];

  // TRAVERSAL
  traverseCounter: number = 0;
  geometricError: number = 0;
  private lastUpdatedVieports: Viewport[] | Viewport | null = null;
  private _requestedTiles: Tile3D[] = [];
  private _emptyTiles: Tile3D[] = [];
  private frameStateData: any = {};

  _traverser: TilesetTraverser;
  _cache = new TilesetCache();
  _requestScheduler: RequestScheduler;

  // Promise tracking
  private updatePromise: Promise<number> | null = null;
  tilesetInitializationPromise: Promise<void>;

  /**
   * Create a new Tileset3D
   * @param json
   * @param props
   */
  // eslint-disable-next-line max-statements
  constructor(tileset: TilesetJSON, options?: Tileset3DProps) {
    // PUBLIC MEMBERS
    this.options = {...DEFAULT_PROPS, ...options};
    // raw data
    this.tileset = tileset;
    this.loader = tileset.loader;
    // could be  3d tiles, i3s
    this.type = tileset.type;
    // The url to a tileset JSON file.
    this.url = tileset.url;
    this.basePath = tileset.basePath || path.dirname(this.url);
    this.modelMatrix = this.options.modelMatrix;
    this.ellipsoid = this.options.ellipsoid;

    // Geometric error when the tree is not rendered at all
    this.lodMetricType = tileset.lodMetricType;
    this.lodMetricValue = tileset.lodMetricValue;
    this.refine = tileset.root.refine;

    this.loadOptions = this.options.loadOptions || {};

    // TRAVERSAL
    this._traverser = this._initializeTraverser();
    this._requestScheduler = new RequestScheduler({
      throttleRequests: this.options.throttleRequests,
      maxRequests: this.options.maxRequests
    });

    // METRICS
    // The total amount of GPU memory in bytes used by the tileset.
    this.stats = new Stats({id: this.url});
    this._initializeStats();

    this.tilesetInitializationPromise = this._initializeTileSet(tileset);
  }

  /** Release resources */
  destroy(): void {
    this._destroy();
  }

  /** Is the tileset loaded (update needs to have been called at least once) */
  isLoaded(): boolean {
    // Check that `_frameNumber !== 0` which means that update was called at least once
    return this._pendingCount === 0 && this._frameNumber !== 0 && this._requestedTiles.length === 0;
  }

  get tiles(): object[] {
    return Object.values(this._tiles);
  }

  get frameNumber(): number {
    return this._frameNumber;
  }

  get queryParams(): string {
    return new URLSearchParams(this._queryParams).toString();
  }

  setProps(props: Tileset3DProps): void {
    this.options = {...this.options, ...props};
  }

  /** @deprecated */
  setOptions(options: Tileset3DProps): void {
    this.options = {...this.options, ...options};
  }

  /**
   * Return a loadable tile url for a specific tile subpath
   * @param tilePath a tile subpath
   */
  getTileUrl(tilePath: string): string {
    const isDataUrl = tilePath.startsWith('data:');
    if (isDataUrl) {
      return tilePath;
    }
    return `${tilePath}${tilePath.includes('?') ? '&' : '?'}${this.queryParams}`;
  }

  // TODO CESIUM specific
  hasExtension(extensionName: string): boolean {
    return Boolean(this._extensionsUsed.indexOf(extensionName) > -1);
  }

  /**
   * Update visible tiles relying on a list of viewports
   * @param viewports - list of viewports
   * @deprecated
   */
  update(viewports: Viewport[] | Viewport | null = null) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
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

  /**
   * Update visible tiles relying on a list of viewports.
   * Do it with debounce delay to prevent update spam
   * @param viewports viewports
   * @returns Promise of new frameNumber
   */
  async selectTiles(viewports: Viewport[] | Viewport | null = null): Promise<number> {
    await this.tilesetInitializationPromise;
    if (viewports) {
      this.lastUpdatedVieports = viewports;
    }
    if (!this.updatePromise) {
      this.updatePromise = new Promise<number>((resolve) => {
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
   * Update visible tiles relying on a list of viewports
   * @param viewports viewports
   */
  // eslint-disable-next-line max-statements, complexity
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
    // First loop to decrement traverseCounter
    for (const viewport of preparedViewports) {
      const id = viewport.id;
      if (this._needTraverse(id)) {
        viewportsToTraverse.push(id);
      } else {
        this.traverseCounter--;
      }
    }

    // Second loop to traverse
    for (const viewport of preparedViewports) {
      const id = viewport.id;
      if (!this.roots[id]) {
        this.roots[id] = this._initializeTileHeaders(this.tileset, null);
      }

      if (!viewportsToTraverse.includes(id)) {
        continue; // eslint-disable-line no-continue
      }
      const frameState = getFrameState(viewport as GeospatialViewport, this._frameNumber);
      this._traverser.traverse(this.roots[id], frameState, this.options);
    }
  }

  /**
   * Check if traversal is needed for particular viewport
   * @param {string} viewportId - id of a viewport
   * @return {boolean}
   */
  _needTraverse(viewportId: string): boolean {
    let traverserId = viewportId;
    if (this.options.viewportTraversersMap) {
      traverserId = this.options.viewportTraversersMap[viewportId];
    }
    if (traverserId !== viewportId) {
      return false;
    }

    return true;
  }

  /**
   * The callback to post-process tiles after traversal procedure
   * @param frameState - frame state for tile culling
   */
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

  /**
   * Update tiles relying on data from all traversers
   */
  _updateTiles(): void {
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

    for (const tile of this.selectedTiles) {
      this._tiles[tile.id] = tile;
    }

    this._loadTiles();
    this._unloadTiles();
    this._updateStats();
  }

  _tilesChanged(oldSelectedTiles: Tile3D[], selectedTiles: Tile3D[]): boolean {
    if (oldSelectedTiles.length !== selectedTiles.length) {
      return true;
    }
    const set1 = new Set(oldSelectedTiles.map((t) => t.id));
    const set2 = new Set(selectedTiles.map((t) => t.id));
    let changed = oldSelectedTiles.filter((x) => !set2.has(x.id)).length > 0;
    changed = changed || selectedTiles.filter((x) => !set1.has(x.id)).length > 0;
    return changed;
  }

  _loadTiles(): void {
    // Sort requests by priority before making any requests.
    // This makes it less likely this requests will be cancelled after being issued.
    // requestedTiles.sort((a, b) => a._priority - b._priority);
    for (const tile of this._requestedTiles) {
      if (tile.contentUnloaded) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._loadTile(tile);
      }
    }
  }

  _unloadTiles(): void {
    // unload tiles from cache when hit maximumMemoryUsage
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
          // Calculate vertices for non point cloud tiles.
          pointsRenderable += tile.content.vertexCount;
        }
      }
    }

    this.stats.get(TILES_IN_VIEW).count = this.selectedTiles.length;
    this.stats.get(TILES_RENDERABLE).count = tilesRenderable;
    this.stats.get(POINTS_COUNT).count = pointsRenderable;
  }

  async _initializeTileSet(tilesetJson: TilesetJSON): Promise<void> {
    if (this.type === TILESET_TYPE.I3S) {
      this.calculateViewPropsI3S();
      tilesetJson.root = await tilesetJson.root;
    }
    this.root = this._initializeTileHeaders(tilesetJson, null);

    if (this.type === TILESET_TYPE.TILES3D) {
      this._initializeTiles3DTileset(tilesetJson);
      this.calculateViewPropsTiles3D();
    }

    if (this.type === TILESET_TYPE.I3S) {
      this._initializeI3STileset();
    }
  }

  /**
   * Called during initialize Tileset to initialize the tileset's cartographic center (longitude, latitude) and zoom.
   * These metrics help apps center view on tileset
   * For I3S there is extent (<1.8 version) or fullExtent (>=1.8 version) to calculate view props
   * @returns
   */
  private calculateViewPropsI3S(): void {
    // for I3S 1.8 try to calculate with fullExtent
    const fullExtent = this.tileset.fullExtent;
    if (fullExtent) {
      const {xmin, xmax, ymin, ymax, zmin, zmax} = fullExtent;
      this.cartographicCenter = new Vector3(
        xmin + (xmax - xmin) / 2,
        ymin + (ymax - ymin) / 2,
        zmin + (zmax - zmin) / 2
      );
      this.cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian(
        this.cartographicCenter,
        new Vector3()
      );
      this.zoom = getZoomFromFullExtent(fullExtent, this.cartographicCenter, this.cartesianCenter);
      return;
    }
    // for I3S 1.6-1.7 try to calculate with extent
    const extent = this.tileset.store?.extent;
    if (extent) {
      const [xmin, ymin, xmax, ymax] = extent;
      this.cartographicCenter = new Vector3(xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2, 0);
      this.cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian(
        this.cartographicCenter,
        new Vector3()
      );
      this.zoom = getZoomFromExtent(extent, this.cartographicCenter, this.cartesianCenter);
      return;
    }
    // eslint-disable-next-line no-console
    console.warn('Extent is not defined in the tileset header');
    this.cartographicCenter = new Vector3();
    this.zoom = 1;
    return;
  }

  /**
   * Called during initialize Tileset to initialize the tileset's cartographic center (longitude, latitude) and zoom.
   * These metrics help apps center view on tileset.
   * For 3DTiles the root tile data is used to calculate view props.
   * @returns
   */
  private calculateViewPropsTiles3D() {
    const root = this.root as Tile3D;
    const {center} = root.boundingVolume;
    // TODO - handle all cases
    if (!center) {
      // eslint-disable-next-line no-console
      console.warn('center was not pre-calculated for the root tile');
      this.cartographicCenter = new Vector3();
      this.zoom = 1;
      return;
    }

    // cartographic coordinates are undefined at the center of the ellipsoid
    if (center[0] !== 0 || center[1] !== 0 || center[2] !== 0) {
      this.cartographicCenter = Ellipsoid.WGS84.cartesianToCartographic(center, new Vector3());
    } else {
      this.cartographicCenter = new Vector3(0, 0, -Ellipsoid.WGS84.radii[0]);
    }
    this.cartesianCenter = center;
    this.zoom = getZoomFromBoundingVolume(root.boundingVolume, this.cartographicCenter);
  }

  _initializeStats() {
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
  }

  // Installs the main tileset JSON file or a tileset JSON file referenced from a tile.
  // eslint-disable-next-line max-statements
  _initializeTileHeaders(tilesetJson: TilesetJSON, parentTileHeader?: any) {
    // A tileset JSON file referenced from a tile may exist in a different directory than the root tileset.
    // Get the basePath relative to the external tileset.
    const rootTile = new Tile3D(this, tilesetJson.root, parentTileHeader); // resource

    // If there is a parentTileHeader, add the root of the currently loading tileset
    // to parentTileHeader's children, and update its depth.
    if (parentTileHeader) {
      parentTileHeader.children.push(rootTile);
      rootTile.depth = parentTileHeader.depth + 1;
    }

    // 3DTiles knows the hierarchy beforehand
    if (this.type === TILESET_TYPE.TILES3D) {
      const stack: Tile3D[] = [];
      stack.push(rootTile);

      while (stack.length > 0) {
        const tile = stack.pop() as Tile3D;
        this.stats.get(TILES_TOTAL).incrementCount();
        const children = tile.header.children || [];
        for (const childHeader of children) {
          const childTile = new Tile3D(this, childHeader, tile);

          // Special handling for Google
          // A session key must be used for all tile requests
          if (childTile.contentUrl?.includes('?session=')) {
            const url = new URL(childTile.contentUrl);
            const session = url.searchParams.get('session');
            if (session) {
              this._queryParams.session = session;
            }
          }

          tile.children.push(childTile);
          childTile.depth = tile.depth + 1;
          stack.push(childTile);
        }
      }
    }

    return rootTile;
  }

  _initializeTraverser(): TilesetTraverser {
    let TraverserClass;
    const type = this.type;
    switch (type) {
      case TILESET_TYPE.TILES3D:
        TraverserClass = Tileset3DTraverser;
        break;
      case TILESET_TYPE.I3S:
        TraverserClass = I3STilesetTraverser;
        break;
      default:
        TraverserClass = TilesetTraverser;
    }

    return new TraverserClass({
      basePath: this.basePath,
      onTraversalEnd: this._onTraversalEnd.bind(this)
    });
  }

  _destroyTileHeaders(parentTile: Tile3D): void {
    this._destroySubtree(parentTile);
  }

  async _loadTile(tile: Tile3D): Promise<void> {
    let loaded;
    try {
      this._onStartTileLoading();
      loaded = await tile.loadContent();
    } catch (error: unknown) {
      this._onTileLoadError(tile, error instanceof Error ? error : new Error('load failed'));
    } finally {
      this._onEndTileLoading();
      this._onTileLoad(tile, loaded);
    }
  }

  _onTileLoadError(tile: Tile3D, error: Error): void {
    this.stats.get(TILES_LOAD_FAILED).incrementCount();

    const message = error.message || error.toString();
    const url = tile.url;
    // TODO - Allow for probe log to be injected instead of console?
    console.error(`A 3D tile failed to load: ${tile.url} ${message}`); // eslint-disable-line
    this.options.onTileError(tile, message, url);
  }

  _onTileLoad(tile: Tile3D, loaded: boolean): void {
    if (!loaded) {
      return;
    }

    if (this.type === TILESET_TYPE.I3S) {
      // We can't calculate tiles total in I3S in advance so we calculate it dynamically.
      const nodesInNodePages = this.tileset?.nodePagesTile?.nodesInNodePages || 0;
      this.stats.get(TILES_TOTAL).reset();
      this.stats.get(TILES_TOTAL).addCount(nodesInNodePages);
    }

    // add coordinateOrigin and modelMatrix to tile
    if (tile && tile.content) {
      calculateTransformProps(tile, tile.content);
    }

    this.updateContentTypes(tile);
    this._addTileToCache(tile);
    this.options.onTileLoad(tile);
  }

  /**
   * Update information about data types in nested tiles
   * @param tile instance of a nested Tile3D
   */
  private updateContentTypes(tile: Tile3D) {
    if (this.type === TILESET_TYPE.I3S) {
      if (tile.header.isDracoGeometry) {
        this.contentFormats.draco = true;
      }
      switch (tile.header.textureFormat) {
        case 'dds':
          this.contentFormats.dds = true;
          break;
        case 'ktx2':
          this.contentFormats.ktx2 = true;
          break;
        default:
      }
    } else if (this.type === TILESET_TYPE.TILES3D) {
      const {extensionsRemoved = []} = tile.content?.gltf || {};
      if (extensionsRemoved.includes('KHR_draco_mesh_compression')) {
        this.contentFormats.draco = true;
      }
      if (extensionsRemoved.includes('EXT_meshopt_compression')) {
        this.contentFormats.meshopt = true;
      }
      if (extensionsRemoved.includes('KHR_texture_basisu')) {
        this.contentFormats.ktx2 = true;
      }
    }
  }

  _onStartTileLoading() {
    this._pendingCount++;
    this.stats.get(TILES_LOADING).incrementCount();
  }

  _onEndTileLoading() {
    this._pendingCount--;
    this.stats.get(TILES_LOADING).decrementCount();
  }

  _addTileToCache(tile: Tile3D) {
    this._cache.add(this, tile, (tileset) => tileset._updateCacheStats(tile));
  }

  _updateCacheStats(tile) {
    this.stats.get(TILES_LOADED).incrementCount();
    this.stats.get(TILES_IN_MEMORY).incrementCount();

    // Good enough? Just use the raw binary ArrayBuffer's byte length.
    this.gpuMemoryUsageInBytes += tile.gpuMemoryUsageInBytes || 0;
    this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;
  }

  _unloadTile(tile) {
    this.gpuMemoryUsageInBytes -= tile.gpuMemoryUsageInBytes || 0;

    this.stats.get(TILES_IN_MEMORY).decrementCount();
    this.stats.get(TILES_UNLOADED).incrementCount();
    this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;

    this.options.onTileUnload(tile);
    tile.unloadContent();
  }

  // Traverse the tree and destroy all tiles
  _destroy() {
    const stack: Tile3D[] = [];

    if (this.root) {
      stack.push(this.root);
    }

    while (stack.length > 0) {
      const tile: Tile3D = stack.pop() as Tile3D;

      for (const child of tile.children) {
        stack.push(child);
      }

      this._destroyTile(tile);
    }
    this.root = null;
  }

  // Traverse the tree and destroy all sub tiles
  _destroySubtree(tile) {
    const root = tile;
    const stack: Tile3D[] = [];
    stack.push(root);
    while (stack.length > 0) {
      tile = stack.pop();
      for (const child of tile.children) {
        stack.push(child);
      }
      if (tile !== root) {
        this._destroyTile(tile);
      }
    }
    root.children = [];
  }

  _destroyTile(tile) {
    this._cache.unloadTile(this, tile);
    this._unloadTile(tile);
    tile.destroy();
  }

  _initializeTiles3DTileset(tilesetJson) {
    if (tilesetJson.queryString) {
      const searchParams = new URLSearchParams(tilesetJson.queryString);
      const queryParams = Object.fromEntries(searchParams.entries());
      this._queryParams = {...this._queryParams, ...queryParams};
    }

    this.asset = tilesetJson.asset;
    if (!this.asset) {
      throw new Error('Tileset must have an asset property.');
    }
    if (this.asset.version !== '0.0' && this.asset.version !== '1.0') {
      throw new Error('The tileset must be 3D Tiles version 0.0 or 1.0.');
    }

    // Note: `asset.tilesetVersion` is version of the tileset itself (not the version of the 3D TILES standard)
    // We add this version as a `v=1.0` query param to fetch the right version and not get an older cached version
    if ('tilesetVersion' in this.asset) {
      this._queryParams.v = this.asset.tilesetVersion;
    }

    // TODO - ion resources have a credits property we can use for additional attribution.
    this.credits = {
      attributions: this.options.attributions || []
    };
    this.description = this.options.description || '';

    // Gets the tileset's properties dictionary object, which contains metadata about per-feature properties.
    this.properties = tilesetJson.properties;
    this.geometricError = tilesetJson.geometricError;
    this._extensionsUsed = tilesetJson.extensionsUsed || [];
    // Returns the extras property at the top of the tileset JSON (application specific metadata).
    this.extras = tilesetJson.extras;
  }

  _initializeI3STileset() {
    // @ts-expect-error
    if (this.loadOptions.i3s && 'token' in this.loadOptions.i3s) {
      this._queryParams.token = this.loadOptions.i3s.token as string;
    }
  }
}
