import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';

import {loadBatchedModelTile, loadPointTile} from './tile-parsers';

const DEBUG = false;

// Create a THREE.Box3 from a 3D Tiles OBB
function createTHREEBoxFromOBB(box) {
  const extent = [box[0] - box[3], box[1] - box[7], box[0] + box[3], box[1] + box[7]];
  const sw = new THREE.Vector3(extent[0], extent[1], box[2] - box[11]);
  const ne = new THREE.Vector3(extent[2], extent[3], box[2] + box[11]);
  return new THREE.Box3(sw, ne);
}

function createTHREEOutlineFromOBB(box) {
  const geom = new THREE.BoxGeometry(box[3] * 2, box[7] * 2, box[11] * 2);
  const edges = new THREE.EdgesGeometry(geom);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0x800000}));
  const trans = new THREE.Matrix4().makeTranslation(box[0], box[1], box[2]);
  line.applyMatrix(trans);
  return line;
}

export default class TileHeader {
  // eslint-disable-next-line max-statements
  constructor(json, resourcePath, styleParams, parentRefine, isRoot) {
    this.loaded = false;
    this.styleParams = styleParams;
    this.resourcePath = resourcePath;
    this.debug = DEBUG;

    this.extent = null;
    this.sw = null;
    this.ne = null;
    this.box = null;
    this.center = null;

    this._createTHREENodes();
    this.boundingVolume = json.boundingVolume;

    const box = this.boundingVolume && this.boundingVolume.box;
    if (box) {
      this.box = createTHREEBoxFromOBB(box);
      if (DEBUG) {
        this.totalContent.add(createTHREEOutlineFromOBB(box));
      }
    }

    this._initTraversal(json, parentRefine, isRoot);
  }

  _initTraversal(json, parentRefine, isRoot) {
    this.refine = json.refine ? json.refine.toUpperCase() : parentRefine;
    this.geometricError = json.geometricError;
    this.transform = json.transform;
    if (this.transform && !isRoot) {
      // if not the root tile: apply the transform to the THREE js Group
      // the root tile transform is applied to the camera while rendering
      this.totalContent.applyMatrix(new THREE.Matrix4().fromArray(this.transform));
    }
    this.content = json.content;
    this.children = [];
    if (json.children) {
      for (let i = 0; i < json.children.length; i++) {
        const child = new TileHeader(
          json.children[i],
          this.resourcePath,
          this.styleParams,
          this.refine,
          false
        );
        this.childContent.add(child.totalContent);
        this.children.push(child);
      }
    }
  }

  checkLoad(frustum, cameraPosition) {
    // is this tile visible?
    if (!frustum.intersectsBox(this.box)) {
      this.unload(true);
      return;
    }

    const dist = this.box.distanceToPoint(cameraPosition);

    // console.log(`dist: ${dist}, geometricError: ${this.geometricError}`);
    // are we too far to render this tile?
    if (this.geometricError > 0.0 && dist > this.geometricError * 50.0) {
      this.unload(true);
      return;
    }

    // should we load this tile?
    if (this.refine === 'REPLACE' && dist < this.geometricError * 20.0) {
      this.unload(false);
    } else {
      this.load();
    }

    // should we load its children?
    for (let i = 0; i < this.children.length; i++) {
      if (dist < this.geometricError * 20.0) {
        this.children[i].checkLoad(frustum, cameraPosition);
      } else {
        this.children[i].unload(true);
      }
    }
  }

  unload(includeChildren) {
    this.tileContent.visible = false;
    if (includeChildren) {
      this.childContent.visible = false;
    } else {
      this.childContent.visible = true;
    }
    // TODO: should we also free up memory?
  }

