import * as THREE from 'three';
import {Tileset3D} from '@loaders.gl/3d-tiles';
import {Plane} from '@math.gl/culling';
import TileHeader from './tile-header';

export default class THREETileset {
  constructor(json, styleParams, url) {
    this.url = url;
    this.version = json.asset.version;
    this.geometricError = json.geometricError;
    this.gltfUpAxis = 'Z';
    this.refine = json.refine ? json.refine.toUpperCase() : 'ADD';
    this.root = null;

    const resourcePath = THREE.LoaderUtils.extractUrlBase(url);
    this.root = new TileHeader(json.root, resourcePath, styleParams, this.refine, true);

    this.tileset = new Tileset3D(json, url, {
      onTileLoad: (tile) => console.log('Load', tile), // eslint-disable-line
      onTileUnload: (tile) => console.log('Unload', tile) // eslint-disable-line
    });
  }

  update(frustum, cameraPosition) {
    this.root.checkLoad(frustum, cameraPosition);

    // Map to loaders.gl frameState
    const planes = frustum.planes.map((plane) => new Plane(plane.normal, plane.constant));

    const frameState = {
      camera: {
        position: cameraPosition
      },
      cullingVolume: planes
    };

    this.tileset.update(frameState);
  }
}
