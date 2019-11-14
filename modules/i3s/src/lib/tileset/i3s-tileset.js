/* global fetch */

import I3STraverser from './i3s-traverser';
import {parseI3SNodeGeometry} from '../parsers/parse-i3s-node-geometry';

import {TILE3D_CONTENT_STATE} from './i3s-tile-tree';
import RequestScheduler from '../request-utils/request-scheduler';

const DEFAULT_OPTIONS = {
  throttleRequests: true,

  onTileLoad: () => {}, // Indicates this a tile's content was loaded
  onTileUnload: () => {}, // Indicates this a tile's content was unloaded
  onTileLoadFail: (tile, message, url) => {}
};

function updatePriority(tile) {
  // Check if any reason to abort
  if (!tile._isVisible) {
    return -1;
  }
  if (tile._contentState === TILE3D_CONTENT_STATE.UNLOADED) {
    return -1;
  }
  return Math.max(tile._priority, 0) || 0;
}

export default class I3STileset {
  constructor(json, baseUrl, options = DEFAULT_OPTIONS) {
    this.json = json;
    this.baseUrl = baseUrl;
    this.options = options;
    this.root = null;

    this.selectedTiles = null;

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
    this.selectedTiles = this._traverser.results.selectedTiles;

    if (!this.selectedTiles) {
      return;
    }

    const selectedTiles = Object.values(this.selectedTiles);
    for (const tile of selectedTiles) {
      // TODO simplify
      if (
        tile._isVisible &&
        tile._contentState === TILE3D_CONTENT_STATE.UNLOADED &&
        !tile.attributes
      ) {
        tile._contentState = TILE3D_CONTENT_STATE.LOADING_CONTENT;

        const canceled = !(await this._requestScheduler.scheduleRequest(tile, updatePriority));

        if (canceled) {
          tile._contentState = TILE3D_CONTENT_STATE.UNLOADED;
          // eslint-disable-next-line no-continue
          continue;
        }

        await this._loadTile(tile);
        tile._contentState = TILE3D_CONTENT_STATE.READY;
        this._onTileLoad(tile);
      }
    }
  }

  async _loadTile(tile) {
    if (!tile) {
      return;
    }

    const featureData = await this._loadFeatureData(tile);
    const geometryBuffer = await this._loadGeometryBuffer(tile);

    tile.featureData = featureData;

    if (tile.content.textureData) {
      tile.texture = `${this.baseUrl}/nodes/${tile.id}/${tile.content.textureData[0].href}`;
    }

    parseI3SNodeGeometry(geometryBuffer, tile);

    tile._contentState = TILE3D_CONTENT_STATE.READY;
  }

  async _loadFeatureData(tile) {
    const featureData = tile.content.featureData[0];
    const featureDataPath = `${this.baseUrl}/nodes/${tile.id}/${featureData.href}`;
    return await fetch(featureDataPath).then(resp => resp.json());
  }

  async _loadGeometryBuffer(tile) {
    const geometryData = tile.content.geometryData[0];
    const geometryDataPath = `${this.baseUrl}/nodes/${tile.id}/${geometryData.href}`;
    return await fetch(geometryDataPath).then(resp => resp.arrayBuffer());
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
