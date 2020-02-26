// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {Matrix4, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {Stats} from '@probe.gl/stats';
import {path} from '@loaders.gl/core';
import {RequestScheduler, assert} from '@loaders.gl/loader-utils';
import {TilesetCache, calculateTransformProps, getFrameState} from '@loaders.gl/tiles';

import Tile3DHeader from './tile-3d-header';
import Tileset3DTraverser from './tileset-3d-traverser';

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

const scratchVector = new Vector3();

function getZoom(boundingVolume) {
  const {halfAxes, radius, width, height} = boundingVolume;

  if (halfAxes) {
    // OrientedBoundingBox
    halfAxes.getColumn(0, scratchVector);
    const x = scratchVector.len();
    halfAxes.getColumn(1, scratchVector);
    const y = scratchVector.len();
    halfAxes.getColumn(2, scratchVector);
    const z = scratchVector.len();

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
  maximumScreenSpaceError: 8,
  maximumMemoryUsage: 32,

  // default props
  dynamicScreenSpaceError: false,
  dynamicScreenSpaceErrorDensity: 0.00278,
  dynamicScreenSpaceErrorFactor: 4.0,

  // Optimization option. Determines if level of detail skipping should be applied during the traversal.
  skipLevelOfDetail: false,
  // The screen space error this must be reached before skipping levels of detail.
  baseScreenSpaceError: 1024,

  onTileLoad: () => {}, // Indicates this a tile's content was loaded
  onTileUnload: () => {}, // Indicates this a tile's content was unloaded
  onTileError: (tile, message, url) => {}
};

function getQueryParamString(queryParams) {
  const queryParamStrings = [];
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

export default class Tileset3D {
  // eslint-disable-next-line max-statements
  constructor(json, url, options = {}) {
    assert(json);

    // PUBLIC MEMBERS
    this.options = {...DEFAULT_OPTIONS, ...options};
    this.url = url; // The url to a tileset JSON file.
    this.basePath = path.dirname(url); // base path that non-absolute paths in tileset are relative to.
    this.modelMatrix = this.options.modelMatrix;
    this.stats = new Stats({id: url});
    this._initializeStats();

    this.gpuMemoryUsageInBytes = 0; // The total amount of GPU memory in bytes used by the tileset.
    this.geometricError = undefined; // Geometric error when the tree is not rendered at all
    this.userData = {};

    // HELPER OBJECTS
    this._queryParams = {};
    this._requestScheduler = new RequestScheduler({
      throttleRequests: this.options.throttleRequests
    });
    this._traverser = new Tileset3DTraverser();
    this._cache = new TilesetCache();

    // HOLD TRAVERSAL RESULTS
    this._processingQueue = [];
    this.selectedTiles = [];
    this._emptyTiles = [];
    this._requestedTiles = [];
    this._selectedTilesToStyle = [];

    // Metadata for the entire tileset
    this.asset = {};
    this.credits = {};
    this.description = this.options.description;

    // EXTRACTED FROM TILESET
    this._root = undefined;
    this._properties = undefined; // Metadata for per-model/point/etc properties
    this._extensionsUsed = undefined;
    this._gltfUpAxis = undefined;

    this._loadTimestamp = undefined;
    this._timeSinceLoad = 0.0;
    this._frameNumber = 0;
    this._extras = undefined;

    this._allTilesAdditive = true;
    this._hasMixedContent = false;
    this._maximumScreenSpaceError = this.options.maximumScreenSpaceError;
    this._maximumMemoryUsage = this.options.maximumMemoryUsage;

    this._tilesLoaded = false;
    this._initialTilesLoaded = false;

    this._readyPromise = Promise.resolve();

    this._classificationType = this.options.classificationType;
    this._ellipsoid = this.options.ellipsoid;

    this._dynamicScreenSpaceErrorComputedDensity = 0.0; // Updated based on the camera position and direction

    this._initializeTileSet(json, this.options);
  }

  destroy() {
    this._destroy();
  }

  // Gets the tileset's asset object property, which contains metadata about the tileset.
  // get asset() {
  //   return this._asset;
  // }
  get traverser() {
    return this._traverser;
  }

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

  get queryParams() {
    return getQueryParamString(this._queryParams);
  }

  // The root tile header.
  get root() {
    return this._root;
  }

  // The tileset's bounding sphere.
  get boundingSphere() {
    this._checkReady();
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
    const isDataUrl = url => url.startsWith('data:');
    return isDataUrl(tilePath)
      ? tilePath
      : `${basePath || this.basePath}/${tilePath}${this.queryParams}`;
  }

  // true if the tileset JSON file lists the extension in extensionsUsed
  hasExtension(extensionName) {
    return Boolean(this._extensionsUsed && this._extensionsUsed.indexOf(extensionName) > -1);
  }

  update(viewport) {
    // TODO: only update when camera or culling volume from last update moves (could be render camera change or prefetch camera)
    this._frameNumber++;
    let frameState;
    if ('frameNumber' in viewport) {
      // backward compatibility
      // this is using old API, input is `frameState` object
      // old API: update(frameState)
      frameState = viewport;
    } else {
      // TODO deprecated in v8.x
      frameState = getFrameState(viewport, this._frameNumber);
    }

    this._cache.reset();

    this._traverser.traverse(this.root, frameState, this.options);
    this._requestedTiles = Object.values(this._traverser.requestedTiles);
    this.selectedTiles = Object.values(this._traverser.selectedTiles);
    this._emptyTiles = Object.values(this._traverser.emptyTiles);

    const requestedTiles = this._requestedTiles;
    // Sort requests by priority before making any requests.
    // This makes it less likely this requests will be cancelled after being issued.
    // requestedTiles.sort((a, b) => a._priority - b._priority);
    for (const tile of requestedTiles) {
      this._loadTile(tile, frameState);
    }

    this._unloadTiles();

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

    return frameState.frameNumber;
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
  _initializeTileSet(tilesetJson, options) {
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
      attributions: options.attributions || []
    };

    this._properties = tilesetJson.properties;
    this.geometricError = tilesetJson.geometricError;
    this._extensionsUsed = tilesetJson.extensionsUsed;
    this._extras = tilesetJson.extras;

    // TODO - handle configurable glTF up axis
    // const gltfUpAxis = defined(tilesetJson.asset.gltfUpAxis)
    //   ? Axis.fromName(tilesetJson.asset.gltfUpAxis)
    //   : Axis.Y;

    this._root = this._initializeTileHeaders(tilesetJson, null, this.basePath);

    // Calculate cartographicCenter & zoom props to help apps center view on tileset
    this._calculateViewProps();

    // TODO - Do we need this?
    // Save the original, untransformed bounding volume position so we can apply
    // the tile transform and model matrix at run time
    // const boundingVolume = this._root.createBoundingVolume(
    //   tilesetJson.root.boundingVolume,
    //   Matrix4.IDENTITY
    // );
    // const clippingPlanesOrigin = boundingVolume.boundingSphere.center;
    // If this origin is above the surface of the earth
    // we want to apply an ENU orientation as our best guess of orientation.
    // Otherwise, we assume it gets its position/orientation completely from the
    // root tile transform and the tileset's model matrix
    // const originCartographic = this._ellipsoid.cartesianToCartographic(clippingPlanesOrigin);
    // if (
    //   originCartographic &&
    //   originCartographic.height > ApproximateTerrainHeights._defaultMinTerrainHeight
    // ) {
    //   this._initialClippingPlanesOriginMatrix = Transforms.eastNorthUpToFixedFrame(
    //     clippingPlanesOrigin
    //   );
    // }

    // this._clippingPlanesOriginMatrix = Matrix4.clone(this._initialClippingPlanesOriginMatrix);
    // this._readyPromise.resolve(this);
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
    this.cartographicCenter = Ellipsoid.WGS84.cartesianToCartographic(center, new Vector3());
    this.cartesianCenter = center;
    this.zoom = getZoom(root.boundingVolume);
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
    const rootTile = new Tile3DHeader(this, tilesetJson.root, parentTileHeader, basePath); // resource

    // If there is a parentTileHeader, add the root of the currently loading tileset
    // to parentTileHeader's children, and update its _depth.
    if (parentTileHeader) {
      parentTileHeader.children.push(rootTile);
      rootTile._depth = parentTileHeader._depth + 1;
    }

    const stack = [];
    stack.push(rootTile);

    while (stack.length > 0) {
      const tile = stack.pop();
      this.stats.get(TILES_TOTAL).incrementCount();
      // this._allTilesAdditive = this._allTilesAdditive && tile.refine === TILE_3D_REFINE.ADD;

      const children = tile._header.children || [];
      for (const childHeader of children) {
        const childTile = new Tile3DHeader(this, childHeader, tile, basePath);
        tile.children.push(childTile);
        childTile._depth = tile._depth + 1;
        stack.push(childTile);
      }

      // TODO:
      // if (this.options.cullWithChildrenBounds) {
      //   Tile3DOptimizations.checkChildrenWithinParent(tile);
      // }
    }

    return rootTile;
  }

  _destroyTileHeaders(parentTile) {
    this._destroySubtree(parentTile);
  }

  async _loadTile(tile, frameState) {
    // TODO - support tile expiration
    // const expired = tile.contentExpired;
    // if (expired) {
    //   if (tile.hasTilesetContent) {
    //     this._destroySubtree(tile);
    //   }
    // }

    let loaded;

    this.stats.get(TILES_LOADING).incrementCount();
    try {
      loaded = await tile.loadContent(frameState);
    } catch (error) {
      this.stats.get(TILES_LOADING).decrementCount();
      this.stats.get(TILES_LOAD_FAILED).incrementCount();

      const message = error.message || error.toString();
      const url = tile.url;
      // TODO - Allow for probe log to be injected instead of console?
      console.error(`A 3D tile failed to load: ${tile.url} ${message}`); // eslint-disable-line
      this.options.onTileError(tile, message, url);
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
}
