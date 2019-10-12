import I3STraverser from './i3s-traverser';
import {parseI3SNodeGeometry} from '../parsers/parse-i3s-node-geometry';

export default class I3STileset {
  constructor(json, url, options) {
    this.url = url;
    this.options = options;
    this.metadata = json;
    this.root = json.root;

    this.results = {
      selectedTiles: null
    };

    this._traverser = new I3STraverser();
  }

  update(frameState) {
    this._traverser.traverse(this.root, frameState, this.options);
    this.results = this._traverser.results;

    if (this.results.selectedTiles) {
      for (const tile of this.results.selectedTiles) {
        this._loadTile(tile);
      }
    }
  }

  _loadTile(tile) {
    const featureData = this._loadFeatureData(tile);
    const geometryBuffer = this._loadGeometryBuffer(tile);
    tile.featureData = featureData;

    tile._content = parseI3SNodeGeometry(geometryBuffer, tile);
  }

  _loadFeatureData(tile) {
    if (this.options.files) {
      const featureDataPath = getTileFeaturePath(tile.id, 0);
      return this.options.files[featureDataPath];
    }
  }

  _loadGeometryBuffer(tile) {
    if (this.options.files) {
      const geometryBufferPath = getTileGeometryBufferPath(tile.id, 0);
      return this.options.files[geometryBufferPath];
    }
  }
}

export function fetchTileNode(node, options) {
  const files = options && options.files;
  const tilesetUrl = getTileMetaPath(node.id);
  return files && files[tilesetUrl];
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
