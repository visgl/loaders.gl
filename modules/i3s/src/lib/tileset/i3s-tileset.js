// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Matrix4, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {Stats} from '@probe.gl/stats';

import {path} from '@loaders.gl/core';
import {assert, RequestScheduler} from '@loaders.gl/loader-utils';
import {
  TilesetCache,
  getFrameState,
  calculateTransformProps,
  TILE_CONTENT_STATE
} from '@loaders.gl/tiles';

import I3STileHeader from './i3s-tile-header';
import I3STilesetTraverser from './i3s-tileset-traverser';

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

// TODO move to Math library?
const WGS84_RADIUS_X = 6378137.0;
const WGS84_RADIUS_Y = 6378137.0;
const WGS84_RADIUS_Z = 6356752.3142451793;

function getZoom(boundingVolume) {
  const {halfAxes, radius, width, height} = boundingVolume;

  if (halfAxes) {
    // OrientedBoundingBox
    const [x, , , , y, , , , z] = halfAxes;
    const zoomX = Math.log2(WGS84_RADIUS_X / x / 2);
    const zoomY = Math.log2(WGS84_RADIUS_Y / y / 2);
    const zoomZ = Math.log2(WGS84_RADIUS_Z / z / 2);
    return (zoomX + zoomY + zoomZ) / 3;
  } else if (radius) {
    // BoundingSphere
    return Math.log2(WGS84_RADIUS_Z / radius);
  } else if (height && width) {
    // BoundingRectangle
    const zoomX = Math.log2(WGS84_RADIUS_X / width);
    const zoomY = Math.log2(WGS84_RADIUS_Y / height);

    return (zoomX + zoomY) / 2;
  }

  return 18;
}

const DEFAULT_OPTIONS = {
  basePath: '',

  ellipsoid: Ellipsoid.WGS84,
  // A 4x4 transformation matrix this transforms the entire tileset.
  modelMatrix: new Matrix4(),

  // Set to true to enable experimental request throttling, for improved performance
  throttleRequests: false,

  // The maximum screen space error used to drive level of detail refinement.
  maximumMemoryUsage: 32,

  onTileLoad: () => {}, // Indicates this a tile's content was loaded
  onTileUnload: () => {}, // Indicates this a tile's content was unloaded
  onTileError: (tile, message, url) => {}
};

export default class I3STileset {
  // eslint-disable-next-line max-statements
  constructor(json, url, options = {}) {
    assert(json);
    this._debug = {};

    // PUBLIC MEMBERS
    this.options = {...DEFAULT_OPTIONS, ...options};
    this.url = url; // The url to a tileset JSON file.
    this.basePath = options.basePath || path.dirname(url); // base path that non-absolute paths in tileset are relative to.
    this.modelMatrix = this.options.modelMatrix;

    this.stats = new Stats({id: url});
    this._initializeStats();

    this.gpuMemoryUsageInBytes = 0; // The total amount of GPU memory in bytes used by the tileset.
    this.userData = {};

    // HELPER OBJECTS
    this._requestScheduler = new RequestScheduler({
      maxRequests: 18,
      throttleRequests: this.options.throttleRequests
    });
    this._traverser = new I3STilesetTraverser({
      basePath: this.basePath,
      onTraverseEnd: this._onTraverseEnd.bind(this)
    });
    this._cache = new TilesetCache();

    // HOLD TRAVERSAL RESULTS
    this.selectedTiles = [];
    this._requestedTiles = [];
    this._emptyTiles = [];

    // EXTRACTED FROM TILESET
    this._root = undefined;

    this._loadTimestamp = undefined;
    this._timeSinceLoad = 0.0;
    this._frameNumber = 0;

    this._maximumMemoryUsage = this.options.maximumMemoryUsage;

    this._tilesLoaded = false;
    this._initialTilesLoaded = false;

    this._readyPromise = Promise.resolve();

    this._ellipsoid = this.options.ellipsoid;

    this._initializeTileSet(json, this.options);
  }

