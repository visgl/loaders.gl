import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {CubeGeometry, SphereGeometry} from '@luma.gl/engine';
import {CompositeLayer, COORDINATE_SYSTEM, log} from '@deck.gl/core';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {BOUNDING_VOLUME_MESH_TYPE} from './constants';

const DEFAULT_BG_OPACITY = 100;
const GEOMETRY_STEP = 50;
const SINGLE_DATA = [0];

const defaultProps = {
  visible: false,
  tiles: [],
  material: {pbrMetallicRoughness: {baseColorFactor: [1, 1, 1, 1]}},
  getBoundingVolumeColor: {
    type: 'function',
    value: (tile) => [255, 255, 255, DEFAULT_BG_OPACITY],
    compare: false
  }
};

export default class BoundingVolumeLayer extends CompositeLayer {
  initializeState() {
    if ('onTileLoadFail' in this.props) {
      log.removed('onTileLoadFail', 'onTileError')();
    }

    this.state = {
      layerMap: {}
    };
  }

  updateState({changeFlags}) {
    if (changeFlags.propsChanged) {
      const {layerMap} = this.state;

      for (const key in layerMap) {
        layerMap[key].needsUpdate = true;
      }
    }
  }

  _generateCubeMesh(tile) {
    const geometry = new CubeGeometry();
    const {
      header: {
        obb: {halfSize, quaternion, center}
      }
    } = tile;
    const {attributes} = geometry;

    const POSITION = {
      ...attributes.POSITION,
      value: new Float32Array(attributes.POSITION.value)
    };
    const cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian(center);

    for (let i = 0; i < POSITION.value.length; i += 3) {
      const vec = new Vector3(POSITION.value.subarray(i, i + 3));
      vec.x *= halfSize[0];
      vec.y *= halfSize[1];
      vec.z *= halfSize[2];

      vec.transformByQuaternion(quaternion);
      vec.add(cartesianCenter);

      POSITION.value.set(vec, i);
    }
    geometry.attributes = {POSITION};
    return geometry;
  }

  _generateSphereMesh(tile) {
    const mbs = tile.header.mbs;
    const center = Ellipsoid.WGS84.cartographicToCartesian([mbs[0], mbs[1], mbs[2]]);
    const radius = mbs[3];
    const geometry = new SphereGeometry({
      radius,
      nlat: GEOMETRY_STEP,
      nlong: GEOMETRY_STEP
    });
    const {attributes} = geometry;
    const POSITION = {
      ...attributes.POSITION,
      value: new Float32Array(attributes.POSITION.value)
    };

    for (let i = 0; i < POSITION.value.length; i += 3) {
      const vec = new Vector3(POSITION.value.subarray(i, i + 3));
      vec.add(center);
      POSITION.value.set(vec, i);
    }
    geometry.attributes = {POSITION};
    return geometry;
  }

  _generateMesh(tile, meshType) {
    const cubeMesh = tile.header.obb ? this._generateCubeMesh(tile) : null;
    const sphereMesh = tile.header.mbs ? this._generateSphereMesh(tile) : null;

    tile.userData.boundingMeshes.cubeMesh = cubeMesh;
    tile.userData.boundingMeshes.sphereMesh = sphereMesh;

    return tile.userData.boundingMeshes[meshType];
  }

  _getBoundingVolumeLayer(tile) {
    const {content, viewportIds} = tile;
    const {material, getBoundingVolumeColor, boundingVolumeType} = this.props;
    const {cartographicOrigin, cartographicModelMatrix} = content;
    const meshType = BOUNDING_VOLUME_MESH_TYPE[boundingVolumeType];

    tile.userData.boundingMeshes = tile.userData.boundingMeshes || {};

    const mesh = tile.userData.boundingMeshes[meshType] || this._generateMesh(tile, meshType);

    return new SimpleMeshLayer({
      id: `bounding-volume-${tile.id}`,
      mesh,
      data: SINGLE_DATA,
      getPosition: [0, 0, 0],
      getColor: getBoundingVolumeColor(tile),
      viewportIds,
      material,
      modelMatrix: cartographicModelMatrix,
      coordinateOrigin: cartographicOrigin,
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS
    });
  }

  renderLayers() {
    const {visible, tiles} = this.props;

    if (!visible) {
      return null;
    }

    const {layerMap} = this.state;

    return tiles
      .map((tile) => {
        const id = tile.id;
        layerMap[id] = layerMap[id] || {};
        let {layer, needsUpdate = true} = layerMap[id];

        if (tile.selected) {
          if (!layer) {
            layer = this._getBoundingVolumeLayer(tile);
          } else if (needsUpdate) {
            layer = this._getBoundingVolumeLayer(tile);
            needsUpdate = false;
          } else if (!layer.props.visible) {
            layer = layer.clone({visible: true});
          }
        } else if (layer && layer.props.visible) {
          layer = layer.clone({visible: false});
        }

        layerMap[id] = {layer, needsUpdate};
        return layer;
      })
      .filter(Boolean);
  }
}

BoundingVolumeLayer.layerName = 'BoundingVolumeLayer';
BoundingVolumeLayer.defaultProps = defaultProps;
