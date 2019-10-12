import I3STraverser from './i3s-traverser';
import {parseI3SNodeGeometry} from '../parsers/parse-i3s-node-geometry';

export default class I3STileset {
  constructor(json, baseUrl, options = {}) {
    this.baseUrl = baseUrl;
    this.options = options;
    this.json = json;
    this.root = null;

    this.results = {
      selectedTiles: null
    };

    this._traverser = new I3STraverser({baseUrl});
  }

  async update(frameState) {
    if (!this.root) {
      this.root = await fetchRootNode(this.baseUrl, this.json.store.rootNode);
    }

    await this._traverser.traverse(this.root, frameState, this.options);
    this.results = this._traverser.results;

    if (this.results.selectedTiles) {
      for (const tile of this.results.selectedTiles) {
        await this._loadTile(tile);
      }
    }
  }

  async _loadTile(tile) {
    const featureData = await this._loadFeatureData(tile);
    const geometryBuffer = await this._loadGeometryBuffer(tile);
    tile.featureData = featureData;

    if (tile.textureData) {
      tile.texture = `${this.baseUrl}/nodes/${tile.id}/${tile.textureData[0].href}`;
    }

    tile._content = parseI3SNodeGeometry(geometryBuffer, tile);
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
