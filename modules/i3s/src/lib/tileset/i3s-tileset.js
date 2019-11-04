import I3STraverser from './i3s-traverser';
import {parseI3SNodeGeometry} from '../parsers/parse-i3s-node-geometry';

import {TILE3D_CONTENT_STATE} from './i3s-tile-tree';
import RequestScheduler from '../request-utils/request-scheduler';

const DEFAULT_OPTIONS = {
  throttleRequests: true,

  onTileLoad: () => {
  }, // Indicates this a tile's content was loaded
  onTileUnload: () => {
  }, // Indicates this a tile's content was unloaded
  onTileLoadFail: (tile, message, url) => {
  }
};

function updatePriority(tile) {
  // Check if any reason to abort
  if (!tile._isVisible) {
    return -1;
  }
  if (tile._contentState === TILE3D_CONTENT_STATE.UNLOADED) {
    return -1;
  }
  return Math.max(1e7 - tile._priority, 0) || 0;
}

export default class I3STileset {
  constructor(json, baseUrl, options = DEFAULT_OPTIONS) {
    this.json = json;
    this.baseUrl = baseUrl;
    this.options = options;
    this.root = null;

    this.results = {
      selectedTiles: null
    };

    this._traverser = new I3STraverser({baseUrl});
    this._requestScheduler = new RequestScheduler({
      throttleRequests: this.options.throttleRequests
    });

    this._onTileLoad = options.onTileLoad;
    this._onTileLoadFail = options.onTileLoadFail;
    this._onTileUnload = options.onTileUnload;
  }

  async update(frameState) {
    if (!this.root) {
      this.root = await fetchRootNode(this.baseUrl, this.json.store.rootNode);
    }

    await this._traverser.startTraverse(this.root, frameState, this.options);
    this.results = this._traverser.results;

    if (this.results.selectedTiles) {
      const selectedTiles = Object.values(this.results.selectedTiles);
      for (const tile of selectedTiles) {
        if (tile._contentState === TILE3D_CONTENT_STATE.UNLOADED) {

          tile._contentState = TILE3D_CONTENT_STATE.LOADING_CONTENT;

          const cancelled = !(await this._requestScheduler.scheduleRequest(tile, updatePriority));

          if (cancelled) {
            tile._contentState = TILE3D_CONTENT_STATE.UNLOADED;
            continue;
          }

          try {
            this._requestScheduler.startRequest(tile);
            await this._loadTile(tile);
            this._requestScheduler.endRequest(tile);

            tile._contentState = TILE3D_CONTENT_STATE.READY;
            this._onTileLoad(tile);
          } catch (error) {
            // Tile is unloaded before the content finishes loading
            tile._contentState = TILE3D_CONTENT_STATE.FAILED;
            throw error;
          }
        }
      }
    }
  }

  async _loadTile(tile) {
    if (!tile) {
      return;
    }

    if (
      tile.attributes ||
      tile._contentState === TILE3D_CONTENT_STATE.READY || tile._contentState === TILE3D_CONTENT_STATE.UNLOADED
    ) {
      return;
    }

    if (!tile._isVisible) {
      return;
    }

    this._requestScheduler.startRequest(tile);
    const featureData = await this._loadFeatureData(tile);
    const geometryBuffer = await this._loadGeometryBuffer(tile);
    this._requestScheduler.endRequest(tile);

    tile.featureData = featureData;

    if (tile.content.textureData) {
      tile.texture = `${this.baseUrl}/nodes/${tile.id}/${tile.content.textureData[0].href}`;
    }

    parseI3SNodeGeometry(geometryBuffer, tile);

    tile._contentState = TILE3D_CONTENT_STATE.READY;
  }

  async _loadFeatureData(tile) {
    if (this.options.files) {
      const featureDataPath = getTileFeaturePath(tile.id, 0);
      return this.options.files[featureDataPath];
    } else {
      const featureData = tile.content.featureData[0];
      const featureDataPath = `${this.baseUrl}/nodes/${tile.id}/${featureData.href}`;
      return await fetch(featureDataPath).then(resp => resp.json());
    }
  }

  async _loadGeometryBuffer(tile) {
    if (this.options.files) {
      const geometryBufferPath = getTileGeometryBufferPath(tile.id, 0);
      return this.options.files[geometryBufferPath];
    } else {
      const geometryData = tile.content.geometryData[0];
      const geometryDataPath = `${this.baseUrl}/nodes/${tile.id}/${geometryData.href}`;
      return await fetch(geometryDataPath).then(resp => resp.arrayBuffer());
    }
  }
}

export async function fetchTileNode(baseUrl, nodeId) {
  const nodeUrl = `${baseUrl}/nodes/${nodeId}`;
  return await fetch(nodeUrl).then(resp => resp.json());
}

async function fetchRootNode(baseUrl, rootRef) {
  const rootUrl = `${baseUrl}/${rootRef}`;
  return await fetch(rootUrl).then(resp => resp.json());
}

function getTileMetaPath(nodeId) {
  return `nodes/${nodeId}/3dNodeIndexDocument.json.gz`;
}

function getTileFeaturePath(tileId, featureNumber) {
  return `nodes/${tileId}/features/${featureNumber}.json.gz`;
}

function getTileGeometryBufferPath(nodeId, geometryNumber) {
  return `nodes/${nodeId}/geometries/${geometryNumber}.bin.gz`;
}

function getTileSharedResourcePath(nodeId, featureNumber) {
  return `nodes/${nodeId}/shared/sharedResource.json.gz`;
}