  destroy() {
    this._destroy();
  }

  // Gets the tileset's asset object property, which contains metadata about the tileset.
  // get asset() {
  //   return this._asset;
  // }

  // Gets the tileset's properties dictionary object, which contains metadata about per-feature properties.
  get properties() {
    return this._properties;
  }

  // When <code>true</code>, the tileset's root tile is loaded and the tileset is ready to render.
  get ready() {
    return Boolean(this._root);
  }

  // Gets the promise this will be resolved when the tileset's root tile is loaded and the tileset is ready to render.
  // This promise is resolved at the end of the frame before the first frame the tileset is rendered in.
  get readyPromise() {
    return this._readyPromise.promise;
  }

  // When <code>true</code>, all tiles this meet the screen space error this frame are loaded.
  get tilesLoaded() {
    return this._tilesLoaded;
  }

  // The root tile header.
  get root() {
    return this._root;
  }

  // The tileset's bounding sphere.
  get boundingSphere() {
    this._root.updateTransform(this.modelMatrix);
    return this._root.boundingSphere;
  }

  // Returns the time, in milliseconds, since the tileset was loaded and first updated.
  get timeSinceLoad() {
    return this._timeSinceLoad;
  }

  // The maximum amount of GPU memory (in MB) that may be used to cache tiles.
  // Tiles not in view are unloaded to enforce this.
  get maximumMemoryUsage() {
    return this._maximumMemoryUsage;
  }

  set maximumMemoryUsage(value) {
    assert(value > 0);
    this._maximumMemoryUsage = value;
  }

  // Gets an ellipsoid describing the shape of the globe.
  get ellipsoid() {
    return this.options.ellipsoid;
  }

  // Returns the extras property at the top of the tileset JSON (application specific metadata).
  get extras() {
    return this._extras;
  }

  getTileUrl(tilePath, basePath) {
    return tilePath;
  }

