// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

/*

  The Tileset loading and rendering flow is as below,
  A rendered (i.e. deck.gl `Tile3DLayer`) triggers `tileset.update()` after a `tileset` is loaded
  `tileset` starts traversing the tile tree and update `requestTiles` (tiles of which content need
  to be fetched) and `selectedTiles` (tiles ready for rendering under the current viewport).
  `Tile3DLayer` will update rendering based on `selectedTiles`.
  `Tile3DLayer` also listens to `onTileLoad` callback and trigger another round of `update and then traversal`
  when new tiles are loaded.

  As I3S tileset have stored `tileHeader` file (metadata) and tile content files (geometry, texture, ...) separately.
  During each traversal, it issues `tilHeader` requests if that `tileHeader` is not yet fetched,
  after the tile header is fulfilled, it will resume the traversal starting from the tile just fetched (not root).

  Tile3DLayer
       |
   await load(tileset)
       |
   tileset.update()
       |                async load tileHeader
   tileset.traverse() -------------------------- Queued
       |        resume traversal after fetched  |
       |----------------------------------------|
       |
       |                     async load tile content
  tilset.requestedTiles  ----------------------------- RequestScheduler
                                                              |
  tilset.selectedTiles (ready for rendering)                  |
       |         Listen to                                    |
    Tile3DLayer ----------- onTileLoad  ----------------------|
       |                         |   notify new tile is available
    updateLayers                 |
                        tileset.update // trigger another round of update
*/

