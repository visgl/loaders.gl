import * as THREE from 'three';
import THREETileset from '../threejs-3d-tiles/three-tileset';
import {transform2mapbox} from './web-mercator';

export default class Mapbox3DTilesLayer {
  constructor(params) {
    if (!params) throw new Error('parameters missing for mapbox 3D tiles layer');
    if (!params.id) throw new Error('id parameter missing for mapbox 3D tiles layer');
    if (!params.url) throw new Error('url parameter missing for mapbox 3D tiles layer');

    this.id = params.id;
    this.url = params.url;

    this.styleParams = {};
    if ('color' in params) this.styleParams.color = params.color;
    if ('opacity' in params) this.styleParams.opacity = params.opacity;
    if ('pointsize' in params) this.styleParams.pointsize = params.pointsize;

    this.loadStatus = 0;
    this.viewProjectionMatrix = null;

    this.type = 'custom';
    this.renderingMode = '3d';
  }

  async onAdd(map, gl) {
    this.map = map;
    this.rootTransform = transform2mapbox([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); // identity matrix tranformed to mapbox scale

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl
    });
    this.renderer.autoClear = false;

    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, -70, 100).normalize();
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0x999999);
    directionalLight2.position.set(0, 70, 100).normalize();
    this.scene.add(directionalLight2);

    const response = await fetch(this.url);
    const json = await response.json();

    this.tileset = new THREETileset(json, this.styleParams, this.url);

    if (this.tileset.root.transform) {
      this.rootTransform = transform2mapbox(this.tileset.root.transform);
    } else {
      this.rootTransform = transform2mapbox([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); // identity matrix tranformed to mapbox scale
    }

    if (this.tileset.root) {
      this.scene.add(this.tileset.root.totalContent);
    }

    this.loadStatus = 1;

    map.on('dragend', this.refresh.bind(this));
    map.on('moveend', this.refresh.bind(this));
  }

  render(gl, viewProjectionMatrix) {
    this.viewProjectionMatrix = viewProjectionMatrix;
    const l = new THREE.Matrix4().fromArray(viewProjectionMatrix);
    this.renderer.state.reset();

    // The root tile transform is applied to the camera while rendering
    // instead of to the root tile. This avoids precision errors.
    this.camera.projectionMatrix = l.multiply(this.rootTransform);

    this.renderer.render(this.scene, this.camera);

    if (this.loadStatus === 1) {
      // first render after root tile is loaded
      this.loadStatus = 2;
      const frustum = new THREE.Frustum();
      frustum.setFromMatrix(
        new THREE.Matrix4().multiplyMatrices(
          this.camera.projectionMatrix,
          this.camera.matrixWorldInverse
        )
      );

      if (this.tileset) {
        this.tileset.update(frustum, this._getCameraPosition());
      }
    }
  }

  // MAP CALLBACKS

  refresh() {
    const frustum = new THREE.Frustum();
    frustum.setFromMatrix(
      new THREE.Matrix4().multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      )
    );
    this.tileset.root.checkLoad(frustum, this._getCameraPosition());
  }

  // HELPERS

  _getCameraPosition() {
    if (!this.viewProjectionMatrix) {
      return new THREE.Vector3();
    }

    const cam = new THREE.Camera();
    const rootInverse = new THREE.Matrix4().getInverse(this.rootTransform);
    cam.projectionMatrix.elements = this.viewProjectionMatrix;
    cam.projectionMatrixInverse = new THREE.Matrix4().getInverse(cam.projectionMatrix); // add since three@0.103.0
    const campos = new THREE.Vector3(0, 0, 0).unproject(cam).applyMatrix4(rootInverse);
    return campos;
  }
}
