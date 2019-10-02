import * as THREE from 'three';
import TileHeader from './tile-header';

export default class Tileset {
  constructor(json, styleParams, url) {
    this.url = url;
    this.version = json.asset.version;
    this.geometricError = json.geometricError;
    this.gltfUpAxis = 'Z';
    this.refine = json.refine ? json.refine.toUpperCase() : 'ADD';
    this.root = null;

    const resourcePath = THREE.LoaderUtils.extractUrlBase(url);
    this.root = new TileHeader(json.root, resourcePath, styleParams, this.refine, true);
  }

  update(frustum, cameraPosition) {
    this.root.checkLoad(frustum, cameraPosition);
  }
}