import {Matrix4, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {Stats} from '@probe.gl/stats';
import {RequestScheduler, assert, path, LoaderObject} from '@loaders.gl/loader-utils';

import TilesetCache from './tileset-cache';
import {calculateTransformProps} from './helpers/transform-utils';
import {FrameState, getFrameState} from './helpers/frame-state';
import {getZoomFromBoundingVolume} from './helpers/zoom';
import Tile3D from './tile-3d';
import Tileset3DTraverser from './traversers/tileset-3d-traverser';
import TilesetTraverser from './traversers/tileset-traverser';
import I3SetTraverser from './traversers/i3s-tileset-traverser';
import {TILESET_TYPE} from '../constants';

export type Tileset3DProps = {
  // loading
  token?: string;
  headers?: any;
  throttleRequests?: boolean;
  maxRequests?: number;
  loadOptions?: {[key: string]: any};
  loadTiles?: boolean;
  basePath?: string;
  maximumMemoryUsage?: number;

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
};

type Props = {
  description: string;
  ellipsoid: object;
  modelMatrix: Matrix4;
  throttleRequests: boolean;
  maximumMemoryUsage: number;
  onTileLoad: (tile: Tile3D) => any;
  onTileUnload: (tile: Tile3D) => any;
  onTileError: (tile: Tile3D, message: string, url: string) => any;
  maximumScreenSpaceError: number;
  viewportTraversersMap: any;
  token: string;
  attributions: string[];
  headers: any;
  maxRequests: number;
  loadTiles: boolean;
  loadOptions: {[key: string]: any};
  updateTransforms: boolean;
  viewDistanceScale: number;
  basePath: string;
  contentLoader?: (tile: Tile3D) => Promise<void>;
  i3s: {[key: string]: any};
};

const DEFAULT_PROPS: Props = {
  description: '',

  ellipsoid: Ellipsoid.WGS84,
  // A 4x4 transformation matrix this transforms the entire tileset.
  modelMatrix: new Matrix4(),

  // Set to false to disable network request throttling
  throttleRequests: true,

  // Number of simultaneous requsts, if throttleRequests is true
  maxRequests: 64,

  maximumMemoryUsage: 32,

  // Indicates this a tile's content was loaded
  onTileLoad: (tile) => {},
  // Indicates this a tile's content was unloaded
  onTileUnload: (tile) => {},
  onTileError: (tile, message, url) => {},

  // Optional async tile content loader
  contentLoader: undefined,

  // View distance scale modifier
  viewDistanceScale: 1.0,

  // TODO CESIUM
  // The maximum screen space error used to drive level of detail refinement.
  maximumScreenSpaceError: 8,

  loadTiles: true,
  updateTransforms: true,
  viewportTraversersMap: null,

  headers: {},
  loadOptions: {},

  token: '',
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
const POINTS_COUNT = 'Points';
const TILES_GPU_MEMORY = 'Tile Memory Use';

export default class Tileset3D {
  // props: Tileset3DProps;
  options: Props;
  loadOptions: {[key: string]: any};

  type: string;
  tileset: {[key: string]: any};
  loader: LoaderObject;
  url: string;
  basePath: string;
  modelMatrix: Matrix4;
  ellipsoid: any;
  lodMetricType: string;
  lodMetricValue: number;
  refine: string;
  root: Tile3D | null;
  roots: {[key: string]: Tile3D};
  asset: {[key: string]: any};

  description: string;
  properties: any;
  extras: any;
  attributions: any;
  credits: any;

  stats: Stats;

  traverseCounter: number;
  geometricError: number;
  selectedTiles: Tile3D[];

  cartographicCenter: Vector3 | null;
  cartesianCenter: Vector3 | null;
  zoom: number;
  boundingVolume: any;

  // METRICS
  // The maximum amount of GPU memory (in MB) that may be used to cache tiles.
  // Tiles not in view are unloaded to enforce private
  // The total amount of GPU memory in bytes used by the tileset.
  gpuMemoryUsageInBytes: any;

  // TRAVERSAL
  _traverser: TilesetTraverser;
  private _cache: TilesetCache;
  _requestScheduler: RequestScheduler;

  _frameNumber: number;
  private _queryParamsString: string;
  private _queryParams: any;
  private _extensionsUsed: any;
  private _defaultGeometrySchema: any[];
  private _tiles: {[id: string]: Tile3D};

  // counter for tracking tiles requests
  private _pendingCount: any;

  // HOLD TRAVERSAL RESULTS
  private lastUpdatedVieports: any[] | null;
  private _requestedTiles: any;
  private _emptyTiles: any;
  private frameStateData: any;

  maximumMemoryUsage: number;

  // TODO CESIUM specific
  private _hasMixedContent: any;
  private _maximumScreenSpaceError: any;
  // EXTRACTED FROM TILESET
  private _properties: any;
  private _gltfUpAxis: any;
  private _dynamicScreenSpaceErrorComputedDensity: any;

  /**
   * Create a new Tileset3D
   * @param json
   * @param props
   */
  // eslint-disable-next-line max-statements
  constructor(json: any, options?: Tileset3DProps) {
    assert(json);

    // PUBLIC MEMBERS
    this.options = {...DEFAULT_PROPS, ...options};
    // raw data
    this.tileset = json;
    this.loader = json.loader;
    // could be  3d tiles, i3s
    this.type = json.type;
    // The url to a tileset JSON file.
    this.url = json.url;
    this.basePath = json.basePath || path.dirname(this.url);
    this.modelMatrix = this.options.modelMatrix;
    this.ellipsoid = this.options.ellipsoid;

    // Geometric error when the tree is not rendered at all
    this.lodMetricType = json.lodMetricType;
    this.lodMetricValue = json.lodMetricValue;
    this.refine = json.root.refine;

    // TODO add to loader context?
    this.loadOptions = this.options.loadOptions || {};
    if (this.options.headers) {
      this.loadOptions.fetch = {
        ...this.loadOptions.fetch,
        headers: this.options.headers
      };
    }
    if (this.options.token) {
      this.loadOptions.fetch = {
        ...this.loadOptions.fetch,
        token: this.options.token
      };
    }

    this.root = null;
    this.roots = {};
    // view props
    this.cartographicCenter = null;
    this.cartesianCenter = null;
    this.zoom = 1;
    this.boundingVolume = null;

    // TRAVERSAL
    this.traverseCounter = 0;
    this.geometricError = 0;
    this._traverser = this._initializeTraverser();
    this._cache = new TilesetCache();
    this._requestScheduler = new RequestScheduler({
      throttleRequests: this.options.throttleRequests,
      maxRequests: this.options.maxRequests
    });
    // update tracker
    // increase in each update cycle
    this._frameNumber = 0;

    // counter for tracking tiles requests
    this._pendingCount = 0;

    // HOLD TRAVERSAL RESULTS
    this._tiles = {};
    this.selectedTiles = [];
    this._emptyTiles = [];
    this._requestedTiles = [];
    this.frameStateData = {};
    this.lastUpdatedVieports = null;

    this._queryParams = {};
    this._queryParamsString = '';

    // METRICS
    // The maximum amount of GPU memory (in MB) that may be used to cache tiles.
    // Tiles not in view are unloaded to enforce this.
    this.maximumMemoryUsage = this.options.maximumMemoryUsage || 32;
    // The total amount of GPU memory in bytes used by the tileset.
    this.gpuMemoryUsageInBytes = 0;
    this.stats = new Stats({id: this.url});
    this._initializeStats();

    // TODO CESIUM specific
    this._hasMixedContent = false;
    this._maximumScreenSpaceError = this.options.maximumScreenSpaceError;
    // EXTRACTED FROM TILESET
    this._properties = undefined; // Metadata for per-model/point/etc properties
    this._extensionsUsed = undefined;
    this._gltfUpAxis = undefined;
    this._dynamicScreenSpaceErrorComputedDensity = 0.0; // Updated based on the camera position and direction
    // Metadata for the entire tileset
    this.extras = null;
    this.asset = {};
    this.credits = {};
    this.description = this.options.description || '';

    // TODO I3S Specific
    this._defaultGeometrySchema = [];

    this._initializeTileSet(json);
  }

  /** Release resources */
  destroy(): void {
    this._destroy();
  }

  /** Is the tileset loaded (update needs to have been called at least once) */
  isLoaded(): boolean {
    // Check that `_frameNumber !== 0` which means that update was called at least once
    return this._pendingCount === 0 && this._frameNumber !== 0;
  }

  get tiles(): object[] {
    return Object.values(this._tiles);
  }

  get frameNumber(): number {
    return this._frameNumber;
  }

  get queryParams(): string {
    if (!this._queryParamsString) {
      this._queryParamsString = getQueryParamString(this._queryParams);
    }
    return this._queryParamsString;
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
    return `${tilePath}${this.queryParams}`;
  }

  // TODO CESIUM specific
  hasExtension(extensionName: string): boolean {
    return Boolean(this._extensionsUsed && this._extensionsUsed.indexOf(extensionName) > -1);
  }

  /**
   * Update visible tiles relying on a list of viewports
   * @param viewports - list of viewports
   */
  // eslint-disable-next-line max-statements, complexity
  update(viewports: any[]): void {
    if ('loadTiles' in this.options && !this.options.loadTiles) {
      return;
    }
    if (this.traverseCounter > 0) {
      return;
    }
    if (!viewports && this.lastUpdatedVieports) {
      viewports = this.lastUpdatedVieports;
    } else {
      this.lastUpdatedVieports = viewports;
    }
    if (!(viewports instanceof Array)) {
      viewports = [viewports];
    }

    this._cache.reset();
    this._frameNumber++;
    this.traverseCounter = viewports.length;
    const viewportsToTraverse: string[] = [];
    // First loop to decrement traverseCounter
    for (const viewport of viewports) {
      const id = viewport.id as string;
      if (this._needTraverse(id)) {
        viewportsToTraverse.push(id);
      } else {
        this.traverseCounter--;
      }
    }

    // Second loop to traverse
    for (const viewport of viewports) {
      const id = viewport.id as string;
      if (!this.roots[id]) {
        this.roots[id] = this._initializeTileHeaders(this.tileset, null, this.basePath);
      }

      if (!viewportsToTraverse.includes(id)) {
        continue; // eslint-disable-line no-continue
      }
      const frameState = getFrameState(viewport, this._frameNumber);
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
    currentFrameStateData.selectedTiles = selectedTiles;
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

    for (const tile of this.selectedTiles) {
      this._tiles[tile.id] = tile;
    }

    this._loadTiles();
    this._unloadTiles();
    this._updateStats();
  }

  _tilesChanged(oldSelectedTiles, selectedTiles) {
    if (oldSelectedTiles.length !== selectedTiles.length) {
      return true;
    }
    const set1 = new Set(oldSelectedTiles.map((t) => t.id));
    const set2 = new Set(selectedTiles.map((t) => t.id));
    let changed = oldSelectedTiles.filter((x) => !set2.has(x.id)).length > 0;
    changed = changed || selectedTiles.filter((x) => !set1.has(x.id)).length > 0;
    return changed;
  }

  _loadTiles() {
    // Sort requests by priority before making any requests.
    // This makes it less likely this requests will be cancelled after being issued.
    // requestedTiles.sort((a, b) => a._priority - b._priority);
    for (const tile of this._requestedTiles) {
      if (tile.contentUnloaded) {
        this._loadTile(tile);
      }
    }
  }

  _unloadTiles() {
    // unload tiles from cache when hit maximumMemoryUsage
    this._cache.unloadTiles(this, (tileset, tile) => tileset._unloadTile(tile));
  }

  _updateStats() {
    let tilesRenderable = 0;
    let pointsRenderable = 0;
    for (const tile of this.selectedTiles) {
      if (tile.contentAvailable && tile.content) {
        tilesRenderable++;
        if (tile.content.pointCount) {
          pointsRenderable += tile.content.pointCount;
        }
      }
    }

    this.stats.get(TILES_IN_VIEW).count = this.selectedTiles.length;
    this.stats.get(TILES_RENDERABLE).count = tilesRenderable;
    this.stats.get(POINTS_COUNT).count = pointsRenderable;
  }

  _initializeTileSet(tilesetJson) {
    this.root = this._initializeTileHeaders(tilesetJson, null, this.basePath);

    // TODO CESIUM Specific
    if (this.type === TILESET_TYPE.TILES3D) {
      this._initializeCesiumTileset(tilesetJson);
    }

    if (this.type === TILESET_TYPE.I3S) {
      this._initializeI3STileset(tilesetJson);
    }
    // Calculate cartographicCenter & zoom props to help apps center view on tileset
    this._calculateViewProps();
  }

  // Called during initialize Tileset to initialize the tileset's cartographic center (longitude, latitude) and zoom.
  _calculateViewProps() {
    const root = this.root as Tile3D;
    assert(root);
    const {center} = root.boundingVolume;
    // TODO - handle all cases
    if (!center) {
      // eslint-disable-next-line
      console.warn('center was not pre-calculated for the root tile');
      this.cartographicCenter = new Vector3();
      this.zoom = 1;
      return;
    }
    this.cartographicCenter = Ellipsoid.WGS84.cartesianToCartographic(center, new Vector3());
    this.cartesianCenter = center;
    this.zoom = getZoomFromBoundingVolume(root.boundingVolume);
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
    this.stats.get(POINTS_COUNT, 'memory');
    this.stats.get(TILES_GPU_MEMORY, 'memory');
  }

  // Installs the main tileset JSON file or a tileset JSON file referenced from a tile.
  // eslint-disable-next-line max-statements
  _initializeTileHeaders(tilesetJson, parentTileHeader, basePath) {
    // A tileset JSON file referenced from a tile may exist in a different directory than the root tileset.
    // Get the basePath relative to the external tileset.
    const rootTile = new Tile3D(this, tilesetJson.root, parentTileHeader, basePath); // resource

    // If there is a parentTileHeader, add the root of the currently loading tileset
    // to parentTileHeader's children, and update its depth.
    if (parentTileHeader) {
      parentTileHeader.children.push(rootTile);
      rootTile.depth = parentTileHeader.depth + 1;
    }

    // Cesium 3d tiles knows the hierarchy beforehand
    if (this.type === TILESET_TYPE.TILES3D) {
      const stack: Tile3D[] = [];
      stack.push(rootTile);

      while (stack.length > 0) {
        const tile = stack.pop() as Tile3D;
        this.stats.get(TILES_TOTAL).incrementCount();
        const children = tile.header.children || [];
        for (const childHeader of children) {
          const childTile = new Tile3D(this, childHeader, tile, basePath);
          tile.children.push(childTile);
          childTile.depth = tile.depth + 1;
          stack.push(childTile);
        }
      }
    }

    return rootTile;
  }

  _initializeTraverser() {
    let TraverserClass;
    const type = this.type;
    switch (type) {
      case TILESET_TYPE.TILES3D:
        TraverserClass = Tileset3DTraverser;
        break;
      case TILESET_TYPE.I3S:
        TraverserClass = I3SetTraverser;
        break;
      default:
        TraverserClass = TilesetTraverser;
    }

    return new TraverserClass({
      basePath: this.basePath,
      onTraversalEnd: this._onTraversalEnd.bind(this)
    });
  }

  _destroyTileHeaders(parentTile) {
    this._destroySubtree(parentTile);
  }

  async _loadTile(tile) {
    let loaded;
    try {
      this._onStartTileLoading();
      loaded = await tile.loadContent();
    } catch (error) {
      this._onTileLoadError(tile, error);
    } finally {
      this._onEndTileLoading();
      this._onTileLoad(tile, loaded);
    }
  }

  _onTileLoadError(tile, error) {
    this.stats.get(TILES_LOAD_FAILED).incrementCount();

    const message = error.message || error.toString();
    const url = tile.url;
    // TODO - Allow for probe log to be injected instead of console?
    console.error(`A 3D tile failed to load: ${tile.url} ${message}`); // eslint-disable-line
    this.options.onTileError(tile, message, url);
  }

  _onTileLoad(tile, loaded) {
    if (!loaded) {
      return;
    }

    // add coordinateOrigin and modelMatrix to tile
    if (tile && tile.content) {
      calculateTransformProps(tile, tile.content);
    }

    this._addTileToCache(tile);
    this.options.onTileLoad(tile);
  }

  _onStartTileLoading() {
    this._pendingCount++;
    this.stats.get(TILES_LOADING).incrementCount();
  }

  _onEndTileLoading() {
    this._pendingCount--;
    this.stats.get(TILES_LOADING).decrementCount();
  }

  _addTileToCache(tile) {
    this._cache.add(this, tile, (tileset) => tileset._updateCacheStats(tile));
  }

  _updateCacheStats(tile) {
    this.stats.get(TILES_LOADED).incrementCount();
    this.stats.get(TILES_IN_MEMORY).incrementCount();

    // Good enough? Just use the raw binary ArrayBuffer's byte length.
    this.gpuMemoryUsageInBytes += tile.content.byteLength || 0;
    this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;
  }

  _unloadTile(tile) {
    this.gpuMemoryUsageInBytes -= (tile.content && tile.content.byteLength) || 0;

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

  _initializeCesiumTileset(tilesetJson) {
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
    this._extensionsUsed = tilesetJson.extensionsUsed;
    // Returns the extras property at the top of the tileset JSON (application specific metadata).
    this.extras = tilesetJson.extras;
  }

  _initializeI3STileset(tilesetJson) {
    if ('token' in this.options) {
      this._queryParams.token = this.options.token;
    }
    // Initialize default Geometry schema
    this._defaultGeometrySchema = tilesetJson.store.defaultGeometrySchema;
  }
}

function getQueryParamString(queryParams): string {
  const queryParamStrings: string[] = [];
  for (const key of Object.keys(queryParams)) {
    queryParamStrings.push(`${key}=${queryParams[key]}`);
  }
  switch (queryParamStrings.length) {
    case 0:
      return '';
    case 1:
      return `?${queryParamStrings[0]}`;
    default:
      return `?${queryParamStrings.join('&')}`;
  }
}