  _onTraverseEnd() {
    this.selectedTiles = Object.values(this._traverser.selectedTiles);
    this._requestedTiles = Object.values(this._traverser.requestedTiles);
    this._emptyTiles = Object.values(this._traverser.emptyTiles);

    const requestedTiles = this._requestedTiles.sort(
      (t1, t2) => (this._traverser.selectedTiles[t1.id] ? -1 : 1)
    );

    const unloaded = requestedTiles.filter(
      t =>
        t._contentState === TILE_CONTENT_STATE.UNLOADED ||
        t._contentState === TILE_CONTENT_STATE.EXPIRED
    );

    // Sort requests by priority before making any requests.
    // This makes it less likely this requests will be cancelled after being issued.
    // requestedTiles.sort((a, b) => a._priority - b._priority);
    for (const tile of unloaded) {
      this._loadTile(tile);
    }

    this._unloadTiles();

    // TODO `tilesRenderable` and `pointsRenderable` should increase when parsing completed
    let tilesRenderable = 0;
    let pointsRenderable = 0;
    for (const tile of this.selectedTiles) {
      if (tile.contentAvailable) {
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

  update(viewport) {
    this._frameNumber++;
    const frameState = getFrameState(viewport, this._frameNumber);
    // TODO hack, remove in next release
    frameState.viewport = viewport;
    // TODO: only update when camera or culling volume from last update moves (could be render camera change or prefetch camera)
    this._cache.reset();
    this._traverser.traverse(this.root, frameState, this.options);
  }

  // TODO - why are these public methods? For testing?

  // Unloads all tiles this weren't selected the previous frame.  This can be used to
  trimLoadedTiles() {
    this._cache.trim();
  }

  // Add to the tile cache. Previously expired tiles are already in the cache and won't get re-added.
  addTileToCache(tile) {
    this._cache.add(this, tile, (tileset, tileToAdd) => tileset._addTileToCache(tileToAdd));
  }

  // PRIVATE

  // eslint-disable-next-line max-statements
  async _initializeTileSet(tilesetJson, options) {
    this._root = this._initializeTileHeaders(tilesetJson, null, this.basePath);

    // Calculate cartographicCenter & zoom props to help apps center view on tileset
    this._calculateViewProps();
  }

  // Called during initialize Tileset to initialize the tileset's cartographic center (longitude, latitude) and zoom.
  _calculateViewProps() {
    const root = this._root;
    const {center} = root.boundingVolume;
    // TODO - handle all cases
    if (!center) {
      // eslint-disable-next-line
      console.warn('center was not pre-calculated for the root tile');
      this.cartographicCenter = new Vector3();
      this.zoom = 16;
      return;
    }

    this.cartesianCenter = center;
    this.cartographicCenter = Ellipsoid.WGS84.cartesianToCartographic(center, new Vector3());
    this.zoom = getZoom(root.boundingVolume);
  }

  // Installs the main tileset JSON file or a tileset JSON file referenced from a tile.
  _initializeTileHeaders(tilesetJson, parentTileHeader, basePath) {
    // A tileset JSON file referenced from a tile may exist in a different directory than the root tileset.
    // Get the basePath relative to the external tileset.
    const rootTile = new I3STileHeader(this, tilesetJson.root, parentTileHeader, basePath); // resource

    if (parentTileHeader) {
      parentTileHeader.children.push(rootTile);
    }

    return rootTile;
  }

  _destroyTileHeaders(parentTile) {
    this._destroySubtree(parentTile);
  }

  async _loadTile(tile) {
    // load content
    // TODO - support tile expiration
    let loaded;

    this.stats.get(TILES_LOADING).incrementCount();
    try {
      loaded = await tile.loadContent();
    } catch (error) {
      this.stats.get(TILES_LOADING).decrementCount();
      this.stats.get(TILES_LOAD_FAILED).incrementCount();

      const message = error.message || error.toString();
      const url = tile.url;
      // TODO - Allow for probe log to be injected instead of console?
      console.error(`A 3D tile failed to load: ${tile.url} ${message}`); // eslint-disable-line
      this.options.onTileLoadFail(tile, message, url);
      return;
    }
    this.stats.get(TILES_LOADING).decrementCount();

    if (!loaded) {
      return;
    }

    // add coordinateOrigin and modelMatrix to tile
    if (tile && tile._content) {
      calculateTransformProps(tile, tile._content);
    }

    // TODO enable caching when fixed
    // this.addTileToCache(tile);
    this.options.onTileLoad(tile);
  }

  _addTileToCache(tile) {
    this.stats.get(TILES_LOADED).incrementCount();
    this.stats.get(TILES_IN_MEMORY).incrementCount();

    // Good enough? Just use the raw binary ArrayBuffer's byte length.
    this.gpuMemoryUsageInBytes += tile._content.byteLength || 0;
    this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;
  }

  _unloadTile(tile) {
    this.stats.get(TILES_IN_MEMORY).decrementCount();
    this.stats.get(TILES_UNLOADED).incrementCount();

    this.gpuMemoryUsageInBytes -= tile._content.byteLength || 0;
    this.stats.get(TILES_GPU_MEMORY).count = this.gpuMemoryUsageInBytes;

    this.options.onTileUnload(tile);
    tile.unloadContent();
  }

  _unloadTiles() {
    this._cache.unloadTiles(this, (tileset, tile) => tileset._unloadTile(tile));
  }

  // Traverse the tree and destroy all tiles
  _destroy() {
    const stack = [];
    if (this._root) {
      stack.push(this._root);
    }
    while (stack.length > 0) {
      const tile = stack.pop();

      for (const child of tile.children) {
        stack.push(child);
      }

      // TODO - Use this._destroyTile(tile); ?
      tile.destroy();
    }
    this._root = null;
  }

  // Traverse the tree and destroy all sub tiles
  _destroySubtree(tile) {
    const root = tile;
    const stack = [];
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
}