  // eslint-disable-next-line max-statements, complexity
  async load() {
    this.tileContent.visible = true;
    this.childContent.visible = true;
    if (this.loaded) {
      return;
    }
    this.loaded = true;

    if (this.content) {
      let url = this.content.uri ? this.content.uri : this.content.url;
      if (!url) return;
      if (url.substr(0, 4) !== 'http') url = this.resourcePath + url;
      const type = url.slice(-4);

      switch (type) {
        case 'json':
          // child is a tileset json
          const response = await fetch(url);
          const tileset = await response.json;
          // loadTileset(url, this.styleParams);
          this.children.push(tileset.root);
          if (tileset.root) {
            // eslint-disable-next-line max-depth
            if (tileset.root.transform) {
              // the root tile transform of a tileset is normally not applied because
              // it is applied by the camera while rendering. However, in case the tileset
              // is a subset of another tileset, so the root tile transform must be applied
              // to the THREE js group of the root tile.
              tileset.root.totalContent.applyMatrix(
                new THREE.Matrix4().fromArray(tileset.root.transform)
              );
            }
            this.childContent.add(tileset.root.totalContent);
          }
          break;

        case 'pnts':
          const pointTile = await loadPointTile(url);
          this._createPointNodes(pointTile, this.tileContent);
          break;

        case 'b3dm':
          const d = await loadBatchedModelTile(url);
          this._createGLTFNodes(d, this.tileContent);
          break;

        case 'i3dm':
          throw new Error('i3dm tiles not yet implemented');

        case 'cmpt':
          throw new Error('cmpt tiles not yet implemented');

        default:
          throw new Error(`invalid tile type: ${type}`);
      }
    }
  }

  // THREE.js instantiation

  _createTHREENodes() {
    this.totalContent = new THREE.Group(); // Three JS Object3D Group for this tile and all its children
    this.tileContent = new THREE.Group(); // Three JS Object3D Group for this tile's content
    this.childContent = new THREE.Group(); // Three JS Object3D Group for this tile's children
    this.totalContent.add(this.tileContent);
    this.totalContent.add(this.childContent);
  }

  _createPointNodes(d, tileContent) {
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(d.points, 3));
    const material = new THREE.PointsMaterial();
    material.size = this.styleParams.pointsize !== null ? this.styleParams.pointsize : 1.0;
    if (this.styleParams.color) {
      material.vertexColors = THREE.NoColors;
      material.color = new THREE.Color(this.styleParams.color);
      material.opacity = this.styleParams.opacity !== null ? this.styleParams.opacity : 1.0;
    } else if (d.rgba) {
      geometry.addAttribute('color', new THREE.Float32BufferAttribute(d.rgba, 4));
      material.vertexColors = THREE.VertexColors;
    } else if (d.rgb) {
      geometry.addAttribute('color', new THREE.Float32BufferAttribute(d.rgb, 3));
      material.vertexColors = THREE.VertexColors;
    }
    tileContent.add(new THREE.Points(geometry, material));
    if (d.rtc_center) {
      const c = d.rtc_center;
      tileContent.applyMatrix(new THREE.Matrix4().makeTranslation(c[0], c[1], c[2]));
    }
    tileContent.add(new THREE.Points(geometry, material));
    return tileContent;
  }

  _createGLTFNodes(d, tileContent) {
    const loader = new GLTFLoader();
    const rotateX = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI / 2);

    tileContent.applyMatrix(rotateX); // convert from GLTF Y-up to Z-up
    loader.parse(
      d.glbData,
      this.resourcePath,
      (gltf) => {
        if (this.styleParams.color !== null || this.styleParams.opacity !== null) {
          const color = new THREE.Color(this.styleParams.color);
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (this.styleParams.color !== null) child.material.color = color;
              if (this.styleParams.opacity !== null) {
                child.material.opacity = this.styleParams.opacity;
                child.material.transparent = this.styleParams.opacity < 1.0;
              }
            }
          });
        }
        /*
        const children = gltf.scene.children;
        for (let i=0; i<children.length; i++) {
          if (children[i].isObject3D)
            tileContent.add(children[i]);
        }
        */
        tileContent.add(gltf.scene);
      },
      (e) => {
        throw new Error(`error parsing gltf: ${e}`);
      }
    );
    return tileContent;
  }
}
